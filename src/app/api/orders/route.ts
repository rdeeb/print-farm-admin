import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { calculateSuggestedDueDate } from '@/lib/production-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        orderParts: {
          select: {
            id: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            source: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const ordersWithProgress = orders.map(order => {
      const totalParts = order.orderParts.length
      const printedParts = order.orderParts.filter(part => part.status === 'PRINTED').length

      return {
        ...order,
        partsTotal: totalParts,
        partsPrinted: printedParts,
      }
    })

    return NextResponse.json(ordersWithProgress)
  } catch (error) {
    console.error('Error fetching orders:', error)
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
    const { projectId, quantity, priority, dueDate, clientId, notes } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Client is required' }, { status: 400 })
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: session.user.tenantId,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Generate order number
    const count = await prisma.order.count({
      where: { tenantId: session.user.tenantId },
    })
    const orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: session.user.tenantId,
      },
      include: {
        parts: {
          select: {
            id: true,
            quantity: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const orderParts = project.parts.map(part => ({
      partId: part.id,
      quantity: part.quantity * quantity,
    }))

    const order = await prisma.order.create({
      data: {
        orderNumber,
        quantity,
        status: 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId,
        notes: notes || null,
        tenantId: session.user.tenantId,
        projectId,
        createdById: session.user.id,
        orderParts: {
          create: orderParts,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            source: true,
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
