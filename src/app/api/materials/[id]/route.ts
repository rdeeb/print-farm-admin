import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const material = await prisma.filament.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      include: {
        type: true,
        color: true,
        spools: true,
      },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...material,
      containers: material.spools,
    })
  } catch (error) {
    console.error('Material GET error:', error)
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

    const body = await request.json()
    const material = await prisma.filament.update({
      where: { id: params.id },
      data: {
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.technology !== undefined && { technology: body.technology }),
        ...(body.defaultUnit !== undefined && { defaultUnit: body.defaultUnit }),
        ...(body.costPerKg !== undefined && { costPerKg: body.costPerKg || null }),
        ...(body.baseLandedCostPerUnit !== undefined && {
          baseLandedCostPerUnit: body.baseLandedCostPerUnit || null,
        }),
        ...(body.supplier !== undefined && { supplier: body.supplier || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Material PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
