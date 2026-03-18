export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const technology = searchParams.get('technology')

    const materials = await prisma.filament.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(technology ? { technology: technology as 'FDM' | 'SLA' | 'SLS' } : {}),
      },
      include: {
        type: true,
        color: true,
        spools: true,
      },
      orderBy: [{ brand: 'asc' }, { type: { name: 'asc' } }],
    })

    return apiSuccess(
      materials.map((material) => ({
        ...material,
        containers: material.spools,
        totalQuantity: material.spools.reduce(
          (sum, container) => sum + (container.remainingQuantity ?? container.remainingWeight),
          0
        ),
      }))
    )
  } catch (error) {
    console.error('Materials GET error:', error)
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
    const material = await prisma.filament.create({
      data: {
        brand: body.brand,
        typeId: body.typeId,
        colorId: body.colorId,
        tenantId: session.user.tenantId,
        technology: body.technology || 'FDM',
        defaultUnit:
          body.defaultUnit ||
          (body.technology === 'SLA' ? 'MILLILITER' : 'GRAM'),
        costPerKg: body.costPerKg || null,
        baseLandedCostPerUnit:
          typeof body.baseLandedCostPerUnit === 'number'
            ? body.baseLandedCostPerUnit
            : body.costPerKg
              ? body.costPerKg / 1000
              : null,
        supplier: body.supplier || null,
        notes: body.notes || null,
      },
      include: {
        type: true,
        color: true,
      },
    })

    return apiSuccess(material, 201)
  } catch (error) {
    console.error('Materials POST error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
