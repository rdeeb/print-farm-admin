import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
    const { status } = body

    // Find the print job
    const printJob = await prisma.printJob.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!printJob) {
      return NextResponse.json({ error: 'Print job not found' }, { status: 404 })
    }

    // Only allow cancelling QUEUED jobs
    if (status === 'CANCELLED') {
      if (printJob.status !== 'QUEUED') {
        return NextResponse.json(
          { error: 'Only queued jobs can be cancelled' },
          { status: 400 }
        )
      }

      // Update print job to CANCELLED and revert order part to WAITING
      await prisma.$transaction(async tx => {
        // Update print job status
        await tx.printJob.update({
          where: { id: params.id },
          data: {
            status: 'CANCELLED',
            endTime: new Date(),
          },
        })

        // Find and revert the order part status to WAITING
        const orderPart = await tx.orderPart.findFirst({
          where: {
            orderId: printJob.orderId,
            partId: printJob.partId,
            status: 'QUEUED',
          },
        })

        if (orderPart) {
          await tx.orderPart.update({
            where: { id: orderPart.id },
            data: {
              status: 'WAITING',
              filamentId: null,
            },
          })
        }

        // Check if this was the only active part and revert order status if needed
        const remainingActiveParts = await tx.orderPart.count({
          where: {
            orderId: printJob.orderId,
            status: { in: ['QUEUED', 'PRINTING'] },
          },
        })

        if (remainingActiveParts === 0) {
          // Check if there are any printed parts
          const printedParts = await tx.orderPart.count({
            where: {
              orderId: printJob.orderId,
              status: 'PRINTED',
            },
          })

          const totalParts = await tx.orderPart.count({
            where: { orderId: printJob.orderId },
          })

          // If no parts are printed, revert to PENDING, otherwise keep IN_PROGRESS
          if (printedParts === 0) {
            await tx.order.update({
              where: { id: printJob.orderId },
              data: { status: 'PENDING' },
            })
          } else if (printedParts === totalParts) {
            await tx.order.update({
              where: { id: printJob.orderId },
              data: { status: 'WAITING' },
            })
          }
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 })
  } catch (error) {
    console.error('Error updating print job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
