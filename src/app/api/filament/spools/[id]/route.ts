export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { createNotification } from '@/lib/notifications'

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
    const { weight, capacity, remainingPercent, landedCostTotal, purchaseDate, notes, lowStockThreshold: rawThreshold } = body

    // #7: Validate and clamp lowStockThreshold when explicitly provided
    if (rawThreshold !== undefined && (typeof rawThreshold !== 'number' || !isFinite(rawThreshold))) {
      return apiError('BAD_REQUEST', 'lowStockThreshold must be a finite number', 400)
    }
    const resolvedThreshold =
      typeof rawThreshold === 'number' && isFinite(rawThreshold)
        ? Math.min(100, Math.max(0, Math.round(rawThreshold)))
        : existing.lowStockThreshold

    const normalizedCapacity = capacity ?? weight
    const remainingWeight = Math.round(normalizedCapacity * (remainingPercent / 100))

    // #1: Capture pre-update value to detect threshold crossing
    const previousRemainingPercent = existing.remainingPercent

    const spool = await prisma.filamentSpool.update({
      where: { id: params.id },
      data: {
        weight,
        capacity: normalizedCapacity,
        remainingWeight,
        remainingQuantity: remainingWeight,
        landedCostTotal: typeof landedCostTotal === 'number' ? landedCostTotal : existing.landedCostTotal,
        remainingPercent,
        lowStockThreshold: resolvedThreshold,
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

    // #1: Only notify when the spool crosses the threshold for the first time (was above, now at or below)
    const wasAbove = previousRemainingPercent > resolvedThreshold
    const isNowBelow = remainingPercent <= resolvedThreshold && remainingPercent > 0
    if (wasAbove && isNowBelow) {
      const tenantId = session.user.tenantId
      const filamentLabel = [
        spool.filament.brand,
        spool.filament.type.code,
        spool.filament.color.name,
      ]
        .filter(Boolean)
        .join(' ')
      // #13: Isolate notification errors — do not let them fail the spool update response
      try {
        await createNotification({
          tenantId,
          type: 'FILAMENT_LOW',
          message: `${filamentLabel} spool is at ${remainingPercent}% remaining (threshold: ${resolvedThreshold}%).`,
          dedupeKey: spool.id,
        })
      } catch (e) {
        console.error('[F2] Notification failed for spool', spool.id, e)
      }
    }

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
