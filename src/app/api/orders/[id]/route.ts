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

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        project: {
          include: {
            parts: {
              select: {
                id: true,
                quantity: true,
              },
            },
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
        orderParts: {
          include: {
            filament: {
              include: {
                type: true,
                color: true,
              },
            },
            part: {
              include: {
                filamentColor: {
                  include: {
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.orderParts.length === 0 && order.project.parts.length > 0) {
      await prisma.orderPart.createMany({
        data: order.project.parts.map(part => ({
          orderId: order.id,
          partId: part.id,
          quantity: part.quantity * order.quantity,
        })),
      })

      const refreshed = await prisma.order.findFirst({
        where: {
          id: params.id,
          tenantId: session.user.tenantId,
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
          orderParts: {
            include: {
              filament: {
                include: {
                  type: true,
                  color: true,
                },
              },
              part: {
                include: {
                  filamentColor: {
                    include: {
                      type: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      return NextResponse.json(refreshed)
    }

    // Get printer assignments from print jobs for QUEUED/PRINTING parts
    const printJobs = await prisma.printJob.findMany({
      where: {
        orderId: params.id,
        status: { in: ['QUEUED', 'PRINTING'] },
      },
      select: {
        partId: true,
        printerId: true,
      },
    })

    const printerByPart = new Map(printJobs.map(job => [job.partId, job.printerId]))

    // Add printerId to each order part
    const orderPartsWithPrinter = order.orderParts.map(op => ({
      ...op,
      printerId: printerByPart.get(op.partId) || null,
    }))

    return NextResponse.json({
      ...order,
      project: {
        id: order.project.id,
        name: order.project.name,
      },
      orderParts: orderPartsWithPrinter,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
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
    const { status, dueDate } = body
    const hasDueDate = Object.prototype.hasOwnProperty.call(body, 'dueDate')

    if (!status && !hasDueDate) {
      return NextResponse.json({ error: 'Status or due date is required' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        orderParts: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (status) {
      if (status === 'DELIVERED' && !['WAITING', 'ASSEMBLED'].includes(order.status)) {
        return NextResponse.json(
          { error: 'Order must be waiting for assembly before delivery' },
          { status: 400 }
        )
      }

      if (status === 'WAITING' || status === 'ASSEMBLED') {
        const allPrinted = order.orderParts.every(part => part.status === 'PRINTED')
        if (!allPrinted) {
          return NextResponse.json(
            { error: 'All parts must be printed before waiting for assembly' },
            { status: 400 }
          )
        }
      }
    }

    const data: { status?: typeof status; dueDate?: Date | null } = {}
    if (status) {
      data.status = status
    }
    if (hasDueDate) {
      data.dueDate = dueDate ? new Date(dueDate) : null
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
