import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/api-response'

const VALID_SCOPES = [
  'connectors:ingest',
  'printers:read-assigned',
  'printers:telemetry:write',
] as const

const GenerateTokenSchema = z.object({
  name: z.string().min(1, 'name is required'),
  scopes: z
    .array(z.string())
    .min(1, 'scopes must be a non-empty array')
    .refine(
      (scopes) => scopes.every((s) => (VALID_SCOPES as readonly string[]).includes(s)),
      {
        message: `scopes must only contain valid values: ${VALID_SCOPES.join(', ')}`,
      }
    ),
  connectorAgentId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

const TOKEN_SELECT = {
  id: true,
  tenantId: true,
  connectorAgentId: true,
  name: true,
  prefix: true,
  scopes: true,
  expiresAt: true,
  lastUsedAt: true,
  createdByUserId: true,
  createdAt: true,
  // tokenHash is intentionally excluded
} as const

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Unauthorized', 401)
    }

    const now = new Date()

    const tokens = await prisma.connectorToken.findMany({
      where: {
        tenantId: session.user.tenantId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: TOKEN_SELECT,
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(tokens)
  } catch (error) {
    console.error('Error fetching connector tokens:', error)
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
    const parsed = GenerateTokenSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ')
      return apiError('VALIDATION_ERROR', message, 400)
    }

    const { name, scopes, connectorAgentId, expiresAt } = parsed.data

    // Validate connectorAgentId belongs to tenant if provided
    if (connectorAgentId) {
      const agent = await prisma.connectorAgent.findFirst({
        where: { id: connectorAgentId, tenantId: session.user.tenantId },
      })
      if (!agent) {
        return apiError('NOT_FOUND', 'Connector agent not found', 404)
      }
    }

    // Generate a cryptographically random 32-byte (64-char hex) token
    const rawToken = randomBytes(32).toString('hex')
    const prefix = rawToken.slice(0, 8)
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const created = await prisma.connectorToken.create({
      data: {
        tenantId: session.user.tenantId,
        connectorAgentId: connectorAgentId ?? null,
        name,
        tokenHash,
        prefix,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdByUserId: session.user.id,
      },
      select: TOKEN_SELECT,
    })

    // Explicitly omit tokenHash from record (select excludes it in production;
    // this destructure guards against leaky mocks in tests)
    const { tokenHash: _omitHash, ...record } = created as typeof created & { tokenHash?: string }

    // Return the raw token ONLY at creation time
    return apiSuccess({ token: rawToken, record }, 201)
  } catch (error) {
    console.error('Error generating connector token:', error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
