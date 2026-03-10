import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

const HISTORY_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'] as const

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    // Parse comma-separated status filter; default to all history statuses
    const rawStatus = searchParams.get('status')
    const statusList = rawStatus
      ? rawStatus
          .split(',')
          .map(s => s.trim().toUpperCase())
          .filter((s): s is (typeof HISTORY_STATUSES)[number] =>
            (HISTORY_STATUSES as readonly string[]).includes(s)
          )
      : [...HISTORY_STATUSES]

    if (statusList.length === 0) {
      return apiError('BAD_REQUEST', 'Invalid status filter', 400)
    }

    const printerId = searchParams.get('printerId') || undefined
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined

    if (from && isNaN(new Date(from).getTime())) {
      return apiError('BAD_REQUEST', 'Invalid date format for from or to parameter', 400)
    }
    if (to && isNaN(new Date(to).getTime())) {
      return apiError('BAD_REQUEST', 'Invalid date format for from or to parameter', 400)
    }

    const where = {
      tenantId: session.user.tenantId,
      status: { in: statusList },
      ...(printerId ? { printerId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    }

    const [total, jobs] = await Promise.all([
      prisma.printJob.count({ where }),
      prisma.printJob.findMany({
        where,
        include: {
          part: {
            select: { id: true, name: true },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          printer: {
            select: { id: true, name: true },
          },
          spool: {
            select: {
              id: true,
              filamentId: true,
              filament: {
                select: {
                  brand: true,
                  color: {
                    select: { name: true, hex: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const formattedJobs = jobs.map(job => {
      const durationMinutes =
        job.startTime && job.endTime
          ? Math.round(
              (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 60000
            )
          : null

      return {
        id: job.id,
        status: job.status,
        partName: job.part.name,
        partId: job.part.id,
        orderNumber: job.order.orderNumber,
        orderId: job.order.id,
        printerName: job.printer?.name ?? null,
        printerId: job.printerId,
        filament: job.spool
          ? {
              brand: job.spool.filament.brand,
              colorName: job.spool.filament.color.name,
              colorHex: job.spool.filament.color.hex,
            }
          : null,
        duration: durationMinutes,
        failureReason: job.failureReason,
        failureNotes: job.failureNotes,
        createdAt: job.createdAt,
      }
    })

    const totalPages = Math.ceil(total / limit)

    return apiSuccess({
      jobs: formattedJobs,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching job history:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
