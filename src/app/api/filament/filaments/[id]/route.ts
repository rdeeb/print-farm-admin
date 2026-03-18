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

    const filament = await prisma.filament.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        type: true,
        color: true,
        spools: {
          orderBy: {
            remainingPercent: 'desc',
          },
        },
        _count: {
          select: {
            spools: true,
          },
        },
      },
    })

    if (!filament) {
      return apiError('NOT_FOUND', 'Filament not found', 404)
    }

    return apiSuccess({
      ...filament,
      totalWeight: filament.spools.reduce((sum, s) => sum + (s.capacity ?? s.weight), 0),
      totalRemainingWeight: filament.spools.reduce(
        (sum, s) => sum + (s.remainingQuantity ?? s.remainingWeight),
        0
      ),
    })
  } catch (error) {
    console.error('Error fetching filament:', error)
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

    const existing = await prisma.filament.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Filament not found', 404)
    }

    const body = await request.json()
    const {
      costPerKg,
      supplier,
      notes,
      baseLandedCostPerUnit,
      defaultUnit,
      technology,
    } = body

    const filament = await prisma.filament.update({
      where: { id: params.id },
      data: {
        costPerKg: costPerKg || null,
        baseLandedCostPerUnit:
          typeof baseLandedCostPerUnit === 'number'
            ? baseLandedCostPerUnit
            : costPerKg
              ? costPerKg / 1000
              : null,
        ...(defaultUnit ? { defaultUnit } : {}),
        ...(technology ? { technology } : {}),
        supplier: supplier || null,
        notes: notes || null,
      },
      include: {
        type: true,
        color: true,
        spools: {
          orderBy: {
            remainingPercent: 'desc',
          },
        },
        _count: {
          select: {
            spools: true,
          },
        },
      },
    })

    return apiSuccess({
      ...filament,
      totalWeight: filament.spools.reduce((sum, s) => sum + (s.capacity ?? s.weight), 0),
      totalRemainingWeight: filament.spools.reduce(
        (sum, s) => sum + (s.remainingQuantity ?? s.remainingWeight),
        0
      ),
    })
  } catch (error) {
    console.error('Error updating filament:', error)
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

    const existing = await prisma.filament.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { spools: true },
        },
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Filament not found', 404)
    }

    // This will cascade delete all spools
    await prisma.filament.delete({
      where: { id: params.id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting filament:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
