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

    const jobs = await prisma.printJob.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            client: {
              select: {
                name: true,
              },
            },
            orderParts: {
              select: {
                partId: true,
                quantity: true,
              },
            },
          },
        },
        part: {
          select: {
            id: true,
            name: true,
          },
        },
        printer: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        spool: {
          select: {
            id: true,
            filamentId: true,
            filament: {
              select: {
                brand: true,
                color: {
                  select: {
                    name: true,
                    hex: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    // Add quantity to each job and flatten nested data for frontend
    const jobsWithQuantity = jobs.map(job => {
      const orderPart = job.order.orderParts.find(op => op.partId === job.partId)
      return {
        ...job,
        quantity: orderPart?.quantity ?? 1,
        order: {
          id: job.order.id,
          orderNumber: job.order.orderNumber,
          clientName: job.order.client.name,
        },
        spool: job.spool ? {
          id: job.spool.id,
          filamentId: job.spool.filamentId,
          brand: job.spool.filament.brand,
          color: job.spool.filament.color,
        } : null,
      }
    })

    return NextResponse.json(jobsWithQuantity)
  } catch (error) {
    console.error('Error fetching queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
