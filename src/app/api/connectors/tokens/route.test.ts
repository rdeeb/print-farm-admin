// Mocks MUST be declared before imports
const mockGetServerSession = jest.fn()
const mockTokenFindMany = jest.fn()
const mockTokenCreate = jest.fn()
const mockAgentFindFirst = jest.fn()

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
      findMany: (...args: unknown[]) => mockTokenFindMany(...args),
      create: (...args: unknown[]) => mockTokenCreate(...args),
    },
    connectorAgent: {
      findFirst: (...args: unknown[]) => mockAgentFindFirst(...args),
    },
  },
}))

import { GET, POST } from './route'

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

function makeRequest(body?: Record<string, unknown>, url = 'http://localhost/api/connectors/tokens') {
  return {
    url,
    json: () => Promise.resolve(body ?? {}),
  } as unknown as import('next/server').NextRequest
}

function makeTokenRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'token-1',
    tenantId: 'tenant-1',
    connectorAgentId: null,
    name: 'My Token',
    tokenHash: 'hash-value-should-never-be-returned',
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

describe('GET /api/connectors/tokens', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 when session has no tenantId', async () => {
    mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns list of tokens for the tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    // Simulate DB returning records without tokenHash (via select)
    const { tokenHash: _omit, ...recordWithoutHash } = makeTokenRecord()
    mockTokenFindMany.mockResolvedValue([recordWithoutHash])

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
  })

  it('filters by tenantId from session (tenant isolation)', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockTokenFindMany.mockResolvedValue([])

    await GET(makeRequest())

    expect(mockTokenFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('never includes tokenHash in the response', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const { tokenHash: _omit, ...recordWithoutHash } = makeTokenRecord()
    mockTokenFindMany.mockResolvedValue([recordWithoutHash])

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    // None of the returned records should have tokenHash
    for (const record of data) {
      expect(record).not.toHaveProperty('tokenHash')
    }
  })

  it('uses select that excludes tokenHash', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenFindMany.mockResolvedValue([])

    await GET(makeRequest())

    const call = mockTokenFindMany.mock.calls[0][0]
    expect(call).toHaveProperty('select')
    expect(call.select).not.toHaveProperty('tokenHash')
  })
})

describe('POST /api/connectors/tokens', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ name: 'Token', scopes: ['connectors:ingest'] }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
    const res = await POST(makeRequest({ name: 'Token', scopes: ['connectors:ingest'] }))
    expect(res.status).toBe(403)
  })

  it('returns 403 when role is OPERATOR', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    const res = await POST(makeRequest({ name: 'Token', scopes: ['connectors:ingest'] }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when name is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ scopes: ['connectors:ingest'] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when scopes is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ name: 'Token' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when scopes is empty array', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ name: 'Token', scopes: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when scopes contains invalid value', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ name: 'Token', scopes: ['invalid:scope'] }))
    expect(res.status).toBe(400)
  })

  it('creates token and returns 201 with raw token (only time)', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const dbRecord = makeTokenRecord()
    mockTokenCreate.mockResolvedValue(dbRecord)

    const res = await POST(
      makeRequest({ name: 'My Token', scopes: ['connectors:ingest'] })
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    // Response must include raw token string
    expect(data).toHaveProperty('token')
    expect(typeof data.token).toBe('string')
    expect(data.token).toHaveLength(64) // 32 bytes = 64 hex chars
    // Response must include record
    expect(data).toHaveProperty('record')
    // record must NOT include tokenHash
    expect(data.record).not.toHaveProperty('tokenHash')
  })

  it('stores SHA-256 hash of the raw token', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenCreate.mockImplementation(async (args: any) => ({
      ...makeTokenRecord(),
      tokenHash: args.data.tokenHash,
    }))

    const res = await POST(
      makeRequest({ name: 'My Token', scopes: ['connectors:ingest'] })
    )
    const data = await res.json()

    // Verify the stored hash corresponds to the returned raw token
    const { createHash } = await import('crypto')
    const expectedHash = createHash('sha256').update(data.token).digest('hex')

    const createCall = mockTokenCreate.mock.calls[0][0]
    expect(createCall.data.tokenHash).toBe(expectedHash)
  })

  it('stores the first 8 chars as prefix', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenCreate.mockImplementation(async (args: any) => ({
      ...makeTokenRecord(),
      prefix: args.data.prefix,
    }))

    await POST(makeRequest({ name: 'My Token', scopes: ['connectors:ingest'] }))

    const createCall = mockTokenCreate.mock.calls[0][0]
    // prefix should be exactly 8 chars
    expect(createCall.data.prefix).toHaveLength(8)
  })

  it('accepts all valid scopes', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockTokenCreate.mockResolvedValue(makeTokenRecord())

    const res = await POST(
      makeRequest({
        name: 'Full Token',
        scopes: ['connectors:ingest', 'printers:read-assigned', 'printers:telemetry:write'],
      })
    )
    expect(res.status).toBe(201)
  })

  it('never returns tokenHash even when present in DB response', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    // Mock create to return a record WITH tokenHash explicitly set (simulating a leaky DB mock)
    mockTokenCreate.mockResolvedValue({ ...makeTokenRecord(), tokenHash: 'supersecret-hash' })

    const res = await POST(
      makeRequest({ name: 'My Token', scopes: ['connectors:ingest'] })
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.record).not.toHaveProperty('tokenHash')
  })
})
