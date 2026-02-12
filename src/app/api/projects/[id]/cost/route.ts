import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateProjectLandedCostById } from '@/lib/production-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cost = await calculateProjectLandedCostById(
      params.id,
      session.user.tenantId
    )

    if (!cost) {
      return NextResponse.json({ error: 'Project not found or settings not configured' }, { status: 404 })
    }

    return NextResponse.json(cost)
  } catch (error) {
    console.error('Error calculating project cost:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
