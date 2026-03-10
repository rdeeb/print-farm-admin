import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const tenantId = session.user.tenantId

    // Total orders
    const totalOrders = await prisma.order.count({
      where: { tenantId },
    })

    // Completed orders
    const completedOrders = await prisma.order.count({
      where: { tenantId, status: 'DELIVERED' },
    })

    // Total print jobs
    const totalPrintJobs = await prisma.printJob.count({
      where: { tenantId },
    })

    // Completed jobs
    const completedJobs = await prisma.printJob.count({
      where: { tenantId, status: 'COMPLETED' },
    })

    // Failed jobs
    const failedJobs = await prisma.printJob.count({
      where: { tenantId, status: 'FAILED' },
    })

    // Average print time (for completed jobs with actual time)
    const avgTimeResult = await prisma.printJob.aggregate({
      where: {
        tenantId,
        status: 'COMPLETED',
        actualTime: { not: null },
      },
      _avg: { actualTime: true },
    })

    // Get active printers count
    const activePrinters = await prisma.printer.count({
      where: { tenantId, isActive: true },
    })

    // Get printing printers count
    const printingPrinters = await prisma.printer.count({
      where: { tenantId, status: 'PRINTING' },
    })

    const printerUtilization = activePrinters > 0
      ? Math.round((printingPrinters / activePrinters) * 100)
      : 0

    return apiSuccess({
      totalOrders,
      completedOrders,
      totalPrintJobs,
      completedJobs,
      failedJobs,
      averagePrintTime: avgTimeResult._avg.actualTime || 0,
      filamentUsed: 0, // Would need to track this separately
      printerUtilization,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
