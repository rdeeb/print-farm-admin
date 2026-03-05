import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
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

    // Verify filament belongs to tenant
    const filament = await prisma.filament.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        defaultUnit: true,
        baseLandedCostPerUnit: true,
      },
    })

    if (!filament) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 })
    }

    const body = await request.json()
    const { spools } = body // Array of { weight, remainingPercent, purchaseDate?, notes? }

    if (!Array.isArray(spools) || spools.length === 0) {
      return NextResponse.json({ error: 'At least one spool is required' }, { status: 400 })
    }

    // Create all spools
    const { currency } = await getTenantFinanceContext(session.user.tenantId)

    const createdSpools = await prisma.$transaction(
      spools.map(
        (spool: {
          weight: number
          capacity?: number
          landedCostTotal?: number
          remainingPercent: number
          purchaseDate?: string
          notes?: string
        }) => {
        const capacity = spool.capacity ?? spool.weight
        const remainingWeight = Math.round(capacity * (spool.remainingPercent / 100))
        const landedCostTotal =
          typeof spool.landedCostTotal === 'number'
            ? spool.landedCostTotal
            : filament.baseLandedCostPerUnit
              ? capacity * filament.baseLandedCostPerUnit
              : null

        return prisma.filamentSpool.create({
          data: {
            weight: spool.weight,
            remainingWeight,
            capacity,
            remainingQuantity: remainingWeight,
            landedCostTotal,
            remainingPercent: spool.remainingPercent,
            purchaseDate: spool.purchaseDate ? new Date(spool.purchaseDate) : null,
            notes: spool.notes || null,
            filamentId: params.id,
          },
        })
        }
      )
    )

    await Promise.all(
      createdSpools.map((spool) =>
        createLedgerEntry({
          tenantId: session.user.tenantId,
          amount: spool.landedCostTotal || 0,
          type: 'EXPENSE',
          source: 'CONTAINER_INTAKE',
          currency,
          autoKey: `container-intake-${spool.id}`,
          note: `Container intake for ${filament.defaultUnit === 'MILLILITER' ? 'resin' : 'material'}`,
          spoolId: spool.id,
        })
      )
    )

    return NextResponse.json(createdSpools, { status: 201 })
  } catch (error) {
    console.error('Error creating spools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
