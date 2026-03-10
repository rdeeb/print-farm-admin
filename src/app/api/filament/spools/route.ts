import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    // Get all spools for the tenant (exclude 0% from calculation/visualization)
    const spools = await prisma.filamentSpool.findMany({
      where: {
        filament: {
          tenantId: session.user.tenantId,
        },
        remainingPercent: { gt: 0 },
      },
      include: {
        filament: {
          include: {
            type: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to include type and color at top level for compatibility
    const transformedSpools = spools.map(spool => ({
      ...spool,
      brand: spool.filament.brand,
      type: spool.filament.type,
      color: spool.filament.color,
      costPerKg: spool.filament.costPerKg,
      supplier: spool.filament.supplier,
    }))

    return apiSuccess(transformedSpools)
  } catch (error) {
    console.error('Get spools error:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
