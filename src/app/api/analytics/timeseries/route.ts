import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getEndOfMonthUTC } from '@/lib/date-utils'
import type { TimeseriesDataPoint } from '@/types/analytics'

function parseRange(range: string): { startDate: Date; months: number } {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()

  if (range === 'ytd') {
    const startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0))
    const months = currentMonth + 1
    return { startDate, months }
  }

  const monthsMap: Record<string, number> = { '3m': 3, '6m': 6, '12m': 12 }
  const months = monthsMap[range] ?? 6

  // Compute start date by subtracting (months - 1) full months back from the
  // first day of the current month, so the window is exactly `months` buckets
  // ending with the current month (inclusive on both ends).
  const startDate = new Date(Date.UTC(currentYear, currentMonth - (months - 1), 1, 0, 0, 0, 0))

  return { startDate, months }
}

function buildMonthBuckets(startDate: Date, months: number): TimeseriesDataPoint[] {
  const buckets: TimeseriesDataPoint[] = []
  const startYear = startDate.getUTCFullYear()
  const startMonth = startDate.getUTCMonth()

  for (let i = 0; i < months; i++) {
    const totalMonths = startMonth + i
    const year = startYear + Math.floor(totalMonths / 12)
    const month = totalMonths % 12
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const label = new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
    buckets.push({
      month: label,
      monthKey,
      ordersCount: 0,
      revenue: 0,
      filamentUsedGrams: 0,
    })
  }

  return buckets
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const tenantId = session.user.tenantId
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') ?? '6m'

    const { startDate, months } = parseRange(range)

    // End of the current month — the last bucket boundary
    const now = new Date()
    const endDate = getEndOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth())

    // Build empty buckets indexed by monthKey
    const buckets = buildMonthBuckets(startDate, months)
    const bucketMap = new Map<string, TimeseriesDataPoint>()
    for (const bucket of buckets) {
      bucketMap.set(bucket.monthKey, bucket)
    }

    // ── Orders: count per month ──────────────────────────────────────────────
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    })

    for (const order of orders) {
      const y = order.createdAt.getUTCFullYear()
      const m = order.createdAt.getUTCMonth()
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      const bucket = bucketMap.get(key)
      if (bucket) bucket.ordersCount += 1
    }

    // ── Revenue: sum of INCOME ledger entries per month ──────────────────────
    const ledgerEntries = await prisma.financeLedgerEntry.findMany({
      where: {
        tenantId,
        type: 'INCOME',
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, amount: true },
    })

    for (const entry of ledgerEntries) {
      const y = entry.date.getUTCFullYear()
      const m = entry.date.getUTCMonth()
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      const bucket = bucketMap.get(key)
      if (bucket) bucket.revenue += entry.amount
    }

    // ── Filament: sum filamentWeight from completed PrintJob → part ──────────
    // ProjectPart has no tenantId column of its own; isolation is guaranteed
    // through PrintJob.tenantId → PrintJob.part → ProjectPart. As long as
    // referential integrity holds (enforced by the FK cascade in the schema),
    // filtering by PrintJob.tenantId is sufficient and the join is safe.
    const completedJobs = await prisma.printJob.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        endTime: { gte: startDate, lte: endDate },
      },
      select: {
        endTime: true,
        part: { select: { filamentWeight: true } },
      },
    })

    for (const job of completedJobs) {
      // endTime is guaranteed non-null by the Prisma where filter above, but TS types it as DateTime | null
      if (!job.endTime) continue
      const y = job.endTime.getUTCFullYear()
      const m = job.endTime.getUTCMonth()
      const key = `${y}-${String(m + 1).padStart(2, '0')}`
      const bucket = bucketMap.get(key)
      if (bucket) bucket.filamentUsedGrams += job.part.filamentWeight
    }

    // Round revenue to 2 decimal places and filament to 1
    for (const bucket of buckets) {
      bucket.revenue = Math.round(bucket.revenue * 100) / 100
      bucket.filamentUsedGrams = Math.round(bucket.filamentUsedGrams * 10) / 10
    }

    return apiSuccess(buckets)
  } catch (error) {
    console.error('Timeseries analytics error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
