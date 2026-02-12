import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { parseMonthUTC, getStartOfTodayUTC, getStartOfDayUTC, formatDateKeyUTC } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthStr = searchParams.get('month') // Expected YYYY-MM

    let startDate: Date
    let endDate: Date

    if (monthStr) {
      const range = parseMonthUTC(monthStr)
      startDate = range.start
      endDate = range.end
    } else {
      const now = new Date()
      const y = now.getUTCFullYear()
      const m = now.getUTCMonth()
      startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999))
    }

    const tenantId = session.user.tenantId

    // 1. Get tenant settings
    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    })

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId,
          printingHoursDay: 24.0,
        },
      })
    }
    const printingHoursPerDay = settings.printingHoursDay
    const printingMinutesPerDay = printingHoursPerDay * 60

    // 2. Get active printers
    const activePrinters = await prisma.printer.count({
      where: {
        tenantId,
        isActive: true,
        status: { not: 'OFFLINE' },
      },
    })

    // If no active printers, we still want to show capacity based on printing hours 
    // to avoid showing 0h if the user just hasn't added printers yet.
    // We'll assume at least 1 printer for capacity visualization purposes if none are defined.
    const effectivePrinterCount = activePrinters > 0 ? activePrinters : 1
    const totalCapacityMinutesPerDay = effectivePrinterCount * printingMinutesPerDay

    // 3. Get all orders with due dates in this range
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        project: {
          select: { name: true }
        },
        orderParts: {
          include: {
            part: {
              select: { printTime: true }
            }
          }
        }
      }
    })

    // 4. Calculate stats per day
    const stats: Record<string, {
      jobs: any[],
      totalMinutes: number,
      capacityMinutes: number,
      allocationPercentage: number,
      remainingMinutes: number,
      hasOverdue: boolean
    }> = {}

    // Initialize stats for each day in range (UTC)
    let current = new Date(startDate.getTime())
    while (current <= endDate) {
      const dateKey = formatDateKeyUTC(current)
      stats[dateKey] = {
        jobs: [],
        totalMinutes: 0,
        capacityMinutes: totalCapacityMinutesPerDay,
        allocationPercentage: 0,
        remainingMinutes: totalCapacityMinutesPerDay,
        hasOverdue: false
      }
      current.setUTCDate(current.getUTCDate() + 1)
    }

    const todayStart = getStartOfTodayUTC()

    orders.forEach(order => {
      if (!order.dueDate) return
      const dateKey = formatDateKeyUTC(order.dueDate)
      if (!stats[dateKey]) return

      // Calculate total print time for this order
      const orderPrintTime = order.orderParts.reduce((acc, op) => {
        return acc + ((op.part.printTime || 0) * op.quantity)
      }, 0)

      const isCompleted = order.status === 'COMPLETED' || order.status === 'DELIVERED'
      const orderDueDayStart = getStartOfDayUTC(order.dueDate)
      const isPastDue = orderDueDayStart < todayStart && !isCompleted

      stats[dateKey].jobs.push({
        id: order.id,
        orderNumber: order.orderNumber,
        projectName: order.project.name,
        status: order.status,
        priority: order.priority,
        printTime: orderPrintTime,
        isOverdue: isPastDue
      })

      stats[dateKey].totalMinutes += orderPrintTime
      if (isPastDue) {
        stats[dateKey].hasOverdue = true
      }
    })

    // Finalize percentages
    Object.keys(stats).forEach(dateKey => {
      const day = stats[dateKey]
      if (day.capacityMinutes > 0) {
        day.allocationPercentage = Math.min(Math.round((day.totalMinutes / day.capacityMinutes) * 100), 100)
        day.remainingMinutes = Math.max(0, day.capacityMinutes - day.totalMinutes)
      } else {
        // This case is now handled by effectivePrinterCount, but kept for safety
        day.allocationPercentage = day.totalMinutes > 0 ? 100 : 0
        day.remainingMinutes = 0
      }
    })

    return NextResponse.json({
      stats,
      settings: {
        printingHoursPerDay,
        activePrinters,
        effectivePrinterCount,
        totalCapacityMinutesPerDay
      }
    })
  } catch (error) {
    console.error('Error fetching calendar stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
