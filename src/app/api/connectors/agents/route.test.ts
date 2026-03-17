// Mocks MUST be declared before imports
const mockGetServerSession = jest.fn()
const mockAgentFindMany = jest.fn()
const mockAgentCreate = jest.fn()

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
    connectorAgent: {
      findMany: (...args: unknown[]) => mockAgentFindMany(...args),
      create: (...args: unknown[]) => mockAgentCreate(...args),
    },
  },
}))

import { GET, POST } from './route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function makeRequest(body?: Record<string, unknown>, url = 'http://localhost/api/connectors/agents') {
  return {
    url,
    json: () => Promise.resolve(body ?? {}),
  } as unknown as import('next/server').NextRequest
}

function makeAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'agent-1',
    tenantId: 'tenant-1',
    runtime: 'WEB_APP',
    name: 'My Agent',
    fingerprint: 'fp-abc123',
    version: '1.0.0',
    lastSeenAt: null,
    isRevoked: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('GET /api/connectors/agents', () => {
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

  it('returns list of non-revoked agents for the tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const agents = [makeAgent(), makeAgent({ id: 'agent-2', fingerprint: 'fp-xyz' })]
    mockAgentFindMany.mockResolvedValue(agents)

    const res = await GET(makeRequest())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('filters by tenantId from session (tenant isolation)', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockAgentFindMany.mockResolvedValue([])

    await GET(makeRequest())

    expect(mockAgentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('excludes revoked agents by default', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindMany.mockResolvedValue([])

    await GET(makeRequest())

    expect(mockAgentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isRevoked: false }),
      })
    )
  })

  it('includes revoked agents when ?includeRevoked=true', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindMany.mockResolvedValue([makeAgent({ isRevoked: true })])

    const res = await GET(
      makeRequest(undefined, 'http://localhost/api/connectors/agents?includeRevoked=true')
    )

    expect(res.status).toBe(200)
    const call = mockAgentFindMany.mock.calls[0][0]
    // When includeRevoked=true, isRevoked filter should NOT be present
    expect(call.where).not.toHaveProperty('isRevoked')
  })
})

describe('POST /api/connectors/agents', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ runtime: 'WEB_APP', name: 'Agent', fingerprint: 'fp-1' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
    const res = await POST(makeRequest({ runtime: 'WEB_APP', name: 'Agent', fingerprint: 'fp-1' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 when role is OPERATOR', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    const res = await POST(makeRequest({ runtime: 'WEB_APP', name: 'Agent', fingerprint: 'fp-1' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when runtime is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ name: 'Agent', fingerprint: 'fp-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ runtime: 'WEB_APP', fingerprint: 'fp-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when fingerprint is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const res = await POST(makeRequest({ runtime: 'WEB_APP', name: 'Agent' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 when fingerprint already exists for tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())

    const p2002Error = Object.assign(new Error('Unique constraint failed'), {
      code: 'P2002',
      clientVersion: '5.0.0',
    })
    mockAgentCreate.mockRejectedValue(p2002Error)

    const res = await POST(
      makeRequest({ runtime: 'WEB_APP', name: 'Agent', fingerprint: 'fp-dupe' })
    )
    expect(res.status).toBe(409)
  })

  it('creates agent and returns 201', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const created = makeAgent({ runtime: 'CHROME_EXTENSION', name: 'New Agent', fingerprint: 'fp-new', version: '2.0.0' })
    mockAgentCreate.mockResolvedValue(created)

    const res = await POST(
      makeRequest({ runtime: 'CHROME_EXTENSION', name: 'New Agent', fingerprint: 'fp-new', version: '2.0.0' })
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data).toHaveProperty('id', 'agent-1')
    expect(data).toHaveProperty('name', 'New Agent')
  })

  it('uses tenantId from session, not from request body', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-safe' }))
    const created = makeAgent({ tenantId: 'tenant-safe' })
    mockAgentCreate.mockResolvedValue(created)

    await POST(
      makeRequest({ runtime: 'WEB_APP', name: 'Agent', fingerprint: 'fp-1', tenantId: 'tenant-evil' })
    )

    expect(mockAgentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 'tenant-safe' }),
      })
    )
  })
})
