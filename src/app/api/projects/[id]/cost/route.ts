export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateProjectLandedCostById } from '@/lib/production-utils'
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

    const cost = await calculateProjectLandedCostById(
      params.id,
      session.user.tenantId
    )

    if (!cost) {
      return apiError('NOT_FOUND', 'Project not found or settings not configured', 404)
    }

    return apiSuccess(cost)
  } catch (error) {
    console.error('Error calculating project cost:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
