import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createLedgerEntry, getTenantFinanceContext } from '@/lib/finance-ledger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const material = await prisma.filament.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      select: { id: true, baseLandedCostPerUnit: true },
    })
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const { currency } = await getTenantFinanceContext(session.user.tenantId)
    const body = await request.json()
    const containers = Array.isArray(body.containers) ? body.containers : []
    if (containers.length === 0) {
      return NextResponse.json({ error: 'At least one container is required' }, { status: 400 })
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

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Material containers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
