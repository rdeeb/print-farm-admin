export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; partId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    // Verify part belongs to project
    const existingPart = await prisma.projectPart.findFirst({
      where: {
        id: params.partId,
        projectId: params.id,
      },
    })

    if (!existingPart) {
      return apiError('NOT_FOUND', 'Part not found', 404)
    }

    const body = await request.json()
    const {
      name,
      description,
      filamentWeight,
      materialUsagePerUnit,
      printTime,
      quantity,
      filamentColorId,
    } = body

    const part = await prisma.projectPart.update({
      where: { id: params.partId },
      data: {
        name,
        description: description || null,
        filamentWeight,
        materialUsagePerUnit: materialUsagePerUnit ?? filamentWeight,
        printTime: printTime || null,
        quantity,
        filamentColorId: filamentColorId || null,
        spoolId: null,
      },
      include: {
        filamentColor: {
          include: {
            type: true,
          },
        },
        spool: {
          include: {
            filament: {
              include: {
                type: true,
                color: true,
              },
            },
          },
        },
      },
    })

    return apiSuccess(part)
  } catch (error) {
    console.error('Error updating part:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; partId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify project belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    // Verify part belongs to project
    const existingPart = await prisma.projectPart.findFirst({
      where: {
        id: params.partId,
        projectId: params.id,
      },
    })

    if (!existingPart) {
      return apiError('NOT_FOUND', 'Part not found', 404)
    }

    await prisma.projectPart.delete({
      where: { id: params.partId },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting part:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
