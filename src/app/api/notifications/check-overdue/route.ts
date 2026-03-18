export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const tenantId = session.user.tenantId
    const now = new Date()

    const overdueOrders = await prisma.order.findMany({
      where: {
        tenantId,
        dueDate: { lt: now },
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        client: {
          select: { name: true },
        },
      },
    })

    const results = await Promise.allSettled(
      overdueOrders.map((order) =>
        createNotification({
          tenantId,
          type: 'ORDER_OVERDUE',
          title: 'Order overdue',
          message: `Order ${order.orderNumber} for ${order.client.name} is past its due date.`,
          metadata: {
            orderName: order.orderNumber,
            clientName: order.client.name,
            dueDate: order.dueDate ? order.dueDate.toISOString().split('T')[0] : '',
            orderId: order.id,
          },
          dedupeKey: order.id,
        })
      )
    )

    const processed = results.length
    const failed = results.filter((r) => r.status === 'rejected').length

    return apiSuccess({ processed, failed })
  } catch (error) {
    console.error('Error checking overdue orders:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
