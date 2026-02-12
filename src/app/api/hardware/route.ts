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

    const hardware = await prisma.hardware.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(hardware)
  } catch (error) {
    console.error('Error fetching hardware:', error)
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
    const { name, packPrice, packQuantity, packUnit, description } = body

    if (!name || packPrice === undefined || packQuantity === undefined || !packUnit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const hardware = await prisma.hardware.create({
      data: {
        name,
        packPrice: parseFloat(packPrice),
        packQuantity: parseFloat(packQuantity),
        packUnit,
        description: description || null,
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

    return NextResponse.json(hardware, { status: 201 })
  } catch (error) {
    console.error('Error creating hardware:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
