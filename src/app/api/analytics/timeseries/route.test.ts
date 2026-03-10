// Mock next-auth before importing the route
const mockGetServerSession = jest.fn()

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

const mockOrderFindMany = jest.fn()
const mockLedgerFindMany = jest.fn()
const mockPrintJobFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: (...args: unknown[]) => mockOrderFindMany(...args),
    },
    financeLedgerEntry: {
      findMany: (...args: unknown[]) => mockLedgerFindMany(...args),
    },
    printJob: {
      findMany: (...args: unknown[]) => mockPrintJobFindMany(...args),
    },
  },
}))

// Mock date-utils to keep tests deterministic
jest.mock('@/lib/date-utils', () => ({
  getEndOfMonthUTC: (year: number, month: number) =>
    new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
}))

import { GET } from './route'
import type { NextRequest } from 'next/server'

function createRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/analytics/timeseries')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return { url: url.toString() } as unknown as NextRequest
}

const MOCK_SESSION = {
  user: { tenantId: 'tenant-1' },
}

describe('GET /api/analytics/timeseries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: authenticated session
    mockGetServerSession.mockResolvedValue(MOCK_SESSION)
    // Default: no data
    mockOrderFindMany.mockResolvedValue([])
    mockLedgerFindMany.mockResolvedValue([])
    mockPrintJobFindMany.mockResolvedValue([])
  })

  describe('authentication', () => {
    it('returns 401 when session is missing', async () => {
      mockGetServerSession.mockResolvedValue(null)
      const res = await GET(createRequest())
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when tenantId is missing from session', async () => {
      mockGetServerSession.mockResolvedValue({ user: {} })
      const res = await GET(createRequest())
      expect(res.status).toBe(401)
    })
  })

  describe('range parsing — bucket count', () => {
    it('returns 3 buckets for range=3m', async () => {
      const res = await GET(createRequest({ range: '3m' }))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(3)
    })

    it('returns 6 buckets for range=6m (default)', async () => {
      const res = await GET(createRequest())
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(6)
    })

    it('returns 6 buckets when range param is omitted', async () => {
      const res = await GET(createRequest())
      const data = await res.json()
      expect(data).toHaveLength(6)
    })

    it('returns 12 buckets for range=12m', async () => {
      const res = await GET(createRequest({ range: '12m' }))
      const data = await res.json()
      expect(data).toHaveLength(12)
    })

    it('returns correct bucket count for range=ytd', async () => {
      const res = await GET(createRequest({ range: 'ytd' }))
      const data = await res.json()
      // YTD = currentMonth + 1 (1..12)
      const expectedMonths = new Date().getUTCMonth() + 1
      expect(data).toHaveLength(expectedMonths)
    })

    it('defaults to 6 buckets for an unrecognised range value', async () => {
      const res = await GET(createRequest({ range: 'unknown' }))
      const data = await res.json()
      expect(data).toHaveLength(6)
    })
  })

  describe('bucket shape', () => {
    it('each bucket has the expected keys initialised to zero', async () => {
      const res = await GET(createRequest({ range: '3m' }))
      const data = await res.json()
      for (const bucket of data) {
        expect(bucket).toHaveProperty('month')
        expect(bucket).toHaveProperty('monthKey')
        expect(bucket).toHaveProperty('ordersCount')
        expect(bucket).toHaveProperty('revenue')
        expect(bucket).toHaveProperty('filamentUsedGrams')
        expect(bucket.ordersCount).toBe(0)
        expect(bucket.revenue).toBe(0)
        expect(bucket.filamentUsedGrams).toBe(0)
      }
    })

    it('monthKey follows YYYY-MM format', async () => {
      const res = await GET(createRequest({ range: '3m' }))
      const data = await res.json()
      for (const bucket of data) {
        expect(bucket.monthKey).toMatch(/^\d{4}-\d{2}$/)
      }
    })

    it('buckets are ordered chronologically', async () => {
      const res = await GET(createRequest({ range: '6m' }))
      const data = await res.json()
      for (let i = 1; i < data.length; i++) {
        expect(data[i].monthKey >= data[i - 1].monthKey).toBe(true)
      }
    })
  })

  describe('monthly aggregation — orders', () => {
    it('increments ordersCount for orders in the current month', async () => {
      const now = new Date()
      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

      mockOrderFindMany.mockResolvedValue([
        { createdAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 5)) },
        { createdAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 12)) },
      ])

      const res = await GET(createRequest({ range: '6m' }))
      const data = await res.json()
      const bucket = data.find((b: { monthKey: string }) => b.monthKey === monthKey)
      expect(bucket).toBeDefined()
      expect(bucket.ordersCount).toBe(2)
    })
  })

  describe('monthly aggregation — revenue', () => {
    it('sums ledger entry amounts into the correct bucket', async () => {
      const now = new Date()
      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

      mockLedgerFindMany.mockResolvedValue([
        { date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 3)), amount: 100.5 },
        { date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 20)), amount: 49.7 },
      ])

      const res = await GET(createRequest({ range: '6m' }))
      const data = await res.json()
      const bucket = data.find((b: { monthKey: string }) => b.monthKey === monthKey)
      expect(bucket).toBeDefined()
      // 100.5 + 49.7 = 150.2, rounded to 2 dp
      expect(bucket.revenue).toBeCloseTo(150.2, 1)
    })
  })

  describe('monthly aggregation — filament', () => {
    it('sums filament weight from completed print jobs', async () => {
      const now = new Date()
      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

      mockPrintJobFindMany.mockResolvedValue([
        {
          endTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10)),
          part: { filamentWeight: 200 },
        },
        {
          endTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 22)),
          part: { filamentWeight: 350.5 },
        },
      ])

      const res = await GET(createRequest({ range: '6m' }))
      const data = await res.json()
      const bucket = data.find((b: { monthKey: string }) => b.monthKey === monthKey)
      expect(bucket).toBeDefined()
      // 200 + 350.5 = 550.5
      expect(bucket.filamentUsedGrams).toBeCloseTo(550.5, 0)
    })

    it('skips print jobs where endTime is null', async () => {
      const now = new Date()
      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

      mockPrintJobFindMany.mockResolvedValue([
        { endTime: null, part: { filamentWeight: 999 } },
      ])

      const res = await GET(createRequest({ range: '6m' }))
      const data = await res.json()
      const bucket = data.find((b: { monthKey: string }) => b.monthKey === monthKey)
      expect(bucket.filamentUsedGrams).toBe(0)
    })
  })

  describe('rounding', () => {
    it('rounds revenue to 2 decimal places', async () => {
      const now = new Date()
      mockLedgerFindMany.mockResolvedValue([
        { date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), amount: 1 / 3 },
      ])
      const res = await GET(createRequest({ range: '3m' }))
      const data = await res.json()
      const bucket = data[data.length - 1]
      const decimalPlaces = (bucket.revenue.toString().split('.')[1] ?? '').length
      expect(decimalPlaces).toBeLessThanOrEqual(2)
    })

    it('rounds filamentUsedGrams to 1 decimal place', async () => {
      const now = new Date()
      mockPrintJobFindMany.mockResolvedValue([
        {
          endTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
          part: { filamentWeight: 1 / 3 },
        },
      ])
      const res = await GET(createRequest({ range: '3m' }))
      const data = await res.json()
      const bucket = data[data.length - 1]
      const decimalPlaces = (bucket.filamentUsedGrams.toString().split('.')[1] ?? '').length
      expect(decimalPlaces).toBeLessThanOrEqual(1)
    })
  })

  describe('error handling', () => {
    it('returns 500 when prisma throws', async () => {
      mockOrderFindMany.mockRejectedValue(new Error('DB error'))
      const res = await GET(createRequest({ range: '6m' }))
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.code).toBe('INTERNAL_ERROR')
    })
  })
})
