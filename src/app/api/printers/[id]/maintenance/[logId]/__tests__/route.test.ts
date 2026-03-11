// Mocks must be declared before any imports that depend on them
const mockGetServerSession = jest.fn()
const mockMaintenanceLogFindFirst = jest.fn()
const mockMaintenanceLogDelete = jest.fn()

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
    printerMaintenanceLog: {
      findFirst: (...args: unknown[]) => mockMaintenanceLogFindFirst(...args),
      delete: (...args: unknown[]) => mockMaintenanceLogDelete(...args),
    },
  },
}))

import { DELETE } from '../route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function makeRequest() {
  return {} as unknown as import('next/server').NextRequest
}

function makeParams(id = 'printer-1', logId = 'log-1') {
  return { params: { id, logId } }
}

function makeLogWithPrinter(tenantId = 'tenant-1') {
  return {
    id: 'log-1',
    printerId: 'printer-1',
    type: 'routine',
    notes: null,
    performedBy: null,
    performedAt: new Date('2024-06-01T10:00:00Z'),
    createdAt: new Date('2024-06-01T10:00:00Z'),
    printer: {
      tenantId,
    },
  }
}

describe('DELETE /api/printers/[id]/maintenance/[logId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })

    const res = await DELETE(makeRequest(), makeParams())

    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))

    const res = await DELETE(makeRequest(), makeParams())

    expect(res.status).toBe(403)
  })

  it('returns 404 when log does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockMaintenanceLogFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('printer-1', 'nonexistent-log'))

    expect(res.status).toBe(404)
  })

  it('returns 404 when log belongs to a printer from a different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    // Log exists but its printer belongs to tenant-B
    mockMaintenanceLogFindFirst.mockResolvedValue(makeLogWithPrinter('tenant-B'))

    const res = await DELETE(makeRequest(), makeParams())

    expect(res.status).toBe(404)
    // Ensure delete was never called
    expect(mockMaintenanceLogDelete).not.toHaveBeenCalled()
  })

  it('deletes log and returns 200 when log belongs to the caller tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-1' }))
    mockMaintenanceLogFindFirst.mockResolvedValue(makeLogWithPrinter('tenant-1'))
    mockMaintenanceLogDelete.mockResolvedValue({})

    const res = await DELETE(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('deleted', true)
    expect(mockMaintenanceLogDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'log-1' },
      })
    )
  })

  it('scopes log lookup to include printer tenantId', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockMaintenanceLogFindFirst.mockResolvedValue(makeLogWithPrinter('tenant-1'))
    mockMaintenanceLogDelete.mockResolvedValue({})

    await DELETE(makeRequest(), makeParams())

    expect(mockMaintenanceLogFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          printer: expect.objectContaining({
            select: expect.objectContaining({ tenantId: true }),
          }),
        }),
      })
    )
  })
})
