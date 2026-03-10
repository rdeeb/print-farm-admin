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

    const spool = await prisma.filamentSpool.findFirst({
      where: {
        id: params.id,
        filament: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        filament: {
          include: {
            type: true,
            color: true,
          },
        },
      },
    })

    if (!spool) {
      return apiError('NOT_FOUND', 'Spool not found', 404)
    }

    return apiSuccess(spool)
  } catch (error) {
    console.error('Error fetching spool:', error)
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

    // Verify spool belongs to tenant
    const existing = await prisma.filamentSpool.findFirst({
      where: {
        id: params.id,
        filament: {
          tenantId: session.user.tenantId,
        },
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Spool not found', 404)
    }

    const body = await request.json()
    const { weight, capacity, remainingPercent, landedCostTotal, purchaseDate, notes } = body

    const normalizedCapacity = capacity ?? weight
    const remainingWeight = Math.round(normalizedCapacity * (remainingPercent / 100))

    const spool = await prisma.filamentSpool.update({
      where: { id: params.id },
      data: {
        weight,
        capacity: normalizedCapacity,
        remainingWeight,
        remainingQuantity: remainingWeight,
        landedCostTotal: typeof landedCostTotal === 'number' ? landedCostTotal : existing.landedCostTotal,
        remainingPercent,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes: notes || null,
      },
      include: {
        filament: {
          include: {
            type: true,
            color: true,
          },
        },
      },
    })

    return apiSuccess(spool)
  } catch (error) {
    console.error('Error updating spool:', error)
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

    // Verify spool belongs to tenant
    const existing = await prisma.filamentSpool.findFirst({
      where: {
        id: params.id,
        filament: {
          tenantId: session.user.tenantId,
        },
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Spool not found', 404)
    }

    await prisma.filamentSpool.delete({
      where: { id: params.id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting spool:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
