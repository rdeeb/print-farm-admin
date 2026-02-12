import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
    const createdSpools = await prisma.$transaction(
      spools.map((spool: { weight: number; remainingPercent: number; purchaseDate?: string; notes?: string }) => {
        const remainingWeight = Math.round(spool.weight * (spool.remainingPercent / 100))
        return prisma.filamentSpool.create({
          data: {
            weight: spool.weight,
            remainingWeight,
            remainingPercent: spool.remainingPercent,
            purchaseDate: spool.purchaseDate ? new Date(spool.purchaseDate) : null,
            notes: spool.notes || null,
            filamentId: params.id,
          },
        })
      })
    )

    return NextResponse.json(createdSpools, { status: 201 })
  } catch (error) {
    console.error('Error creating spools:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
