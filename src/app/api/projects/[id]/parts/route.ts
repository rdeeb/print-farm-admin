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

    const parts = await prisma.projectPart.findMany({
      where: {
        projectId: params.id,
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
      orderBy: {
        createdAt: 'asc',
      },
    })

    return apiSuccess(parts)
  } catch (error) {
    console.error('Error fetching parts:', error)
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

    const part = await prisma.projectPart.create({
      data: {
        name,
        description: description || null,
        filamentWeight,
        materialUsagePerUnit: materialUsagePerUnit ?? filamentWeight,
        printTime: printTime || null,
        quantity,
        projectId: params.id,
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

    return apiSuccess(part, 201)
  } catch (error) {
    console.error('Error creating part:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
