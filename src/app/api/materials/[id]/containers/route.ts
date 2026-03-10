import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createLedgerEntry, getTenantFinanceContext } from '@/lib/finance-ledger'
import { apiError, apiSuccess } from '@/lib/api-response'

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

    const material = await prisma.filament.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      select: { id: true, baseLandedCostPerUnit: true },
    })
    if (!material) {
      return apiError('NOT_FOUND', 'Material not found', 404)
    }

    const { currency } = await getTenantFinanceContext(session.user.tenantId)
    const body = await request.json()
    const containers = Array.isArray(body.containers) ? body.containers : []
    if (containers.length === 0) {
      return apiError('BAD_REQUEST', 'At least one container is required', 400)
    }

    const created = await prisma.$transaction(
      containers.map(
        (container: {
          capacity: number
          remainingPercent: number
          landedCostTotal?: number
          notes?: string
          purchaseDate?: string
        }) =>
          prisma.filamentSpool.create({
            data: {
              filamentId: params.id,
              weight: container.capacity,
              capacity: container.capacity,
              remainingPercent: container.remainingPercent,
              remainingWeight: Math.round(container.capacity * (container.remainingPercent / 100)),
              remainingQuantity: Math.round(container.capacity * (container.remainingPercent / 100)),
              landedCostTotal:
                typeof container.landedCostTotal === 'number'
                  ? container.landedCostTotal
                  : material.baseLandedCostPerUnit
                    ? container.capacity * material.baseLandedCostPerUnit
                    : null,
              notes: container.notes || null,
              purchaseDate: container.purchaseDate ? new Date(container.purchaseDate) : null,
            },
          })
      )
    )

    await Promise.all(
      created.map((container) =>
        createLedgerEntry({
          tenantId: session.user.tenantId,
          amount: container.landedCostTotal || 0,
          type: 'EXPENSE',
          source: 'CONTAINER_INTAKE',
          currency,
          autoKey: `container-intake-${container.id}`,
          spoolId: container.id,
        })
      )
    )

    return apiSuccess(created, 201)
  } catch (error) {
    console.error('Material containers POST error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
