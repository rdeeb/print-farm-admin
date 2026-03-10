// Mocks must be declared before any imports that depend on them
const mockGetServerSession = jest.fn()
const mockPrintJobFindFirst = jest.fn()
const mockPrintJobCreate = jest.fn()
const mockOrderFindFirst = jest.fn()
const mockProjectPartFindFirst = jest.fn()

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
    printJob: {
      findFirst: (...args: unknown[]) => mockPrintJobFindFirst(...args),
      create: (...args: unknown[]) => mockPrintJobCreate(...args),
    },
    order: {
      findFirst: (...args: unknown[]) => mockOrderFindFirst(...args),
    },
    projectPart: {
      findFirst: (...args: unknown[]) => mockProjectPartFindFirst(...args),
    },
  },
}))

import { POST } from '../[id]/reprint/route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      id: 'user-1',
      ...overrides,
    },
  }
}

function makeRequest() {
  return {} as unknown as import('next/server').NextRequest
}

function makeParams(id = 'job-1') {
  return { params: { id } }
}

const baseCompletedJob = {
  id: 'job-1',
  status: 'COMPLETED',
  tenantId: 'tenant-1',
  orderId: 'order-1',
  partId: 'part-1',
  printerId: 'printer-1',
  spoolId: 'spool-1',
  priority: 1,
  estimatedTime: 120,
  notes: 'Original notes',
}

const baseOrder = { id: 'order-1', tenantId: 'tenant-1' }
const basePart = { id: 'part-1' }
const newJob = { id: 'new-job-1', status: 'QUEUED' }

describe('POST /api/queue/[id]/reprint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrintJobFindFirst.mockResolvedValue(baseCompletedJob)
    mockOrderFindFirst.mockResolvedValue(baseOrder)
    mockProjectPartFindFirst.mockResolvedValue(basePart)
    mockPrintJobCreate.mockResolvedValue(newJob)
  })

  describe('authentication & authorization', () => {
    it('returns 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(401)
    })

    it('returns 401 when session has no tenantId', async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN', id: 'user-1' } })

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(401)
    })

    it('returns 403 when user role is VIEWER', async () => {
      mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(403)
    })
  })

  describe('successful reprint', () => {
    it('returns 201 with the new job id on success', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      const res = await POST(makeRequest(), makeParams())
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data).toHaveProperty('id', 'new-job-1')
    })

    it('creates the new job with status QUEUED', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'QUEUED' }),
        })
      )
    })

    it('creates the new job with printerId set to null', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ printerId: null }),
        })
      )
    })

    it('creates the new job with spoolId set to null', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ spoolId: null }),
        })
      )
    })

    it('copies original job fields to the new job', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            orderId: 'order-1',
            partId: 'part-1',
            priority: 1,
            estimatedTime: 120,
            notes: 'Original notes',
          }),
        })
      )
    })

    it('resets startTime, endTime, actualTime, failureReason, failureNotes to null', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startTime: null,
            endTime: null,
            actualTime: null,
            failureReason: null,
            failureNotes: null,
          }),
        })
      )
    })

    it('sets createdById to the current user id', async () => {
      mockGetServerSession.mockResolvedValue(makeSession({ id: 'user-99' }))

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdById: 'user-99' }),
        })
      )
    })

    it('scopes the original job lookup to the tenant', async () => {
      mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-42' }))
      mockPrintJobFindFirst.mockResolvedValue({ ...baseCompletedJob, tenantId: 'tenant-42' })
      mockOrderFindFirst.mockResolvedValue({ ...baseOrder, tenantId: 'tenant-42' })

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-42' }),
        })
      )
    })
  })

  describe('not found', () => {
    it('returns 404 when job does not belong to the tenant', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(null)

      const res = await POST(makeRequest(), makeParams('non-existent-job'))

      expect(res.status).toBe(404)
    })

    it('returns a not found error message', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(null)

      const res = await POST(makeRequest(), makeParams('non-existent-job'))
      const data = await res.json()

      expect(data.error).toBeTruthy()
    })
  })

  describe('invalid status for reprint', () => {
    it('returns 400 when trying to reprint a QUEUED job', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue({ ...baseCompletedJob, status: 'QUEUED' })

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(400)
    })

    it('returns 400 when trying to reprint a PRINTING job', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue({ ...baseCompletedJob, status: 'PRINTING' })

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(400)
    })

    it('does not create a new job when status is invalid', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue({ ...baseCompletedJob, status: 'QUEUED' })

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).not.toHaveBeenCalled()
    })

    it('allows reprinting a FAILED job', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue({ ...baseCompletedJob, status: 'FAILED' })

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(201)
    })

    it('allows reprinting a CANCELLED job', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue({ ...baseCompletedJob, status: 'CANCELLED' })

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(201)
    })
  })

  describe('order and part validation', () => {
    it('returns 400 when the original order no longer exists', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockOrderFindFirst.mockResolvedValue(null)

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(400)
    })

    it('returns 400 when the original part no longer exists', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockProjectPartFindFirst.mockResolvedValue(null)

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(400)
    })

    it('returns 400 when both order and part are missing', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockOrderFindFirst.mockResolvedValue(null)
      mockProjectPartFindFirst.mockResolvedValue(null)

      const res = await POST(makeRequest(), makeParams())

      expect(res.status).toBe(400)
    })

    it('does not create a new job when the order is missing', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockOrderFindFirst.mockResolvedValue(null)

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).not.toHaveBeenCalled()
    })

    it('does not create a new job when the part is missing', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockProjectPartFindFirst.mockResolvedValue(null)

      await POST(makeRequest(), makeParams())

      expect(mockPrintJobCreate).not.toHaveBeenCalled()
    })
  })
})
