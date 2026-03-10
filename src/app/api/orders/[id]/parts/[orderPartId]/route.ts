import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; orderPartId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role === 'VIEWER') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const body = await request.json()
    const { status, filamentId, printerId, quantity } = body

    const orderPart = await prisma.orderPart.findFirst({
      where: {
        id: params.orderPartId,
        orderId: params.id,
        order: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        order: true,
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
    })

    if (!orderPart) {
      return apiError('NOT_FOUND', 'Order part not found', 404)
    }

    if (quantity !== undefined) {
      const nextQuantity = Number(quantity)
      if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
        return apiError('BAD_REQUEST', 'Quantity must be a whole number greater than 0', 400)
      }

      if (orderPart.status !== 'WAITING') {
        return apiError('BAD_REQUEST', 'Quantity can only be updated while the part is waiting', 400)
      }

      const updatedOrderPart = await prisma.orderPart.update({
        where: { id: orderPart.id },
        data: { quantity: nextQuantity },
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
      })

      return apiSuccess(updatedOrderPart)
    }

    // Handle QUEUED status - queue a part for printing when printer is busy
    if (status === 'QUEUED') {
      if (orderPart.status !== 'WAITING') {
        return apiError('BAD_REQUEST', 'Part is already in progress or queued', 400)
      }

      if (!printerId) {
        return apiError('BAD_REQUEST', 'Printer selection is required', 400)
      }

      if (!filamentId) {
        return apiError('BAD_REQUEST', 'Material selection is required', 400)
      }

      if (!orderPart.part.filamentColor) {
        return apiError('BAD_REQUEST', 'Part has no filament requirement', 400)
      }

      // Verify printer exists and is active (doesn't need to be IDLE for queueing)
      const printer = await prisma.printer.findFirst({
        where: {
          id: printerId,
          tenantId: session.user.tenantId,
          isActive: true,
        },
      })

      if (!printer) {
        return apiError('BAD_REQUEST', 'Printer not found or not active', 400)
      }

      const filament = await prisma.filament.findFirst({
        where: {
          id: filamentId,
          tenantId: session.user.tenantId,
          typeId: orderPart.part.filamentColor.type.id,
          colorId: orderPart.part.filamentColor.id,
        },
        include: {
          spools: {
            orderBy: { remainingWeight: 'desc' },
          },
        },
      })

      if (!filament) {
        return apiError('BAD_REQUEST', 'Filament not available for this part', 400)
      }

      const requiredWeight =
        (orderPart.part.materialUsagePerUnit ?? orderPart.part.filamentWeight) * orderPart.quantity
      const totalRemainingWeight = filament.spools.reduce(
        (sum, spool) => sum + (spool.remainingQuantity ?? spool.remainingWeight),
        0
      )

      if (totalRemainingWeight < requiredWeight) {
        return apiError('BAD_REQUEST', 'Not enough filament remaining for this part', 400)
      }

      const spoolToUse =
        filament.spools.find(
          (s) => (s.remainingQuantity ?? s.remainingWeight) >= requiredWeight
        ) || filament.spools[0]

      const updated = await prisma.$transaction(async tx => {
        // Update order part status to QUEUED
        const updatedOrderPart = await tx.orderPart.update({
          where: { id: orderPart.id },
          data: {
            status: 'QUEUED',
            filamentId,
          },
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
        })

        // Create a QUEUED print job
        await tx.printJob.create({
          data: {
            status: 'QUEUED',
            priority: orderPart.order.priority === 'URGENT' ? 'URGENT' :
              orderPart.order.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
            estimatedTime: orderPart.part.printTime ? orderPart.part.printTime * orderPart.quantity : null,
            tenantId: session.user.tenantId,
            orderId: orderPart.orderId,
            partId: orderPart.partId,
            printerId: printerId,
            spoolId: spoolToUse?.id || null,
            createdById: session.user.id,
          },
        })

        // Update order status to IN_PROGRESS
        await tx.order.updateMany({
          where: {
            id: orderPart.orderId,
            status: { notIn: ['IN_PROGRESS', 'DELIVERED', 'CANCELLED'] },
          },
          data: { status: 'IN_PROGRESS' },
        })

        return updatedOrderPart
      })

      return apiSuccess(updated)
    }

    // Handle PRINTING status - start printing immediately (printer must be IDLE)
    if (status === 'PRINTING') {
      if (orderPart.status !== 'WAITING' && orderPart.status !== 'QUEUED') {
        return apiError('BAD_REQUEST', 'Part is already printing or printed', 400)
      }

      if (!printerId) {
        return apiError('BAD_REQUEST', 'Printer selection is required to start printing', 400)
      }

      if (!filamentId) {
        return apiError('BAD_REQUEST', 'Material selection is required', 400)
      }

      if (!orderPart.part.filamentColor) {
        return apiError('BAD_REQUEST', 'Part has no filament requirement', 400)
      }

      // Verify printer exists and is available
      const printer = await prisma.printer.findFirst({
        where: {
          id: printerId,
          tenantId: session.user.tenantId,
          isActive: true,
        },
      })

      if (!printer) {
        return apiError('BAD_REQUEST', 'Printer not found or not available', 400)
      }

      if (printer.status !== 'IDLE') {
        return apiError('BAD_REQUEST', 'Printer is not available (must be IDLE)', 400)
      }

      const filament = await prisma.filament.findFirst({
        where: {
          id: filamentId,
          tenantId: session.user.tenantId,
          typeId: orderPart.part.filamentColor.type.id,
          colorId: orderPart.part.filamentColor.id,
        },
        include: {
          spools: {
            orderBy: { remainingWeight: 'desc' },
          },
        },
      })

      if (!filament) {
        return apiError('BAD_REQUEST', 'Filament not available for this part', 400)
      }

      const requiredWeight =
        (orderPart.part.materialUsagePerUnit ?? orderPart.part.filamentWeight) * orderPart.quantity
      const totalRemainingWeight = filament.spools.reduce(
        (sum, spool) => sum + (spool.remainingQuantity ?? spool.remainingWeight),
        0
      )

      if (totalRemainingWeight < requiredWeight) {
        return apiError('BAD_REQUEST', 'Not enough filament remaining for this part', 400)
      }

      // Find the best spool to use (one with most remaining that can cover the job)
      const spoolToUse =
        filament.spools.find(
          (s) => (s.remainingQuantity ?? s.remainingWeight) >= requiredWeight
        ) || filament.spools[0]

      const updated = await prisma.$transaction(async tx => {
        // Check if there's an existing QUEUED print job for this part
        const existingJob = await tx.printJob.findFirst({
          where: {
            orderId: orderPart.orderId,
            partId: orderPart.partId,
            status: 'QUEUED',
            tenantId: session.user.tenantId,
          },
        })

        // Update order part status
        const updatedOrderPart = await tx.orderPart.update({
          where: { id: orderPart.id },
          data: {
            status: 'PRINTING',
            filamentId,
          },
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
        })

        if (existingJob) {
          // Update existing queued job to PRINTING
          await tx.printJob.update({
            where: { id: existingJob.id },
            data: {
              status: 'PRINTING',
              startTime: new Date(),
              printerId: printerId,
              spoolId: spoolToUse?.id || null,
            },
          })
        } else {
          // Create a new print job
          await tx.printJob.create({
            data: {
              status: 'PRINTING',
              priority: orderPart.order.priority === 'URGENT' ? 'URGENT' :
                orderPart.order.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
              startTime: new Date(),
              estimatedTime: orderPart.part.printTime ? orderPart.part.printTime * orderPart.quantity : null,
              tenantId: session.user.tenantId,
              orderId: orderPart.orderId,
              partId: orderPart.partId,
              printerId: printerId,
              spoolId: spoolToUse?.id || null,
              createdById: session.user.id,
            },
          })
        }

        // Update printer status to PRINTING
        await tx.printer.update({
          where: { id: printerId },
          data: { status: 'PRINTING' },
        })

        // Update order status to IN_PROGRESS
        await tx.order.updateMany({
          where: {
            id: orderPart.orderId,
            status: { notIn: ['DELIVERED', 'CANCELLED'] },
          },
          data: { status: 'IN_PROGRESS' },
        })

        return updatedOrderPart
      })

      return apiSuccess(updated)
    }

    if (status === 'PRINTED') {
      if (orderPart.status !== 'PRINTING') {
        return apiError('BAD_REQUEST', 'Part must be printing first', 400)
      }

      if (!orderPart.filamentId) {
        return apiError('BAD_REQUEST', 'No material selected for this part', 400)
      }

      const result = await prisma.$transaction(async tx => {
        const filament = await tx.filament.findFirst({
          where: {
            id: orderPart.filamentId!,
            tenantId: session.user.tenantId,
          },
          include: {
            spools: {
              orderBy: {
                remainingWeight: 'asc',
              },
            },
          },
        })

        if (!filament) {
          throw new Error('Selected filament not found')
        }

        const requiredWeight =
          (orderPart.part.materialUsagePerUnit ?? orderPart.part.filamentWeight) *
          orderPart.quantity
        const totalRemainingWeight = filament.spools.reduce(
          (sum, spool) => sum + (spool.remainingQuantity ?? spool.remainingWeight),
          0
        )

        if (totalRemainingWeight < requiredWeight) {
          throw new Error('Not enough filament remaining for this part')
        }

        let remainingToUse = requiredWeight
        const updates = []

        for (const spool of filament.spools) {
          if (remainingToUse <= 0) break
          const currentRemaining = spool.remainingQuantity ?? spool.remainingWeight
          const currentCapacity = spool.capacity ?? spool.weight
          const newRemaining = Math.max(0, currentRemaining - remainingToUse)
          const used = currentRemaining - newRemaining
          remainingToUse -= used

          const newPercent = Math.max(0, Math.round((newRemaining / currentCapacity) * 100))
          updates.push(
            tx.filamentSpool.update({
              where: { id: spool.id },
              data: {
                remainingWeight: newRemaining,
                remainingQuantity: newRemaining,
                remainingPercent: newPercent,
              },
            })
          )
        }

        if (remainingToUse > 0) {
          throw new Error('Not enough filament remaining for this part')
        }

        await Promise.all(updates)

        // Find and complete the active print job for this order part
        const activePrintJob = await tx.printJob.findFirst({
          where: {
            orderId: orderPart.orderId,
            partId: orderPart.partId,
            status: 'PRINTING',
            tenantId: session.user.tenantId,
          },
          include: {
            printer: true,
          },
        })

        if (activePrintJob) {
          const endTime = new Date()
          const actualTime = activePrintJob.startTime
            ? Math.round((endTime.getTime() - activePrintJob.startTime.getTime()) / 60000)
            : null

          // Complete the print job
          await tx.printJob.update({
            where: { id: activePrintJob.id },
            data: {
              status: 'COMPLETED',
              endTime,
              actualTime,
            },
          })

          // Reset printer status to IDLE
          if (activePrintJob.printerId) {
            await tx.printer.update({
              where: { id: activePrintJob.printerId },
              data: { status: 'IDLE' },
            })
          }
        }

        const updatedOrderPart = await tx.orderPart.update({
          where: { id: orderPart.id },
          data: { status: 'PRINTED' },
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
        })

        const remainingParts = await tx.orderPart.count({
          where: {
            orderId: orderPart.orderId,
            status: { not: 'PRINTED' },
          },
        })

        if (remainingParts === 0) {
          await tx.order.update({
            where: { id: orderPart.orderId },
            data: { status: 'WAITING' },
          })
        }

        return updatedOrderPart
      })

      return apiSuccess(result)
    }

    return apiError('BAD_REQUEST', 'Invalid status update', 400)
  } catch (error) {
    console.error('Error updating order part:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
