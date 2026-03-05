import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Spool not found' }, { status: 404 })
    }

    return NextResponse.json(spool)
  } catch (error) {
    console.error('Error fetching spool:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: 'Spool not found' }, { status: 404 })
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

    return NextResponse.json(spool)
  } catch (error) {
    console.error('Error updating spool:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Spool not found' }, { status: 404 })
    }

    await prisma.filamentSpool.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting spool:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
