export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { ConnectorRuntime } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

const RegisterAgentSchema = z.object({
  runtime: z.nativeEnum(ConnectorRuntime),
  name: z.string().min(1, 'name is required'),
  fingerprint: z.string().min(1, 'fingerprint is required'),
  version: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const includeRevoked = searchParams.get('includeRevoked') === 'true'

    const agents = await prisma.connectorAgent.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(includeRevoked ? {} : { isRevoked: false }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(agents)
  } catch (error) {
    console.error('Error fetching connector agents:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    if (session.user.role !== 'ADMIN') {
      return apiError('FORBIDDEN', 'Forbidden', 403)
    }

    const body = await request.json()
    const parsed = RegisterAgentSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ')
      return apiError('VALIDATION_ERROR', message, 400)
    }

    const { runtime, name, fingerprint, version } = parsed.data

    const agent = await prisma.connectorAgent.create({
      data: {
        tenantId: session.user.tenantId,
        runtime,
        name,
        fingerprint,
        version: version ?? null,
      },
    })

    return apiSuccess(agent, 201)
  } catch (error) {
    if (
      typeof error === 'object' && error !== null &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return apiError(
        'CONFLICT',
        'An agent with this fingerprint already exists for this tenant',
        409
      )
    }
    console.error('Error registering connector agent:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
