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

    const hardware = await prisma.hardware.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return apiSuccess(hardware)
  } catch (error) {
    console.error('Error fetching hardware:', error)
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
    const { name, packPrice, packQuantity, packUnit, description } = body

    if (!name || packPrice === undefined || packQuantity === undefined || !packUnit) {
      return apiError('BAD_REQUEST', 'Missing required fields', 400)
    }

    const hardware = await prisma.hardware.create({
      data: {
        name,
        packPrice: parseFloat(packPrice),
        packQuantity: parseFloat(packQuantity),
        packUnit,
        description: description || null,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    return apiSuccess(hardware, 201)
  } catch (error) {
    console.error('Error creating hardware:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
