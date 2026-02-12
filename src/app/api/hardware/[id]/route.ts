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

    const hardware = await prisma.hardware.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    if (!hardware) {
      return NextResponse.json({ error: 'Hardware not found' }, { status: 404 })
    }

    return NextResponse.json(hardware)
  } catch (error) {
    console.error('Error fetching hardware:', error)
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

    // Verify hardware belongs to tenant
    const existing = await prisma.hardware.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Hardware not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, packPrice, packQuantity, packUnit, description } = body

    const hardware = await prisma.hardware.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name : existing.name,
        packPrice: packPrice !== undefined ? parseFloat(packPrice) : existing.packPrice,
        packQuantity: packQuantity !== undefined ? parseFloat(packQuantity) : existing.packQuantity,
        packUnit: packUnit !== undefined ? packUnit : existing.packUnit,
        description: description !== undefined ? (description || null) : existing.description,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    return NextResponse.json(hardware)
  } catch (error) {
    console.error('Error updating hardware:', error)
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

    // Verify hardware belongs to tenant
    const existing = await prisma.hardware.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Hardware not found' }, { status: 404 })
    }

    await prisma.hardware.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hardware:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
