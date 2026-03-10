import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { invalidatePrinterCostCache } from '@/lib/printer-cost-cache'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const includeQueueCount = searchParams.get('includeQueueCount') === 'true'

    const printers = await prisma.printer.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            printJobs: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // If queue count requested, fetch queued jobs count per printer
    if (includeQueueCount) {
      const queueCounts = await prisma.printJob.groupBy({
        by: ['printerId'],
        where: {
          tenantId: session.user.tenantId,
          status: 'QUEUED',
          printerId: { not: null },
        },
        _count: {
          id: true,
        },
      })

      const queueCountMap = new Map(
        queueCounts.map(q => [q.printerId, q._count.id])
      )

      const printersWithQueue = printers.map(printer => ({
        ...printer,
        queueCount: queueCountMap.get(printer.id) ?? 0,
      }))

      return apiSuccess(printersWithQueue)
    }

    return apiSuccess(printers)
  } catch (error) {
    console.error('Error fetching printers:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const body = await request.json()
    const { name, model, brand, technology, nozzleSize, buildVolume, powerConsumption, cost } = body

    const printer = await prisma.printer.create({
      data: {
        name,
        model,
        brand: brand || null,
        technology: technology || 'FDM',
        nozzleSize: nozzleSize || null,
        buildVolume: buildVolume || null,
        powerConsumption: powerConsumption || null,
        cost: cost === '' || cost == null ? null : parseFloat(cost),
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            printJobs: true,
          },
        },
      },
    })

    invalidatePrinterCostCache(session.user.tenantId)

    return apiSuccess(printer, 201)
  } catch (error) {
    console.error('Error creating printer:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
