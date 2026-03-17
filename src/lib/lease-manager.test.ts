/** @jest-environment node */

// ---------------------------------------------------------------------------
// Prisma mock — must be declared before imports
// ---------------------------------------------------------------------------

const mockFindUnique = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateMany = jest.fn()
const mockFindMany = jest.fn()

const mockTx = {
  printerReporterLease: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: {
    printerReporterLease: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) => callback(mockTx)),
  },
}))

import { acquireOrRenewLease, releaseLease, getActiveLease, findExpiredLeases } from './lease-manager'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant-1'
const PRINTER_ID = 'printer-1'
const AGENT_ID = 'agent-1'
const OTHER_AGENT_ID = 'agent-2'

function makeOpts(overrides: Partial<Parameters<typeof acquireOrRenewLease>[0]> = {}) {
  return {
    tenantId: TENANT_ID,
    printerId: PRINTER_ID,
    connectorAgentId: AGENT_ID,
    leaseDurationMs: 30_000,
    ...overrides,
  }
}

function futureDate(offsetMs = 30_000): Date {
  return new Date(Date.now() + offsetMs)
}

function pastDate(offsetMs = 30_000): Date {
  return new Date(Date.now() - offsetMs)
}

function makeLease(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lease-1',
    tenantId: TENANT_ID,
    printerId: PRINTER_ID,
    activeConnectorAgentId: AGENT_ID,
    leaseVersion: 1,
    leaseExpiresAt: futureDate(),
    lastSwitchReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// acquireOrRenewLease
// ---------------------------------------------------------------------------

describe('acquireOrRenewLease', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // Re-setup $transaction mock after reset
    ;(prisma.$transaction as jest.Mock).mockImplementation(
      (callback: (tx: typeof mockTx) => unknown) => callback(mockTx)
    )
  })

  it('1. no existing lease → creates new lease, returns ACTIVE', async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({})

    const result = await acquireOrRenewLease(makeOpts())

    expect(result.role).toBe('ACTIVE')
    expect(result.leaseExpiresAt).toBeInstanceOf(Date)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          printerId: PRINTER_ID,
          activeConnectorAgentId: AGENT_ID,
          leaseVersion: 1,
        }),
      }),
    )
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
  })

  it('2. existing lease belongs to this connector, not expired → renews, returns ACTIVE', async () => {
    mockFindUnique.mockResolvedValue(makeLease({ leaseExpiresAt: futureDate() }))
    mockUpdate.mockResolvedValue({})

    const result = await acquireOrRenewLease(makeOpts())

    expect(result.role).toBe('ACTIVE')
    expect(result.leaseExpiresAt).toBeInstanceOf(Date)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { printerId: PRINTER_ID },
        data: expect.objectContaining({ leaseExpiresAt: expect.any(Date) }),
      }),
    )
    expect(mockCreate).not.toHaveBeenCalled()
    // Renewal must NOT increment leaseVersion
    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.data).not.toHaveProperty('leaseVersion')
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
  })

  it('3. existing lease belongs to different connector, not expired → returns STANDBY, does NOT update the lease', async () => {
    mockFindUnique.mockResolvedValue(
      makeLease({
        activeConnectorAgentId: OTHER_AGENT_ID,
        leaseExpiresAt: futureDate(),
      }),
    )

    const result = await acquireOrRenewLease(makeOpts())

    expect(result.role).toBe('STANDBY')
    expect(result.leaseExpiresAt).toBeUndefined()
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
  })

  it('4. existing lease belongs to different connector, IS expired → takes over, increments leaseVersion, sets lastSwitchReason, returns ACTIVE', async () => {
    mockFindUnique.mockResolvedValue(
      makeLease({
        activeConnectorAgentId: OTHER_AGENT_ID,
        leaseExpiresAt: pastDate(),
      }),
    )
    mockUpdate.mockResolvedValue({})

    const result = await acquireOrRenewLease(makeOpts())

    expect(result.role).toBe('ACTIVE')
    expect(result.leaseExpiresAt).toBeInstanceOf(Date)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { printerId: PRINTER_ID },
        data: expect.objectContaining({
          activeConnectorAgentId: AGENT_ID,
          leaseVersion: { increment: 1 },
          lastSwitchReason: 'heartbeat_timeout',
          leaseExpiresAt: expect.any(Date),
        }),
      }),
    )
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    )
  })
})

// ---------------------------------------------------------------------------
// releaseLease
// ---------------------------------------------------------------------------

describe('releaseLease', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('5. connector holds the lease → updateMany called with correct where clause, sets leaseExpiresAt to past', async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 })

    await releaseLease(TENANT_ID, PRINTER_ID, AGENT_ID)

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          printerId: PRINTER_ID,
          tenantId: TENANT_ID,
          activeConnectorAgentId: AGENT_ID,
        },
        data: expect.objectContaining({
          leaseExpiresAt: expect.any(Date),
        }),
      }),
    )
    // Verify the date set is in the past
    const callArgs = mockUpdateMany.mock.calls[0][0]
    expect(callArgs.data.leaseExpiresAt.getTime()).toBeLessThan(Date.now())
  })

  it('6. connector does NOT hold the lease → updateMany still called with restrictive where, no-op', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 })

    // Call with a different agent ID that doesn't hold the lease
    await expect(releaseLease(TENANT_ID, PRINTER_ID, OTHER_AGENT_ID)).resolves.toBeUndefined()

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          activeConnectorAgentId: OTHER_AGENT_ID,
        }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// getActiveLease
// ---------------------------------------------------------------------------

describe('getActiveLease', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('7. valid unexpired lease exists → returns activeConnectorAgentId', async () => {
    mockFindUnique.mockResolvedValue(makeLease({ leaseExpiresAt: futureDate() }))

    const result = await getActiveLease(TENANT_ID, PRINTER_ID)

    expect(result).toBe(AGENT_ID)
  })

  it('8. expired lease exists → returns null', async () => {
    mockFindUnique.mockResolvedValue(makeLease({ leaseExpiresAt: pastDate() }))

    const result = await getActiveLease(TENANT_ID, PRINTER_ID)

    expect(result).toBeNull()
  })

  it('9. no lease exists → returns null', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getActiveLease(TENANT_ID, PRINTER_ID)

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// findExpiredLeases
// ---------------------------------------------------------------------------

describe('findExpiredLeases', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('10. returns printerIds for leases past expiry', async () => {
    const expiredLeases = [
      { printerId: 'printer-1' },
      { printerId: 'printer-2' },
      { printerId: 'printer-3' },
    ]
    mockFindMany.mockResolvedValue(expiredLeases)

    const result = await findExpiredLeases(TENANT_ID)

    expect(result).toEqual(['printer-1', 'printer-2', 'printer-3'])
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT_ID }),
        select: { printerId: true },
      }),
    )
  })
})
