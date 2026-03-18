export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStartOfDaysAgoUTC } from '@/lib/date-utils'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const days = Math.max(parseInt(searchParams.get('days') || '30', 10), 1)
    const fromDate = getStartOfDaysAgoUTC(days)

    const entries = await prisma.financeLedgerEntry.findMany({
      where: {
        tenantId: session.user.tenantId,
        date: { gte: fromDate },
      },
      select: {
        amount: true,
        type: true,
        isNonCash: true,
        currency: true,
      },
    })

    const summary = entries.reduce(
      (acc, entry) => {
        if (entry.type === 'INCOME') acc.income += entry.amount
        if (entry.type === 'EXPENSE') acc.expenses += entry.amount
        if (entry.type === 'SOFT_EXPENSE') acc.softExpenses += entry.amount
        if (entry.isNonCash) acc.nonCash += entry.amount
        return acc
      },
      { income: 0, expenses: 0, softExpenses: 0, nonCash: 0 }
    )

    const netCash = summary.income - summary.expenses
    const projectedMargin = summary.income - summary.expenses - summary.softExpenses

    return apiSuccess({
      ...summary,
      netCash,
      projectedMargin,
      fromDate,
      currency: entries[0]?.currency || 'USD',
    })
  } catch (error) {
    console.error('Finance summary error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
