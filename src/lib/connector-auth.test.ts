/** @jest-environment node */
// Mocks MUST be declared before imports
const mockGetToken = jest.fn()

jest.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}))

const mockConnectorTokenFindUnique = jest.fn()
const mockConnectorTokenUpdate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    connectorToken: {
      findUnique: (...args: unknown[]) => mockConnectorTokenFindUnique(...args),
      update: (...args: unknown[]) => mockConnectorTokenUpdate(...args),
    },
  },
}))

import type { IncomingMessage } from 'http'
import { authenticateConnector, ConnectorAuthError } from './connector-auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(headers: Record<string, string> = {}): IncomingMessage {
  return { headers, method: 'GET', url: '/' } as unknown as IncomingMessage
}

function makeTokenRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'token-1',
    tenantId: 'tenant-1',
    scopes: ['connectors:ingest'],
    revokedAt: null,
    expiresAt: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authenticateConnector', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // By default, update is a fire-and-forget no-op
    mockConnectorTokenUpdate.mockResolvedValue({})
  })

  // =========================================================================
  // SESSION AUTH
  // =========================================================================

  describe('session auth (NextAuth JWT cookie)', () => {
    it('returns AuthenticatedConnector with SESSION authType when JWT has tenantId', async () => {
      mockGetToken.mockResolvedValue({ sub: 'user-1', tenantId: 'tenant-1' })
      const req = makeReq({}) // no Authorization header

      const result = await authenticateConnector(req)

      expect(result).toEqual({
        tenantId: 'tenant-1',
        userId: 'user-1',
        authType: 'SESSION',
      })
    })

    it('throws ConnectorAuthError with code UNAUTHENTICATED when JWT token is missing', async () => {
      mockGetToken.mockResolvedValue(null)
      const req = makeReq({})

      const err = await authenticateConnector(req).catch((e) => e)
      expect(err).toBeInstanceOf(ConnectorAuthError)
      expect(err.code).toBe('UNAUTHENTICATED')
    })

    it('throws ConnectorAuthError with code NO_TENANT when JWT has no tenantId', async () => {
      mockGetToken.mockResolvedValue({ sub: 'user-1' }) // tenantId absent
      const req = makeReq({})

      const err = await authenticateConnector(req).catch((e) => e)
      expect(err).toBeInstanceOf(ConnectorAuthError)
      expect(err.code).toBe('NO_TENANT')
    })
  })

  // =========================================================================
  // API TOKEN AUTH
  // =========================================================================

  describe('API token auth (Bearer token)', () => {
    const rawToken = 'validtoken123'

    it('returns AuthenticatedConnector with API_TOKEN authType for a valid token', async () => {
      mockConnectorTokenFindUnique.mockResolvedValueOnce(makeTokenRecord())
      const req = makeReq({ authorization: `Bearer ${rawToken}` })

      const result = await authenticateConnector(req)

      expect(result).toEqual({
        tenantId: 'tenant-1',
        connectorTokenId: 'token-1',
        authType: 'API_TOKEN',
      })
      // getToken should never have been called
      expect(mockGetToken).not.toHaveBeenCalled()
    })

    it('resolves successfully even when lastUsedAt update fails', async () => {
      mockConnectorTokenFindUnique.mockResolvedValueOnce(makeTokenRecord())
      mockConnectorTokenUpdate.mockRejectedValueOnce(new Error('DB connection lost'))
      await expect(authenticateConnector(makeReq({ authorization: `Bearer ${rawToken}` }))).resolves.toMatchObject({
        authType: 'API_TOKEN',
        tenantId: 'tenant-1',
      })
    })

    it('throws ConnectorAuthError with code INVALID_TOKEN when token not found in DB', async () => {
      mockConnectorTokenFindUnique.mockResolvedValue(null)
      const req = makeReq({ authorization: 'Bearer unknowntoken' })

      const err = await authenticateConnector(req).catch((e) => e)
      expect(err).toBeInstanceOf(ConnectorAuthError)
      expect(err.code).toBe('INVALID_TOKEN')
    })

    it('throws ConnectorAuthError with code TOKEN_REVOKED when token is revoked', async () => {
      mockConnectorTokenFindUnique.mockResolvedValueOnce(makeTokenRecord({ revokedAt: new Date() }))
      const req = makeReq({ authorization: 'Bearer revokedtoken' })

      const err = await authenticateConnector(req).catch((e) => e)
      expect(err).toBeInstanceOf(ConnectorAuthError)
      expect(err.code).toBe('TOKEN_REVOKED')
    })

    it('throws ConnectorAuthError with code INSUFFICIENT_SCOPE when token lacks connectors:ingest', async () => {
      mockConnectorTokenFindUnique.mockResolvedValue(
        makeTokenRecord({ scopes: ['printers:read-assigned'] })
      )
      const req = makeReq({ authorization: 'Bearer scopelesstoken' })

      const err = await authenticateConnector(req).catch((e) => e)
      expect(err).toBeInstanceOf(ConnectorAuthError)
      expect(err.code).toBe('INSUFFICIENT_SCOPE')
    })

    it('calls lastUsedAt update as fire-and-forget after successful auth', async () => {
      mockConnectorTokenFindUnique.mockResolvedValueOnce(makeTokenRecord())
      mockConnectorTokenUpdate.mockResolvedValue({})
      const req = makeReq({ authorization: 'Bearer validtoken123' })

      await authenticateConnector(req)

      // Give the fire-and-forget microtask a chance to run
      await Promise.resolve()

      expect(mockConnectorTokenUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'token-1' },
          data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
        })
      )
    })
  })

  // =========================================================================
  // NO AUTH
  // =========================================================================

  describe('no auth credentials', () => {
    it('throws ConnectorAuthError with code UNAUTHENTICATED when no Authorization header and no session cookie', async () => {
      mockGetToken.mockResolvedValue(null)
      const req = makeReq({}) // no Authorization header

      const err = await authenticateConnector(req).catch((e) => e)
      expect(err).toBeInstanceOf(ConnectorAuthError)
      expect(err.code).toBe('UNAUTHENTICATED')
    })

    it('throws UNAUTHENTICATED for "Bearer " with only whitespace after', async () => {
      await expect(authenticateConnector(makeReq({ authorization: 'Bearer   ' }))).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      })
    })
  })
})
