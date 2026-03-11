import { GET } from '../route'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock next-auth so we can control session per test
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock @/lib/auth so authOptions import resolves without real DB
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    printer: {
      findMany: jest.fn(),
    },
    printJob: {
      findMany: jest.fn(),
    },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrinterFindMany = prisma.printer.findMany as jest.MockedFunction<
  typeof prisma.printer.findMany
>
const mockPrintJobFindMany = prisma.printJob.findMany as jest.MockedFunction<
  typeof prisma.printJob.findMany
>

// ---------------------------------------------------------------------------
// Helper to build a minimal request stub.
// The route only reads request.url (via new URL(request.url)), so a plain
// object with a url property is sufficient. We cast to any to avoid needing
// NextRequest, which requires a global fetch Request not available in jsdom.
// ---------------------------------------------------------------------------
function makeRequest(params: Record<string, string> = {}): any {
  const url = new URL('http://localhost/api/analytics/printer-utilization')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return { url: url.toString() }
}

// Helper to parse the JSON body from a NextResponse
async function parseJson(response: Response): Promise<unknown> {
  return response.json()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/analytics/printer-utilization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // 1. Unauthenticated request → 401
  // -------------------------------------------------------------------------
  it('returns 401 when session is missing', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)

    const response = await GET(makeRequest())

    expect(response.status).toBe(401)
    const body = await parseJson(response)
    expect(body).toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: 'u1', email: 'x@y.com' },
      expires: '',
    } as any)

    const response = await GET(makeRequest())

    expect(response.status).toBe(401)
  })

  // -------------------------------------------------------------------------
  // 2. range=30d, 2 printers, 3 jobs
  //    - Printer A: job COMPLETED actualTime=60, job FAILED
  //    - Printer B: job COMPLETED estimatedTime=30 (no actualTime)
  // -------------------------------------------------------------------------
  it('aggregates printer stats correctly for 2 printers and 3 jobs', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: 'u1', tenantId: 'tenant-1' },
      expires: '',
    } as any)

    mockPrinterFindMany.mockResolvedValueOnce([
      { id: 'printer-a', name: 'Printer Alpha' },
      { id: 'printer-b', name: 'Printer Beta' },
    ] as any)

    mockPrintJobFindMany.mockResolvedValueOnce([
      { printerId: 'printer-a', status: 'COMPLETED', actualTime: 60, estimatedTime: null },
      { printerId: 'printer-a', status: 'FAILED', actualTime: null, estimatedTime: null },
      { printerId: 'printer-b', status: 'COMPLETED', actualTime: null, estimatedTime: 30 },
    ] as any)

    const response = await GET(makeRequest({ range: '30d' }))

    expect(response.status).toBe(200)
    const body = await parseJson(response) as any[]

    // Sorted by totalHours desc: Printer A (1.0h) before Printer B (0.5h)
    expect(body).toHaveLength(2)

    const printerA = body.find((p: any) => p.printerId === 'printer-a')
    const printerB = body.find((p: any) => p.printerId === 'printer-b')

    expect(printerA).toBeDefined()
    expect(printerA.printerName).toBe('Printer Alpha')
    expect(printerA.totalJobs).toBe(2)
    expect(printerA.completedJobs).toBe(1)
    expect(printerA.failedJobs).toBe(1)
    // 60 min / 60 = 1.0 h
    expect(printerA.totalHours).toBe(1.0)
    // 1 completed out of 2 total → 0.5
    expect(printerA.successRate).toBe(0.5)
    // 60 min / 1 completed = 60
    expect(printerA.avgJobMinutes).toBe(60)

    expect(printerB).toBeDefined()
    expect(printerB.printerName).toBe('Printer Beta')
    expect(printerB.totalJobs).toBe(1)
    expect(printerB.completedJobs).toBe(1)
    expect(printerB.failedJobs).toBe(0)
    // 30 min / 60 = 0.5 h
    expect(printerB.totalHours).toBe(0.5)
    // 1 completed out of 1 total → 1.0
    expect(printerB.successRate).toBe(1)
    // 30 min / 1 completed = 30
    expect(printerB.avgJobMinutes).toBe(30)

    // Printer A should come first (higher totalHours)
    expect(body[0].printerId).toBe('printer-a')
    expect(body[1].printerId).toBe('printer-b')
  })

  // -------------------------------------------------------------------------
  // 3. Printer with zero jobs — appears in response with all zeros
  // -------------------------------------------------------------------------
  it('includes printers with zero jobs and returns all-zero stats for them', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: 'u1', tenantId: 'tenant-1' },
      expires: '',
    } as any)

    mockPrinterFindMany.mockResolvedValueOnce([
      { id: 'printer-x', name: 'Idle Printer' },
    ] as any)

    // No matching jobs
    mockPrintJobFindMany.mockResolvedValueOnce([] as any)

    const response = await GET(makeRequest({ range: '30d' }))

    expect(response.status).toBe(200)
    const body = await parseJson(response) as any[]

    expect(body).toHaveLength(1)
    const p = body[0]
    expect(p.printerId).toBe('printer-x')
    expect(p.printerName).toBe('Idle Printer')
    expect(p.totalJobs).toBe(0)
    expect(p.completedJobs).toBe(0)
    expect(p.failedJobs).toBe(0)
    expect(p.totalHours).toBe(0)
    expect(p.successRate).toBe(0)
    expect(p.avgJobMinutes).toBe(0)
  })

  // -------------------------------------------------------------------------
  // 4. Invalid range param → falls back to 30d default (no error)
  // -------------------------------------------------------------------------
  it('handles an invalid range param gracefully (falls back to 30d default)', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: 'u1', tenantId: 'tenant-1' },
      expires: '',
    } as any)

    mockPrinterFindMany.mockResolvedValueOnce([] as any)
    mockPrintJobFindMany.mockResolvedValueOnce([] as any)

    const response = await GET(makeRequest({ range: 'invalid' }))

    // Should succeed (200), not error
    expect(response.status).toBe(200)
    const body = await parseJson(response)
    expect(Array.isArray(body)).toBe(true)

    // Verify prisma was called with a startDate roughly 30 days ago
    expect(mockPrintJobFindMany).toHaveBeenCalledTimes(1)
    const callArgs = mockPrintJobFindMany.mock.calls[0][0] as any
    const startDate: Date = callArgs.where.startTime.gte
    const diffMs = Date.now() - startDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    // Should be approximately 30 days (allow ±1 day tolerance)
    expect(diffDays).toBeGreaterThan(29)
    expect(diffDays).toBeLessThan(31)
  })

  // -------------------------------------------------------------------------
  // 5. No jobs at all → all printers returned with zeros
  // -------------------------------------------------------------------------
  it('returns all printers with zeros when there are no jobs', async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: 'u1', tenantId: 'tenant-1' },
      expires: '',
    } as any)

    mockPrinterFindMany.mockResolvedValueOnce([
      { id: 'p1', name: 'Printer One' },
      { id: 'p2', name: 'Printer Two' },
      { id: 'p3', name: 'Printer Three' },
    ] as any)

    mockPrintJobFindMany.mockResolvedValueOnce([] as any)

    const response = await GET(makeRequest())

    expect(response.status).toBe(200)
    const body = await parseJson(response) as any[]

    expect(body).toHaveLength(3)
    body.forEach((p: any) => {
      expect(p.totalJobs).toBe(0)
      expect(p.completedJobs).toBe(0)
      expect(p.failedJobs).toBe(0)
      expect(p.totalHours).toBe(0)
      expect(p.successRate).toBe(0)
      expect(p.avgJobMinutes).toBe(0)
    })
  })
})
