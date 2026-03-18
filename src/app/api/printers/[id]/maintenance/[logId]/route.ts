export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; logId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify the log's printer belongs to the tenant
    const log = await prisma.printerMaintenanceLog.findFirst({
      where: { id: params.logId },
      include: {
        printer: {
          select: { tenantId: true },
        },
      },
    })

    if (!log || log.printer.tenantId !== session.user.tenantId) {
      return apiError('NOT_FOUND', 'Maintenance log not found', 404)
    }

    await prisma.printerMaintenanceLog.delete({
      where: { id: params.logId },
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    console.error('Error deleting maintenance log:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
