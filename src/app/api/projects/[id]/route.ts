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

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        parts: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
        hardware: {
          include: {
            hardware: true,
          },
          orderBy: {
            hardware: {
              name: 'asc',
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    })

    if (!project) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    return apiSuccess(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function PATCH(
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

    const body = await request.json()
    const { name, description, status, assemblyTime, salesPrice } = body

    // Verify project belongs to tenant
    const existing = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        status,
        assemblyTime: assemblyTime !== undefined ? (assemblyTime ? parseInt(assemblyTime) : null) : existing.assemblyTime,
        salesPrice: salesPrice !== undefined ? (salesPrice === '' || salesPrice == null ? null : parseFloat(salesPrice)) : existing.salesPrice,
      },
    })

    return apiSuccess(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify project belongs to tenant
    const existing = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Project not found', 404)
    }

    await prisma.project.delete({
      where: { id: params.id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
