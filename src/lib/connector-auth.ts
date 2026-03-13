import { createHash } from 'crypto'
import type { IncomingMessage } from 'http'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export interface AuthenticatedConnector {
  tenantId: string
  userId?: string
  connectorTokenId?: string
  authType: 'SESSION' | 'API_TOKEN'
}

export class ConnectorAuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ConnectorAuthError'
  }
}

/**
 * Authenticates an incoming WebSocket/HTTP upgrade request.
 *
 * Two modes:
 * 1. SESSION – NextAuth JWT cookie (web app connector)
 * 2. API_TOKEN – Bearer token in Authorization header (extension / Go connector)
 *
 * Returns an AuthenticatedConnector on success, throws ConnectorAuthError on failure.
 */
export async function authenticateConnector(
  req: IncomingMessage
): Promise<AuthenticatedConnector> {
  const authHeader = (req.headers['authorization'] as string | undefined) ?? ''

  // ----- API Token auth -----
  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice('Bearer '.length).trim()

    if (!rawToken) {
      throw new ConnectorAuthError('UNAUTHENTICATED', 'Missing bearer token')
    }

    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const now = new Date()
    const record = await prisma.connectorToken.findUnique({
      where: { tokenHash },
    })

    if (!record) {
      throw new ConnectorAuthError('INVALID_TOKEN', 'Invalid connector token')
    }
    if (record.revokedAt !== null) {
      throw new ConnectorAuthError('TOKEN_REVOKED', 'Connector token has been revoked')
    }
    if (record.expiresAt !== null && record.expiresAt <= now) {
      throw new ConnectorAuthError('TOKEN_EXPIRED', 'Connector token has expired')
    }

    const scopes = Array.isArray(record.scopes)
      ? (record.scopes as unknown[]).filter((s): s is string => typeof s === 'string')
      : []
    if (!scopes.includes('connectors:ingest')) {
      throw new ConnectorAuthError('INSUFFICIENT_SCOPE', 'Token missing required scope: connectors:ingest')
    }

    // Fire-and-forget: update lastUsedAt
    prisma.connectorToken
      .update({ where: { id: record.id }, data: { lastUsedAt: now } })
      .catch(() => {
        // Intentionally swallowed — non-critical
      })

    return {
      tenantId: record.tenantId,
      connectorTokenId: record.id,
      authType: 'API_TOKEN',
    }
  }

  // ----- Session auth (NextAuth JWT cookie) -----
  if (!process.env.NEXTAUTH_SECRET) {
    throw new ConnectorAuthError('CONFIGURATION_ERROR', 'NEXTAUTH_SECRET is not set')
  }

  // Attach parsed cookies so next-auth/jwt can read them from IncomingMessage
  const rawCookie = (req.headers as Record<string, string | string[] | undefined>)['cookie']
  const cookieHeader = Array.isArray(rawCookie) ? rawCookie.join('; ') : (rawCookie ?? '')
  const cookies: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (key) cookies[key] = decodeURIComponent(val)
  }
  ;(req as IncomingMessage & { cookies?: Record<string, string> }).cookies = cookies

  const token = await getToken({
    req: req as Parameters<typeof getToken>[0]['req'],
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    throw new ConnectorAuthError('UNAUTHENTICATED', 'No valid session found')
  }

  const tenantId = token.tenantId as string | undefined
  if (!tenantId) {
    throw new ConnectorAuthError('NO_TENANT', 'Session token does not contain tenantId')
  }

  return {
    tenantId,
    userId: token.sub,
    authType: 'SESSION',
  }
}
