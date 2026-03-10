// Mocks must be declared before any imports that depend on them
const mockGetServerSession = jest.fn()
const mockPrintJobFindFirst = jest.fn()
const mockPrintJobUpdate = jest.fn()
const mockOrderPartFindFirst = jest.fn()
const mockOrderPartUpdate = jest.fn()
const mockOrderPartCount = jest.fn()
const mockOrderUpdate = jest.fn()
const mockTransaction = jest.fn()
const mockCreateNotification = jest.fn()

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
      update: (...args: unknown[]) => mockPrintJobUpdate(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}))

jest.mock('@/lib/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

import { PATCH } from '../[id]/route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function createRequest(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as import('next/server').NextRequest
}

function makeParams(id = 'job-1') {
  return { params: { id } }
}

const baseQueuedJob = {
  id: 'job-1',
  status: 'QUEUED',
  tenantId: 'tenant-1',
  orderId: 'order-1',
  partId: 'part-1',
  part: { name: 'Bracket A' },
}

const basePrintingJob = {
  ...baseQueuedJob,
  status: 'PRINTING',
}

const baseCompletedJob = {
  ...baseQueuedJob,
  status: 'COMPLETED',
}

// Helper to set up a working $transaction mock that executes the callback
function setupTransactionMock() {
  mockTransaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      printJob: { update: mockPrintJobUpdate },
      orderPart: {
        findFirst: mockOrderPartFindFirst,
        update: mockOrderPartUpdate,
        count: mockOrderPartCount,
      },
      order: { update: mockOrderUpdate },
    }
    return fn(tx)
  })
}

describe('PATCH /api/queue/[id] — FAILED status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: transaction runs the callback
    setupTransactionMock()
    // Default: no remaining active parts, no printed parts, 1 total
    mockOrderPartCount.mockResolvedValue(0)
    mockOrderPartFindFirst.mockResolvedValue(null)
    mockOrderPartUpdate.mockResolvedValue({})
    mockPrintJobUpdate.mockResolvedValue({})
    mockOrderUpdate.mockResolvedValue({})
    mockCreateNotification.mockResolvedValue({ id: 'notif-1' })
  })

  describe('FAILED — QUEUED job', () => {
    it('marks a QUEUED job as FAILED with 200', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Filament Jam' }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })

    it('sets failureReason and failureNotes on the print job record', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Bed Adhesion', failureNotes: 'First layer came off' }),
        makeParams()
      )

      expect(mockPrintJobUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'Bed Adhesion',
            failureNotes: 'First layer came off',
          }),
        })
      )
    })

    it('sets endTime on the print job record', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(mockPrintJobUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endTime: expect.any(Date),
          }),
        })
      )
    })
  })

  describe('FAILED — PRINTING job', () => {
    it('marks a PRINTING job as FAILED with 200', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(basePrintingJob)

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Power Loss' }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })

    it('sets failureReason and null failureNotes when notes not provided', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(basePrintingJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Stringing' }),
        makeParams()
      )

      expect(mockPrintJobUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: 'Stringing',
            failureNotes: null,
          }),
        })
      )
    })
  })

  describe('FAILED — COMPLETED job (invalid transition)', () => {
    it('returns 400 when trying to mark a COMPLETED job as FAILED', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseCompletedJob)

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(res.status).toBe(400)
    })

    it('returns an error message explaining which statuses are allowed', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseCompletedJob)

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      const data = await res.json()
      expect(data.error).toMatch(/queued or printing/i)
    })

    it('does not call $transaction when status transition is invalid', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseCompletedJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  describe('notification', () => {
    it('calls createNotification with JOB_FAILED type on success', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Warping' }),
        makeParams()
      )

      expect(mockCreateNotification).toHaveBeenCalledTimes(1)
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          type: 'JOB_FAILED',
          dedupeKey: 'job-1',
        })
      )
    })

    it('includes the part name and failure reason in the notification message', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Filament Jam' }),
        makeParams()
      )

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Bracket A'),
        })
      )
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Filament Jam'),
        })
      )
    })

    it('still returns 200 when createNotification throws', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)
      mockCreateNotification.mockRejectedValue(new Error('Notification service unavailable'))

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })

    it('does not fire notification when job transition is invalid', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseCompletedJob)

      await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(mockCreateNotification).not.toHaveBeenCalled()
    })
  })

  describe('validation', () => {
    it('returns 400 when failureReason exceeds 100 characters', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      const longReason = 'A'.repeat(101)
      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: longReason }),
        makeParams()
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 when failureNotes exceeds 500 characters', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      const longNotes = 'B'.repeat(501)
      const res = await PATCH(
        createRequest({ status: 'FAILED', failureNotes: longNotes }),
        makeParams()
      )

      expect(res.status).toBe(400)
    })

    it('accepts failureReason of exactly 100 characters', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      const exactReason = 'A'.repeat(100)
      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: exactReason }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })

    it('accepts failureNotes of exactly 500 characters', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(baseQueuedJob)

      const exactNotes = 'B'.repeat(500)
      const res = await PATCH(
        createRequest({ status: 'FAILED', failureNotes: exactNotes }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })

    it('returns 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(res.status).toBe(401)
    })

    it('returns 403 when user is VIEWER', async () => {
      mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(res.status).toBe(403)
    })

    it('returns 404 when print job not found', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobFindFirst.mockResolvedValue(null)

      const res = await PATCH(
        createRequest({ status: 'FAILED', failureReason: 'Other' }),
        makeParams()
      )

      expect(res.status).toBe(404)
    })
  })
})
