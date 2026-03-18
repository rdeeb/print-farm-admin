export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const printer = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!printer) {
      return apiError('NOT_FOUND', 'Printer not found', 404)
    }

    const logs = await prisma.printerMaintenanceLog.findMany({
      where: { printerId: params.id },
      orderBy: { performedAt: 'desc' },
    })

    return apiSuccess(logs)
  } catch (error) {
    console.error('Error fetching maintenance logs:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(
  request: NextRequest,
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

    const printer = await prisma.printer.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!printer) {
      return apiError('NOT_FOUND', 'Printer not found', 404)
    }

    const body = await request.json()
    const { type, notes, performedBy, performedAt } = body

    if (!type) {
      return apiError('VALIDATION_ERROR', 'type is required', 400)
    }

    const performedAtDate = performedAt ? new Date(performedAt) : new Date()

    const log = await prisma.printerMaintenanceLog.create({
      data: {
        printerId: params.id,
        type,
        notes: notes || null,
        performedBy: performedBy || null,
        performedAt: performedAtDate,
      },
    })

    // Auto-update nextMaintenanceDue if interval is set
    if (printer.maintenanceIntervalDays && printer.maintenanceIntervalDays > 0 && printer.maintenanceIntervalDays <= 3650) {
      const nextDue = new Date(performedAtDate)
      nextDue.setDate(nextDue.getDate() + printer.maintenanceIntervalDays)
      await prisma.printer.update({
        where: { id: params.id },
        data: { nextMaintenanceDue: nextDue },
      })
    }

    return apiSuccess(log, 201)
  } catch (error) {
    console.error('Error creating maintenance log:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
