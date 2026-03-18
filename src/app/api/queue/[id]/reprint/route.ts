export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

const REPRINTABLE_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'] as const

// Success response shape: { id: string } — the ID of the newly created QUEUED job.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Find original job scoped to tenant
    const original = await prisma.printJob.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!original) {
      return apiError('NOT_FOUND', 'Print job not found', 404)
    }

    if (!(REPRINTABLE_STATUSES as readonly string[]).includes(original.status)) {
      return apiError(
        'BAD_REQUEST',
        'Only jobs with status COMPLETED, FAILED, or CANCELLED can be reprinted',
        400
      )
    }

    // Validate that the referenced order and part still exist before cloning
    const [order, part] = await Promise.all([
      prisma.order.findFirst({ where: { id: original.orderId, tenantId: session.user.tenantId } }),
      prisma.projectPart.findFirst({ where: { id: original.partId } }),
    ])

    if (!order || !part) {
      return apiError('BAD_REQUEST', 'The original order or part no longer exists', 400)
    }

    // Clone to a new QUEUED job. Printer and spool are intentionally left unassigned
    // so the operator can pick a current, active printer and spool.
    const newJob = await prisma.printJob.create({
      data: {
        tenantId: original.tenantId,
        orderId: original.orderId,
        partId: original.partId,
        printerId: null,
        spoolId: null,
        priority: original.priority,
        estimatedTime: original.estimatedTime,
        notes: original.notes,
        createdById: session.user.id,
        status: 'QUEUED',
        startTime: null,
        endTime: null,
        actualTime: null,
        failureReason: null,
        failureNotes: null,
      },
    })

    return apiSuccess({ id: newJob.id }, 201)
  } catch (error) {
    console.error('Error reprinting job:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
