export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    const material = await prisma.filament.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: {
        type: true,
        color: true,
        spools: true,
      },
    })

    if (!material) {
      return apiError('NOT_FOUND', 'Material not found', 404)
    }

    return apiSuccess({
      ...material,
      containers: material.spools,
    })
  } catch (error) {
    console.error('Material GET error:', error)
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
    const material = await prisma.filament.update({
      where: { id: params.id },
      data: {
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.technology !== undefined && { technology: body.technology }),
        ...(body.defaultUnit !== undefined && { defaultUnit: body.defaultUnit }),
        ...(body.costPerKg !== undefined && { costPerKg: body.costPerKg || null }),
        ...(body.baseLandedCostPerUnit !== undefined && {
          baseLandedCostPerUnit: body.baseLandedCostPerUnit || null,
        }),
        ...(body.supplier !== undefined && { supplier: body.supplier || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return apiSuccess(material)
  } catch (error) {
    console.error('Material PATCH error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
