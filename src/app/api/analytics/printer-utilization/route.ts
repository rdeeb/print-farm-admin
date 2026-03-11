import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import type { PrinterUtilizationData } from '@/types/printer-utilization'

function parseRange(range: string): Date {
  const now = new Date()
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
  }
  const days = daysMap[range] ?? 30
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return startDate
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const tenantId = session.user.tenantId
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') ?? '30d'
    const startDate = parseRange(range)

    // Fetch all printers for the tenant
    const printers = await prisma.printer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    })

    // Fetch all relevant print jobs within the date range
    const printJobs = await prisma.printJob.findMany({
      where: {
        tenantId,
        status: { in: ['COMPLETED', 'FAILED'] },
        printerId: { not: null },
        printer: { tenantId },
        startTime: { gte: startDate },
      },
      select: {
        printerId: true,
        status: true,
        actualTime: true,
        estimatedTime: true,
      },
    })

    // Build a map of printerId -> aggregated stats
    const statsMap = new Map<
      string,
      {
        totalJobs: number
        completedJobs: number
        failedJobs: number
        totalMinutes: number
      }
    >()

    // Initialize all printers with zero stats
    for (const printer of printers) {
      statsMap.set(printer.id, {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        totalMinutes: 0,
      })
    }

    // Accumulate job data
    for (const job of printJobs) {
      if (!job.printerId) continue

      let stats = statsMap.get(job.printerId)
      if (!stats) {
        // Job references a printer not in the current printer list (edge case)
        stats = { totalJobs: 0, completedJobs: 0, failedJobs: 0, totalMinutes: 0 }
        statsMap.set(job.printerId, stats)
      }

      stats.totalJobs += 1

      if (job.status === 'COMPLETED') {
        stats.completedJobs += 1
        // Use actualTime, fallback to estimatedTime
        const minutes = job.actualTime ?? job.estimatedTime ?? 0
        stats.totalMinutes += minutes
      } else if (job.status === 'FAILED') {
        stats.failedJobs += 1
      }
    }

    // Build a name lookup map (printer id -> name) from all printers in the tenant
    const printerNameMap = new Map<string, string>()
    for (const printer of printers) {
      printerNameMap.set(printer.id, printer.name)
    }

    // Also fetch names for any printers referenced by jobs but not in our list
    const extraPrinterIds = Array.from(statsMap.keys()).filter((id) => !printerNameMap.has(id))
    if (extraPrinterIds.length > 0) {
      const extraPrinters = await prisma.printer.findMany({
        where: { id: { in: extraPrinterIds } },
        select: { id: true, name: true },
      })
      for (const p of extraPrinters) {
        printerNameMap.set(p.id, p.name)
      }
    }

    // Compose the result array
    const result: PrinterUtilizationData[] = []

    for (const [printerId, stats] of Array.from(statsMap.entries())) {
      const printerName = printerNameMap.get(printerId) ?? 'Unknown Printer'
      const totalHours = Math.round((stats.totalMinutes / 60) * 10) / 10
      const successRate =
        stats.totalJobs > 0
          ? Math.round((stats.completedJobs / stats.totalJobs) * 1000) / 1000
          : 0
      const avgJobMinutes =
        stats.completedJobs > 0
          ? Math.round(stats.totalMinutes / stats.completedJobs)
          : 0

      result.push({
        printerId,
        printerName,
        totalJobs: stats.totalJobs,
        completedJobs: stats.completedJobs,
        failedJobs: stats.failedJobs,
        successRate,
        totalHours,
        avgJobMinutes,
      })
    }

    // Sort by totalHours descending
    result.sort((a, b) => b.totalHours - a.totalHours)

    return apiSuccess(result)
  } catch (error) {
    console.error('Error fetching printer utilization:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
