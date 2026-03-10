import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const projects = await prisma.project.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            parts: true,
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return apiSuccess(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
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
    const { name, description } = body

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
      },
      include: {
        _count: {
          select: {
            parts: true,
            orders: true,
          },
        },
      },
    })

    return apiSuccess(project, 201)
  } catch (error) {
    console.error('Error creating project:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
