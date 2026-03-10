import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
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
      return apiError('NOT_FOUND', 'Filament not found', 404)
    }

    const body = await request.json()
    const { spools } = body // Array of { weight, remainingPercent, purchaseDate?, notes? }

    if (!Array.isArray(spools) || spools.length === 0) {
      return apiError('BAD_REQUEST', 'At least one spool is required', 400)
    }

    // Create all spools
    const [{ currency }, tenantSettings] = await Promise.all([
      getTenantFinanceContext(session.user.tenantId),
      // #2: Fetch tenant's default low-stock threshold to use as fallback
      prisma.tenantSettings.findUnique({
        where: { tenantId: session.user.tenantId },
        select: { defaultLowStockThreshold: true },
      }),
    ])
    const tenantDefaultThreshold = tenantSettings?.defaultLowStockThreshold ?? 20

    // #8: Helper to clamp and validate lowStockThreshold per spool
    const clampThreshold = (raw: unknown, fallback: number): number => {
      if (typeof raw === 'number' && isFinite(raw)) {
        return Math.min(100, Math.max(0, Math.round(raw)))
      }
      return fallback
    }

    const createdSpools = await prisma.$transaction(
      spools.map(
        (spool: {
          weight: number
          capacity?: number
          landedCostTotal?: number
          remainingPercent: number
          lowStockThreshold?: number
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
            // #2/#8: Use per-spool value if provided, else tenant default, clamped 0-100
            lowStockThreshold: clampThreshold(spool.lowStockThreshold, tenantDefaultThreshold),
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

    return apiSuccess(createdSpools, 201)
  } catch (error) {
    console.error('Error creating spools:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
