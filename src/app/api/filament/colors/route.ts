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
    const typeId = searchParams.get('typeId')
    const technology = searchParams.get('technology')

    const where = {
      ...(typeId ? { typeId } : {}),
      ...(technology
        ? {
            type: {
              technology: technology as 'FDM' | 'SLA' | 'SLS',
            },
          }
        : {}),
    }

    const colors = await prisma.filamentColor.findMany({
      where,
      include: {
        type: true,
      },
      orderBy: { name: 'asc' },
    })

    return apiSuccess(colors)
  } catch (error) {
    console.error('Get filament colors error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}