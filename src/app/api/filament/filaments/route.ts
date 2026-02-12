import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filaments = await prisma.filament.findMany({
      where: {
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
      orderBy: [
        { brand: 'asc' },
        { type: { name: 'asc' } },
      ],
    })

    // Exclude 0% spools from totals and visualization; only include usable spools
    const filamentsWithTotals = filaments.map(filament => {
      const usableSpools = filament.spools.filter(s => s.remainingPercent > 0)
      return {
        ...filament,
        spools: usableSpools,
        totalWeight: usableSpools.reduce((sum, s) => sum + s.weight, 0),
        totalRemainingWeight: usableSpools.reduce((sum, s) => sum + s.remainingWeight, 0),
        _count: { spools: usableSpools.length },
      }
    })

    return NextResponse.json(filamentsWithTotals)
  } catch (error) {
    console.error('Error fetching filaments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { brand, typeId, colorId, costPerKg, supplier, notes } = body

    // Check if filament already exists
    const existing = await prisma.filament.findFirst({
      where: {
        brand,
        typeId,
        colorId,
        tenantId: session.user.tenantId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This filament combination already exists', existingId: existing.id },
        { status: 409 }
      )
    }

    const filament = await prisma.filament.create({
      data: {
        brand,
        typeId,
        colorId,
        costPerKg: costPerKg || null,
        supplier: supplier || null,
        notes: notes || null,
        tenantId: session.user.tenantId,
      },
      include: {
        type: true,
        color: true,
        spools: true,
        _count: {
          select: {
            spools: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...filament,
      totalWeight: 0,
      totalRemainingWeight: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating filament:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
