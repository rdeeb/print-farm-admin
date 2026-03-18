export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
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

    const token = await prisma.connectorToken.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        connectorAgentId: true,
        name: true,
        prefix: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdByUserId: true,
        createdAt: true,
        // tokenHash is intentionally excluded
      },
    })

    if (!token) {
      return apiError('NOT_FOUND', 'Connector token not found', 404)
    }

    return apiSuccess(token)
  } catch (error) {
    console.error('Error fetching connector token:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const existing = await prisma.connectorToken.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Connector token not found', 404)
    }

    const token = await prisma.connectorToken.update({
      where: { id: params.id },
      data: {
        revokedAt: new Date(),
      },
      select: {
        id: true,
        tenantId: true,
        connectorAgentId: true,
        name: true,
        prefix: true,
        scopes: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdByUserId: true,
        createdAt: true,
        // tokenHash is intentionally excluded
      },
    })

    return apiSuccess(token)
  } catch (error) {
    console.error('Error revoking connector token:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
