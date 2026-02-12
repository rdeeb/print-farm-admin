import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStartOfTodayUTC, getStartOfDaysAgoUTC, getEndOfTodayUTC } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const todayStart = getStartOfTodayUTC()
    const todayEnd = getEndOfTodayUTC()
    const weekAgo = getStartOfDaysAgoUTC(7)

    // Get dashboard statistics
    const [
      pendingOrders,
      totalFilament,
      lowStockSpools,
      activePrinters,
      totalPrinters,
      completedJobsToday,
      completedJobsWeek,
      failedJobsWeek,
      overdueOrders,
      ordersByStatus,
      printersByStatus,
      totalClients,
      totalProjects,
      printingPrinters,
      queuedJobs,
    ] = await Promise.all([
      // Pending orders count
      prisma.order.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING'] },
        },
      }),

      // Total filament weight (exclude 0% spools from calculation)
      prisma.filamentSpool.aggregate({
        where: {
          filament: { tenantId },
          remainingPercent: { gt: 0 },
        },
        _sum: { remainingWeight: true },
      }),

      // Low stock spools (less than 20% but greater than 0% - exclude empty spools)
      prisma.filamentSpool.count({
        where: {
          filament: { tenantId },
          remainingPercent: { gt: 0, lt: 20 },
        },
      }),

      // Active printers (idle or printing)
      prisma.printer.count({
        where: {
          tenantId,
          status: { in: ['IDLE', 'PRINTING'] },
          isActive: true,
        },
      }),

      // Total printers
      prisma.printer.count({
        where: {
          tenantId,
          isActive: true,
        },
      }),

      // Completed jobs today (UTC day)
      prisma.printJob.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          endTime: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Completed jobs this week (UTC)
      prisma.printJob.count({
        where: {
          tenantId,
          status: 'COMPLETED',
          endTime: { gte: weekAgo },
        },
      }),

      // Failed jobs this week (UTC)
      prisma.printJob.count({
        where: {
          tenantId,
          status: 'FAILED',
          endTime: { gte: weekAgo },
        },
      }),

      // Overdue orders (due date before start of today UTC)
      prisma.order.count({
        where: {
          tenantId,
          status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] },
          dueDate: { lt: todayStart },
        },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),

      // Printers by status
      prisma.printer.groupBy({
        by: ['status'],
        where: { tenantId, isActive: true },
        _count: true,
      }),

      // Total clients
      prisma.client.count({
        where: { tenantId },
      }),

      // Total projects
      prisma.project.count({
        where: { tenantId, status: 'ACTIVE' },
      }),

      // Currently printing
      prisma.printer.count({
        where: {
          tenantId,
          status: 'PRINTING',
          isActive: true,
        },
      }),

      // Jobs in queue
      prisma.printJob.count({
        where: {
          tenantId,
          status: 'QUEUED',
        },
      }),
    ])

    // Transform orders by status to object
    const ordersBreakdown = ordersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    // Transform printers by status to object
    const printersBreakdown = printersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    // Calculate success rate
    const totalJobsWeek = completedJobsWeek + failedJobsWeek
    const successRate = totalJobsWeek > 0
      ? Math.round((completedJobsWeek / totalJobsWeek) * 100)
      : 100

    // Get orders due today
    const ordersDueToday = await prisma.order.count({
      where: {
        tenantId,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] },
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    })

    // Get orders needing action (PENDING status - waiting for start)
    const ordersNeedingAction = await prisma.order.count({
      where: {
        tenantId,
        status: 'PENDING',
      },
    })

    // Financial data - Get completed orders this week/month with project prices
    const monthAgo = getStartOfDaysAgoUTC(30)

    const completedOrdersThisWeek = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'DELIVERED',
        updatedAt: { gte: weekAgo },
      },
      include: {
        project: {
          select: { salesPrice: true },
        },
      },
    })

    const completedOrdersThisMonth = await prisma.order.findMany({
      where: {
        tenantId,
        status: 'DELIVERED',
        updatedAt: { gte: monthAgo },
      },
      include: {
        project: {
          select: { salesPrice: true },
        },
      },
    })

    // Calculate revenue (quantity * salesPrice)
    const revenueThisWeek = completedOrdersThisWeek.reduce((sum, order) => {
      return sum + (order.quantity * (order.project.salesPrice || 0))
    }, 0)

    const revenueThisMonth = completedOrdersThisMonth.reduce((sum, order) => {
      return sum + (order.quantity * (order.project.salesPrice || 0))
    }, 0)

    // Estimate profit (rough estimate: 40% margin typical for 3D printing)
    const profitMargin = 0.4
    const profitThisWeek = revenueThisWeek * profitMargin
    const profitThisMonth = revenueThisMonth * profitMargin

    // Outstanding balances (orders delivered but we'll assume not all paid)
    // For now, use pending orders value as proxy
    const pendingOrdersWithPrice = await prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING', 'ASSEMBLED'] },
      },
      include: {
        project: {
          select: { salesPrice: true },
        },
      },
    })

    const outstandingValue = pendingOrdersWithPrice.reduce((sum, order) => {
      return sum + (order.quantity * (order.project.salesPrice || 0))
    }, 0)

    // Average order value
    const avgOrderValue = completedOrdersThisMonth.length > 0
      ? revenueThisMonth / completedOrdersThisMonth.length
      : 0

    // Estimated loss from failed prints (rough: $5 avg material cost per failed job)
    const estimatedLossFromFails = failedJobsWeek * 5

    const stats = {
      // Main stats
      pendingOrders,
      totalFilament: totalFilament._sum.remainingWeight || 0,
      lowStockSpools,
      activePrinters,
      totalPrinters,
      completedJobsToday,

      // Extended stats
      completedJobsWeek,
      failedJobsWeek,
      successRate,
      overdueOrders,
      totalClients,
      totalProjects,
      printingPrinters,
      queuedJobs,

      // Action items
      ordersDueToday,
      ordersNeedingAction,

      // Financial
      revenueThisWeek,
      revenueThisMonth,
      profitThisWeek,
      profitThisMonth,
      outstandingValue,
      avgOrderValue,
      estimatedLossFromFails,
      ordersCompletedThisWeek: completedOrdersThisWeek.length,
      ordersCompletedThisMonth: completedOrdersThisMonth.length,

      // Breakdowns
      ordersBreakdown,
      printersBreakdown,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}