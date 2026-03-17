// Mocks MUST be declared before imports
const mockGetServerSession = jest.fn()
const mockTokenFindFirst = jest.fn()
const mockTokenUpdate = jest.fn()

jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

jest.mock('@/lib/auth', () => ({ authOptions: {} }))

jest.mock('@/lib/api-response', () => ({
  apiError: (code: string, message: string, status: number) =>
    ({ status, json: () => Promise.resolve({ error: message, code }) }) as unknown as Response,
  apiSuccess: (data: unknown, status = 200) =>
    ({ status, json: () => Promise.resolve(data) }) as unknown as Response,
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    connectorToken: {
      findFirst: (...args: unknown[]) => mockTokenFindFirst(...args),
      update: (...args: unknown[]) => mockTokenUpdate(...args),
    },
  },
}))

import { GET, DELETE } from './route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function makeRequest() {
  return {} as unknown as import('next/server').NextRequest
}

function makeParams(id = 'token-1') {
  return { params: { id } }
}

function makeTokenRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'token-1',
    tenantId: 'tenant-1',
    connectorAgentId: null,
    name: 'My Token',
    tokenHash: 'hash-should-never-be-returned',
    prefix: 'abcd1234',
    scopes: ['connectors:ingest'],
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    createdByUserId: 'user-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

function makeTokenRecordNoHash(overrides: Record<string, unknown> = {}) {
  const { tokenHash: _omit, ...record } = makeTokenRecord(overrides)
  return record
}

describe('GET /api/connectors/tokens/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })
    const res = await GET(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 404 when token belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockTokenFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('token-other'))

    expect(res.status).toBe(404)
    expect(mockTokenFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('returns 404 when token does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with token data (no tokenHash)', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenFindFirst.mockResolvedValue(makeTokenRecordNoHash())

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('id', 'token-1')
    expect(data).toHaveProperty('prefix', 'abcd1234')
    expect(data).not.toHaveProperty('tokenHash')
  })

  it('uses select that excludes tokenHash', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenFindFirst.mockResolvedValue(makeTokenRecordNoHash())

    await GET(makeRequest(), makeParams())

    const call = mockTokenFindFirst.mock.calls[0][0]
    expect(call).toHaveProperty('select')
    expect(call.select).not.toHaveProperty('tokenHash')
  })
})

describe('DELETE /api/connectors/tokens/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 403 when role is OPERATOR', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 404 when token belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockTokenFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('token-other'))
    expect(res.status).toBe(404)
  })

  it('enforces tenant isolation: queries with tenantId from session on cross-tenant delete', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockTokenFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('token-belongs-to-tenant-B'))

    expect(res.status).toBe(404)
    expect(mockTokenFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('returns 404 when token does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('revokes token by setting revokedAt and returns 200', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenFindFirst.mockResolvedValue(makeTokenRecord())
    const revokedRecord = makeTokenRecordNoHash({ revokedAt: new Date('2024-06-01T00:00:00Z') })
    mockTokenUpdate.mockResolvedValue(revokedRecord)

    const res = await DELETE(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockTokenUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    )
    expect(data).toHaveProperty('revokedAt')
    expect(data).not.toHaveProperty('tokenHash')
  })
})
