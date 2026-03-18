export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const tenantId = session.user.tenantId

    // Counts per PrintJob (not per quantity copy) — intentional product decision
    const failedJobs = await prisma.printJob.findMany({
      where: {
        tenantId,
        status: 'FAILED',
      },
      select: {
        failureReason: true,
      },
    })

    // Group directly by the failureReason field — it is now always a clean category string
    const reasonCounts = new Map<string, number>()

    for (const job of failedJobs) {
      const reason = job.failureReason ?? 'Unknown'
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1)
    }

    const data = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)

    return apiSuccess(data)
  } catch (error) {
    console.error('Error fetching failure analytics:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
