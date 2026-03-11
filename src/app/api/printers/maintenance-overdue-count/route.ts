import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const count = await prisma.printer.count({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        nextMaintenanceDue: {
          lte: new Date(),
        },
      },
    })

    return apiSuccess({ count })
  } catch (error) {
    console.error('Error fetching overdue maintenance count:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
