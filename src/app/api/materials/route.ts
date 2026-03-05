import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const technology = searchParams.get('technology')

    const materials = await prisma.filament.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(technology ? { technology: technology as 'FDM' | 'SLA' | 'SLS' } : {}),
      },
      include: {
        type: true,
        color: true,
        spools: true,
      },
      orderBy: [{ brand: 'asc' }, { type: { name: 'asc' } }],
    })

    return NextResponse.json(
      materials.map((material) => ({
        ...material,
        containers: material.spools,
        totalQuantity: material.spools.reduce(
          (sum, container) => sum + (container.remainingQuantity ?? container.remainingWeight),
          0
        ),
      }))
    )
  } catch (error) {
    console.error('Materials GET error:', error)
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
    const material = await prisma.filament.create({
      data: {
        brand: body.brand,
        typeId: body.typeId,
        colorId: body.colorId,
        tenantId: session.user.tenantId,
        technology: body.technology || 'FDM',
        defaultUnit:
          body.defaultUnit ||
          (body.technology === 'SLA' ? 'MILLILITER' : 'GRAM'),
        costPerKg: body.costPerKg || null,
        baseLandedCostPerUnit:
          typeof body.baseLandedCostPerUnit === 'number'
            ? body.baseLandedCostPerUnit
            : body.costPerKg
              ? body.costPerKg / 1000
              : null,
        supplier: body.supplier || null,
        notes: body.notes || null,
      },
      include: {
        type: true,
        color: true,
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error('Materials POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
