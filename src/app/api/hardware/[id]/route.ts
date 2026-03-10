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

    const hardware = await prisma.hardware.findFirst({
      where: {
        id: params.id,
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

    if (!hardware) {
      return apiError('NOT_FOUND', 'Hardware not found', 404)
    }

    return apiSuccess(hardware)
  } catch (error) {
    console.error('Error fetching hardware:', error)
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

    // Verify hardware belongs to tenant
    const existing = await prisma.hardware.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Hardware not found', 404)
    }

    const body = await request.json()
    const { name, packPrice, packQuantity, packUnit, description } = body

    const hardware = await prisma.hardware.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existing.name,
        packPrice: packPrice !== undefined ? parseFloat(packPrice) : existing.packPrice,
        packQuantity: packQuantity !== undefined ? parseFloat(packQuantity) : existing.packQuantity,
        packUnit: packUnit !== undefined ? packUnit : existing.packUnit,
        description: description !== undefined ? (description || null) : existing.description,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    return apiSuccess(hardware)
  } catch (error) {
    console.error('Error updating hardware:', error)
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

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    // Verify hardware belongs to tenant
    const existing = await prisma.hardware.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Hardware not found', 404)
    }

    await prisma.hardware.delete({
      where: { id: params.id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting hardware:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
