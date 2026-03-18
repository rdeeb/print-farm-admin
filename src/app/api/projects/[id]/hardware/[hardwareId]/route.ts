export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; hardwareId: string } }
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

    // Find the project hardware entry
    const projectHardware = await prisma.projectHardware.findFirst({
      where: {
        projectId: params.id,
        hardwareId: params.hardwareId,
      },
    })

    if (!projectHardware) {
      return apiError('NOT_FOUND', 'Hardware not found in project', 404)
    }

    const body = await request.json()
    const { quantity } = body

    const updated = await prisma.projectHardware.update({
      where: { id: projectHardware.id },
      data: {
        quantity: quantity !== undefined ? parseFloat(quantity) : projectHardware.quantity,
      },
      include: {
        hardware: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Error updating project hardware:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; hardwareId: string } }
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

    // Find and delete the project hardware entry
    const projectHardware = await prisma.projectHardware.findFirst({
      where: {
        projectId: params.id,
        hardwareId: params.hardwareId,
      },
    })

    if (!projectHardware) {
      return apiError('NOT_FOUND', 'Hardware not found in project', 404)
    }

    await prisma.projectHardware.delete({
      where: { id: projectHardware.id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error removing hardware from project:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
