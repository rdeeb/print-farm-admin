export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { calculateProjectLandedCostById, getSoftExpenseAllocations } from '@/lib/production-utils'
import { createLedgerEntry, getTenantFinanceContext } from '@/lib/finance-ledger'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
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
      return apiError('NOT_FOUND', 'Order not found', 404)
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

      return apiSuccess(refreshed)
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

    return apiSuccess({
      ...order,
      project: {
        id: order.project.id,
        name: order.project.name,
      },
      orderParts: orderPartsWithPrinter,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

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

    const body = await request.json()
    const { status, dueDate, filamentHandling } = body
    const hasDueDate = Object.prototype.hasOwnProperty.call(body, 'dueDate')

    if (!status && !hasDueDate) {
      return apiError('BAD_REQUEST', 'Status or due date is required', 400)
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            salesPrice: true,
          },
        },
        orderParts: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!order) {
      return apiError('NOT_FOUND', 'Order not found', 404)
    }

    if (status) {
      if (status === 'CANCELLED' && ['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
        return apiError('BAD_REQUEST', 'Cannot cancel an order that is already delivered or cancelled', 400)
      }

      if (status === 'DELIVERED' && !['WAITING', 'ASSEMBLED'].includes(order.status)) {
        return apiError('BAD_REQUEST', 'Order must be waiting for assembly before delivery', 400)
      }

      if (status === 'WAITING' || status === 'ASSEMBLED') {
        const allPrinted = order.orderParts.every(part => part.status === 'PRINTED')
        if (!allPrinted) {
          return apiError('BAD_REQUEST', 'All parts must be printed before waiting for assembly', 400)
        }
      }
    }

    // Handle order cancellation cleanup
    if (status === 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        // Find all active print jobs for this order
        const printJobs = await tx.printJob.findMany({
          where: {
            orderId: params.id,
            status: { in: ['QUEUED', 'PRINTING'] },
          },
          include: {
            printer: true,
            spool: true,
            part: true,
          },
        })

        // Cancel all queued and printing jobs
        for (const job of printJobs) {
          // Cancel the print job
          await tx.printJob.update({
            where: { id: job.id },
            data: { status: 'CANCELLED' },
          })

          // If the job was printing, reset the printer to IDLE
          if (job.status === 'PRINTING' && job.printer) {
            await tx.printer.update({
              where: { id: job.printer.id },
              data: { status: 'IDLE' },
            })

            // Note: Filament is only deducted when marking as PRINTED, not when PRINTING starts
            // So for PRINTING jobs, no filament inventory adjustment is needed
            // However, we track the cancellation event for cost accounting

            if (job.spool && filamentHandling === 'MARK_AS_WASTE') {
              // Track the planned filament usage as waste/lost opportunity cost
              const filamentWeight = job.part.filamentWeight || 0
              const { currency } = await getTenantFinanceContext(session.user.tenantId)

              // Calculate cost per gram from landed cost total
              const costPerGram = job.spool.weight > 0
                ? (job.spool.landedCostTotal || 0) / job.spool.weight
                : 0
              const wasteCost = costPerGram * filamentWeight

              await createLedgerEntry({
                tenantId: session.user.tenantId,
                amount: wasteCost,
                type: 'SOFT_EXPENSE',
                source: 'MATERIAL_WASTE',
                currency,
                isNonCash: true,
                orderId: order.id,
                projectId: order.project.id,
                autoKey: `order-cancel-waste-${job.id}`,
                note: `Planned material usage from cancelled print job for order ${order.orderNumber}`,
                metadata: {
                  category: 'waste',
                  printJobId: job.id,
                  filamentWeight,
                  type: 'opportunity_cost',
                },
              })
            }
            // For RETURN_TO_INVENTORY: No action needed since filament was never deducted
          }
        }

        // Reset order parts to WAITING status (except for PRINTED parts)
        await tx.orderPart.updateMany({
          where: {
            orderId: params.id,
            status: { in: ['QUEUED', 'PRINTING'] },
          },
          data: {
            status: 'WAITING',
            filamentId: null,
          },
        })
      })
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

    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
      const { currency, softExpensePostingMode } = await getTenantFinanceContext(
        session.user.tenantId
      )
      const incomeAmount = order.quantity * (order.project.salesPrice || 0)

      await createLedgerEntry({
        tenantId: session.user.tenantId,
        amount: incomeAmount,
        type: 'INCOME',
        source: 'ORDER_DELIVERY',
        currency,
        orderId: order.id,
        projectId: order.project.id,
        autoKey: `order-delivery-income-${order.id}`,
        note: `Income from order ${order.orderNumber}`,
      })

      const costBreakdown = await calculateProjectLandedCostById(
        order.project.id,
        session.user.tenantId
      )

      if (costBreakdown) {
        const softAllocations = getSoftExpenseAllocations(costBreakdown)
        const type = softExpensePostingMode === 'POST_AS_EXPENSE' ? 'EXPENSE' : 'SOFT_EXPENSE'
        const isNonCash = softExpensePostingMode !== 'POST_AS_EXPENSE'

        await Promise.all([
          createLedgerEntry({
            tenantId: session.user.tenantId,
            amount: softAllocations.labor * order.quantity,
            type,
            source: 'SOFT_COST_ALLOCATION',
            currency,
            isNonCash,
            orderId: order.id,
            projectId: order.project.id,
            autoKey: `order-soft-labor-${order.id}`,
            note: `Labor allocation for order ${order.orderNumber}`,
            metadata: { category: 'labor' },
          }),
          createLedgerEntry({
            tenantId: session.user.tenantId,
            amount: softAllocations.energy * order.quantity,
            type,
            source: 'SOFT_COST_ALLOCATION',
            currency,
            isNonCash,
            orderId: order.id,
            projectId: order.project.id,
            autoKey: `order-soft-energy-${order.id}`,
            note: `Energy allocation for order ${order.orderNumber}`,
            metadata: { category: 'energy' },
          }),
          createLedgerEntry({
            tenantId: session.user.tenantId,
            amount: softAllocations.printer * order.quantity,
            type,
            source: 'SOFT_COST_ALLOCATION',
            currency,
            isNonCash,
            orderId: order.id,
            projectId: order.project.id,
            autoKey: `order-soft-printer-${order.id}`,
            note: `Printer allocation for order ${order.orderNumber}`,
            metadata: { category: 'printer' },
          }),
        ])
      }
    }

    return apiSuccess(updated)
  } catch (error) {
    console.error('Error updating order:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
