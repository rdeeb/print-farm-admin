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
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...filament,
      totalWeight: filament.spools.reduce((sum, s) => sum + s.weight, 0),
      totalRemainingWeight: filament.spools.reduce((sum, s) => sum + s.remainingWeight, 0),
    })
  } catch (error) {
    console.error('Error fetching filament:', error)
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

    const existing = await prisma.filament.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 })
    }

    const body = await request.json()
    const { costPerKg, supplier, notes } = body

    const filament = await prisma.filament.update({
      where: { id: params.id },
      data: {
        costPerKg: costPerKg || null,
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

    return NextResponse.json({
      ...filament,
      totalWeight: filament.spools.reduce((sum, s) => sum + s.weight, 0),
      totalRemainingWeight: filament.spools.reduce((sum, s) => sum + s.remainingWeight, 0),
    })
  } catch (error) {
    console.error('Error updating filament:', error)
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
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 })
    }

    // This will cascade delete all spools
    await prisma.filament.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting filament:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
