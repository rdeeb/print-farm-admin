import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { createNotification } from '@/lib/notifications'

const patchSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('CANCELLED'),
  }),
  z.object({
    status: z.literal('FAILED'),
    failureReason: z.string().max(100).optional(),
    failureNotes: z.string().max(500).optional(),
  }),
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const rawBody = await request.json()
    const parsed = patchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return apiError('BAD_REQUEST', parsed.error.errors[0]?.message ?? 'Invalid request body', 400)
    }
    const body = parsed.data

    // Find the print job, including part name for notification message
    const printJob = await prisma.printJob.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        part: { select: { name: true } },
        printer: { select: { name: true } },
      },
    })

    if (!printJob) {
      return apiError('NOT_FOUND', 'Print job not found', 404)
    }

    // Only allow cancelling QUEUED jobs
    if (body.status === 'CANCELLED') {
      if (printJob.status !== 'QUEUED') {
        return apiError('BAD_REQUEST', 'Only queued jobs can be cancelled', 400)
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

      return apiSuccess({ success: true })
    }

    // Mark a job as FAILED
    if (body.status === 'FAILED') {
      if (!['QUEUED', 'PRINTING'].includes(printJob.status)) {
        return apiError('BAD_REQUEST', 'Only queued or printing jobs can be marked as failed', 400)
      }

      const { failureReason, failureNotes } = body

      // Use the job's current status to find the correct OrderPart
      const orderPartStatus = printJob.status === 'PRINTING' ? 'PRINTING' : 'QUEUED'

      await prisma.$transaction(async tx => {
        // Update print job status with separate reason and notes fields
        await tx.printJob.update({
          where: { id: params.id },
          data: {
            status: 'FAILED',
            endTime: new Date(),
            failureReason: failureReason ?? null,
            failureNotes: failureNotes ?? null,
          },
        })

        // Find and revert the order part status to WAITING using the explicit status filter
        const orderPart = await tx.orderPart.findFirst({
          where: {
            orderId: printJob.orderId,
            partId: printJob.partId,
            status: orderPartStatus,
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

      // Trigger notification — wrapped in try/catch so a failure never causes a 500
      try {
        await createNotification({
          tenantId: session.user.tenantId,
          type: 'JOB_FAILED',
          message: `Print job for part "${printJob.part.name}" failed${failureReason ? `: ${failureReason}` : ''}.`,
          dedupeKey: params.id,
          metadata: {
            jobName: printJob.part.name,
            printerName: printJob.printer?.name ?? 'Unknown printer',
            failureReason: failureReason ?? 'No reason provided',
          },
        })
      } catch (notifError) {
        console.error('Failed to create JOB_FAILED notification:', notifError)
      }

      return apiSuccess({ success: true })
    }

    // Should be unreachable — Zod discriminatedUnion already validated status above
    return apiError('BAD_REQUEST', 'Invalid status update', 400)
  } catch (error) {
    console.error('Error updating print job:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
