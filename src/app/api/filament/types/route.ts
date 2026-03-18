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

    const { searchParams } = new URL(request.url)
    const technology = searchParams.get('technology')

    const types = await prisma.filamentType.findMany({
      where: {
        ...(technology ? { technology: technology as 'FDM' | 'SLA' | 'SLS' } : {}),
      },
      include: {
        _count: {
          select: { filaments: true }
        }
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(types)
  } catch (error) {
    console.error('Get filament types error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}