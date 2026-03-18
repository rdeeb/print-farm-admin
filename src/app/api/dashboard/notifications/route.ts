export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const tenantId = session.user.tenantId

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null }, // System-wide notifications
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return apiSuccess(notifications)
  } catch (error) {
    console.error('Notifications error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { id } = await request.json()

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}