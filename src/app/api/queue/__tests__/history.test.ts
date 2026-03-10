// Mocks must be declared before any imports that depend on them
const mockGetServerSession = jest.fn()
const mockPrintJobCount = jest.fn()
const mockPrintJobFindMany = jest.fn()

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
      count: (...args: unknown[]) => mockPrintJobCount(...args),
      findMany: (...args: unknown[]) => mockPrintJobFindMany(...args),
    },
  },
}))

import { GET } from '../history/route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/queue/history')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return { url: url.toString() } as unknown as import('next/server').NextRequest
}

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    status: 'COMPLETED',
    tenantId: 'tenant-1',
    orderId: 'order-1',
    partId: 'part-1',
    printerId: 'printer-1',
    spoolId: 'spool-1',
    failureReason: null,
    failureNotes: null,
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:30:00Z'),
    createdAt: new Date('2024-01-01T09:00:00Z'),
    part: { id: 'part-1', name: 'Bracket A' },
    order: { id: 'order-1', orderNumber: 'ORD-001' },
    printer: { id: 'printer-1', name: 'Printer Alpha' },
    spool: {
      id: 'spool-1',
      filamentId: 'fil-1',
      filament: {
        brand: 'Hatchbox',
        color: { name: 'Red', hex: '#FF0000' },
      },
    },
    ...overrides,
  }
}

describe('GET /api/queue/history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrintJobCount.mockResolvedValue(0)
    mockPrintJobFindMany.mockResolvedValue([])
  })

  describe('authentication', () => {
    it('returns 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const res = await GET(makeRequest())

      expect(res.status).toBe(401)
    })

    it('returns 401 when session has no tenantId', async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })

      const res = await GET(makeRequest())

      expect(res.status).toBe(401)
    })
  })

  describe('tenant scoping', () => {
    it('scopes the query to the tenant from the session', async () => {
      mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-42' }))
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([makeJob({ tenantId: 'tenant-42' })])

      await GET(makeRequest())

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-42' }),
        })
      )
      expect(mockPrintJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-42' }),
        })
      )
    })

    it('returns 200 with jobs and pagination info', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([makeJob()])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toHaveProperty('jobs')
      expect(data).toHaveProperty('total', 1)
      expect(data).toHaveProperty('page', 1)
      expect(data).toHaveProperty('totalPages', 1)
    })
  })

  describe('pagination', () => {
    it('uses default page=1 and limit=20', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(0)
      mockPrintJobFindMany.mockResolvedValue([])

      await GET(makeRequest())

      expect(mockPrintJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      )
    })

    it('applies page and limit params correctly', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(50)
      mockPrintJobFindMany.mockResolvedValue([])

      await GET(makeRequest({ page: '3', limit: '10' }))

      expect(mockPrintJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      )
    })

    it('calculates totalPages correctly', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(45)
      mockPrintJobFindMany.mockResolvedValue([])

      const res = await GET(makeRequest({ limit: '10' }))
      const data = await res.json()

      expect(data.totalPages).toBe(5)
    })

    it('caps limit at 100', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(0)
      mockPrintJobFindMany.mockResolvedValue([])

      await GET(makeRequest({ limit: '999' }))

      expect(mockPrintJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      )
    })

    it('uses page=1 minimum when page param is 0 or negative', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(0)
      mockPrintJobFindMany.mockResolvedValue([])

      await GET(makeRequest({ page: '0' }))

      expect(mockPrintJobFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      )
    })

    it('returns page number in response', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(100)
      mockPrintJobFindMany.mockResolvedValue([])

      const res = await GET(makeRequest({ page: '4', limit: '10' }))
      const data = await res.json()

      expect(data.page).toBe(4)
    })
  })

  describe('status filter', () => {
    it('defaults to COMPLETED, FAILED, CANCELLED when no status param', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest())

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: expect.arrayContaining(['COMPLETED', 'FAILED', 'CANCELLED']) },
          }),
        })
      )
    })

    it('filters by a single status value', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ status: 'FAILED' }))

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['FAILED'] },
          }),
        })
      )
    })

    it('filters by comma-separated status values', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ status: 'COMPLETED,FAILED' }))

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: expect.arrayContaining(['COMPLETED', 'FAILED']) },
          }),
        })
      )
    })

    it('normalises status values to uppercase', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ status: 'completed,failed' }))

      const call = mockPrintJobCount.mock.calls[0][0]
      expect(call.where.status.in).toEqual(expect.arrayContaining(['COMPLETED', 'FAILED']))
    })

    it('returns 400 when status filter contains only invalid values', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      const res = await GET(makeRequest({ status: 'QUEUED,PRINTING' }))

      expect(res.status).toBe(400)
    })

    it('strips invalid values and keeps valid ones from a mixed status filter', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ status: 'COMPLETED,QUEUED' }))

      // QUEUED is not in HISTORY_STATUSES so it should be stripped
      const call = mockPrintJobCount.mock.calls[0][0]
      expect(call.where.status.in).toEqual(['COMPLETED'])
    })
  })

  describe('date filters', () => {
    it('applies from date filter as gte on createdAt', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ from: '2024-01-01' }))

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: new Date('2024-01-01') }),
          }),
        })
      )
    })

    it('applies to date filter as lte on createdAt', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ to: '2024-12-31' }))

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ lte: new Date('2024-12-31') }),
          }),
        })
      )
    })

    it('applies both from and to date filters together', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      await GET(makeRequest({ from: '2024-01-01', to: '2024-06-30' }))

      expect(mockPrintJobCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-06-30'),
            },
          }),
        })
      )
    })

    it('returns 400 for an invalid from date', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      const res = await GET(makeRequest({ from: 'not-a-date' }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for an invalid to date', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())

      const res = await GET(makeRequest({ to: 'not-a-date' }))

      expect(res.status).toBe(400)
    })
  })

  describe('response shape', () => {
    it('formats job fields correctly', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([makeJob()])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(data.jobs).toHaveLength(1)
      const job = data.jobs[0]
      expect(job).toHaveProperty('id', 'job-1')
      expect(job).toHaveProperty('status', 'COMPLETED')
      expect(job).toHaveProperty('partName', 'Bracket A')
      expect(job).toHaveProperty('partId', 'part-1')
      expect(job).toHaveProperty('orderNumber', 'ORD-001')
      expect(job).toHaveProperty('orderId', 'order-1')
      expect(job).toHaveProperty('printerName', 'Printer Alpha')
    })

    it('calculates duration in minutes from startTime and endTime', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([
        makeJob({
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T11:30:00Z'),
        }),
      ])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(data.jobs[0].duration).toBe(90)
    })

    it('sets duration to null when startTime or endTime is missing', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([
        makeJob({ startTime: null, endTime: null }),
      ])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(data.jobs[0].duration).toBeNull()
    })

    it('sets filament to null when spool is null', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([makeJob({ spool: null })])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(data.jobs[0].filament).toBeNull()
    })

    it('includes filament brand and color when spool is present', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([makeJob()])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(data.jobs[0].filament).toEqual({
        brand: 'Hatchbox',
        colorName: 'Red',
        colorHex: '#FF0000',
      })
    })

    it('sets printerName to null when printer is null', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockPrintJobCount.mockResolvedValue(1)
      mockPrintJobFindMany.mockResolvedValue([makeJob({ printer: null, printerId: null })])

      const res = await GET(makeRequest())
      const data = await res.json()

      expect(data.jobs[0].printerName).toBeNull()
    })
  })
})
