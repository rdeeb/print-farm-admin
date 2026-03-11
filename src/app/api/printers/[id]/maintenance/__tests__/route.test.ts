// Mocks must be declared before any imports that depend on them
const mockGetServerSession = jest.fn()
const mockPrinterFindFirst = jest.fn()
const mockPrinterUpdate = jest.fn()
const mockMaintenanceLogFindMany = jest.fn()
const mockMaintenanceLogCreate = jest.fn()

jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/api-response', () => ({
  apiError: (code: string, message: string, status: number) =>
    ({ status, json: () => Promise.resolve({ error: message, code }) }) as unknown as Response,
  apiSuccess: (data: unknown, status = 200) =>
    ({ status, json: () => Promise.resolve(data) }) as unknown as Response,
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    printer: {
      findFirst: (...args: unknown[]) => mockPrinterFindFirst(...args),
      update: (...args: unknown[]) => mockPrinterUpdate(...args),
    },
    printerMaintenanceLog: {
      findMany: (...args: unknown[]) => mockMaintenanceLogFindMany(...args),
      create: (...args: unknown[]) => mockMaintenanceLogCreate(...args),
    },
  },
}))

import { GET, POST } from '../route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function makeRequest(body?: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body ?? {}),
  } as unknown as import('next/server').NextRequest
}

function makeParams(id = 'printer-1') {
  return { params: { id } }
}

function makePrinter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'printer-1',
    tenantId: 'tenant-1',
    name: 'Test Printer',
    maintenanceIntervalDays: null,
    nextMaintenanceDue: null,
    ...overrides,
  }
}

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    printerId: 'printer-1',
    type: 'routine',
    notes: 'Oil rails',
    performedBy: 'Alice',
    performedAt: new Date('2024-06-01T10:00:00Z'),
    createdAt: new Date('2024-06-01T10:00:00Z'),
    ...overrides,
  }
}

describe('GET /api/printers/[id]/maintenance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })

    const res = await GET(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('returns 404 when printer not found', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('nonexistent'))

    expect(res.status).toBe(404)
  })

  it('returns 404 when printer belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    // The handler queries with tenantId filter, so findFirst returns null for cross-tenant
    mockPrinterFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('printer-other'))

    expect(res.status).toBe(404)
    // Verify tenant isolation: query must include caller's tenantId
    expect(mockPrinterFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('returns logs sorted by performedAt desc for valid printer', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    const logs = [
      makeLog({ id: 'log-2', performedAt: new Date('2024-07-01T00:00:00Z') }),
      makeLog({ id: 'log-1', performedAt: new Date('2024-06-01T00:00:00Z') }),
    ]
    mockMaintenanceLogFindMany.mockResolvedValue(logs)

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
    // Verify orderBy desc was requested
    expect(mockMaintenanceLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { performedAt: 'desc' },
      })
    )
  })

  it('returns empty array when printer has no logs', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    mockMaintenanceLogFindMany.mockResolvedValue([])

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })
})

describe('POST /api/printers/[id]/maintenance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrinterUpdate.mockResolvedValue({})
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const res = await POST(makeRequest({ type: 'routine' }), makeParams())

    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))

    const res = await POST(makeRequest({ type: 'routine' }), makeParams())

    expect(res.status).toBe(403)
  })

  it('returns 404 when printer belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockPrinterFindFirst.mockResolvedValue(null)

    const res = await POST(makeRequest({ type: 'routine' }), makeParams('printer-other'))

    expect(res.status).toBe(404)
  })

  it('returns 400 when type is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())

    const res = await POST(makeRequest({}), makeParams())

    expect(res.status).toBe(400)
  })

  it('creates a maintenance log and returns 201', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    const createdLog = makeLog()
    mockMaintenanceLogCreate.mockResolvedValue(createdLog)

    const res = await POST(
      makeRequest({ type: 'routine', notes: 'Oil rails', performedBy: 'Alice' }),
      makeParams()
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data).toHaveProperty('id', 'log-1')
    expect(data).toHaveProperty('type', 'routine')
  })

  it('does not update nextMaintenanceDue when maintenanceIntervalDays is null', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter({ maintenanceIntervalDays: null }))
    mockMaintenanceLogCreate.mockResolvedValue(makeLog())

    await POST(makeRequest({ type: 'routine' }), makeParams())

    expect(mockPrinterUpdate).not.toHaveBeenCalled()
  })

  it('auto-calculates nextMaintenanceDue when maintenanceIntervalDays is set', async () => {
    const performedAt = '2024-06-01T00:00:00.000Z'
    const intervalDays = 30

    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(
      makePrinter({ maintenanceIntervalDays: intervalDays })
    )
    mockMaintenanceLogCreate.mockResolvedValue(
      makeLog({ performedAt: new Date(performedAt) })
    )

    await POST(makeRequest({ type: 'routine', performedAt }), makeParams())

    expect(mockPrinterUpdate).toHaveBeenCalledTimes(1)
    const updateCall = mockPrinterUpdate.mock.calls[0][0]
    const nextDue: Date = updateCall.data.nextMaintenanceDue

    // Expected: performedAt + 30 days = 2024-07-01
    const expectedDate = new Date(performedAt)
    expectedDate.setDate(expectedDate.getDate() + intervalDays)
    expect(nextDue.getTime()).toBe(expectedDate.getTime())
  })

  it('uses current date when performedAt is not provided and calculates nextMaintenanceDue', async () => {
    const intervalDays = 7
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(
      makePrinter({ maintenanceIntervalDays: intervalDays })
    )
    mockMaintenanceLogCreate.mockResolvedValue(makeLog())

    const before = Date.now()
    await POST(makeRequest({ type: 'cleaning' }), makeParams())
    const after = Date.now()

    expect(mockPrinterUpdate).toHaveBeenCalledTimes(1)
    const updateCall = mockPrinterUpdate.mock.calls[0][0]
    const nextDue: Date = updateCall.data.nextMaintenanceDue

    // nextDue should be approximately now + 7 days
    const minExpected = new Date(before)
    minExpected.setDate(minExpected.getDate() + intervalDays)
    const maxExpected = new Date(after)
    maxExpected.setDate(maxExpected.getDate() + intervalDays)

    expect(nextDue.getTime()).toBeGreaterThanOrEqual(minExpected.getTime())
    expect(nextDue.getTime()).toBeLessThanOrEqual(maxExpected.getTime())
  })
})
