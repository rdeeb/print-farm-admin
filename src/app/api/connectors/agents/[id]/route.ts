import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

const PatchAgentSchema = z.object({
  name: z.string().min(1).optional(),
  version: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const agent = await prisma.connectorAgent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!agent) {
      return apiError('NOT_FOUND', 'Connector agent not found', 404)
    }

    return apiSuccess(agent)
  } catch (error) {
    console.error('Error fetching connector agent:', error)
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

    const existing = await prisma.connectorAgent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Connector agent not found', 404)
    }

    const body = await request.json()
    const parsed = PatchAgentSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ')
      return apiError('VALIDATION_ERROR', message, 400)
    }

    const { name, version } = parsed.data

    const agent = await prisma.connectorAgent.update({
      where: { id: params.id, tenantId: session.user.tenantId },
      data: {
        ...(name !== undefined && { name }),
        ...(version !== undefined && { version }),
      },
    })

    return apiSuccess(agent)
  } catch (error) {
    console.error('Error updating connector agent:', error)
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

    const existing = await prisma.connectorAgent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existing) {
      return apiError('NOT_FOUND', 'Connector agent not found', 404)
    }

    const agent = await prisma.connectorAgent.update({
      where: { id: params.id },
      data: {
        isRevoked: true,
      },
    })

    return apiSuccess(agent)
  } catch (error) {
    console.error('Error revoking connector agent:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
