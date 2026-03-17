// Mocks MUST be declared before imports
const mockGetServerSession = jest.fn()
const mockAgentFindFirst = jest.fn()
const mockAgentUpdate = jest.fn()

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
      findFirst: (...args: unknown[]) => mockAgentFindFirst(...args),
      update: (...args: unknown[]) => mockAgentUpdate(...args),
    },
  },
}))

import { GET, PATCH, DELETE } from './route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function makeRequest(body?: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body ?? {}),
  } as unknown as import('next/server').NextRequest
}

function makeParams(id = 'agent-1') {
  return { params: { id } }
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

describe('GET /api/connectors/agents/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 404 when agent belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockAgentFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('agent-other'))

    expect(res.status).toBe(404)
    expect(mockAgentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('returns 404 when agent does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with agent data', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const agent = makeAgent()
    mockAgentFindFirst.mockResolvedValue(agent)

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('id', 'agent-1')
    expect(data).toHaveProperty('fingerprint', 'fp-abc123')
  })
})

describe('PATCH /api/connectors/agents/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ name: 'New Name' }), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
    const res = await PATCH(makeRequest({ name: 'New Name' }), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 404 when agent belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockAgentFindFirst.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ name: 'New Name' }), makeParams('agent-other'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when agent does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindFirst.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ name: 'New Name' }), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 200 and updates name', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindFirst.mockResolvedValue(makeAgent())
    const updated = makeAgent({ name: 'Updated Name' })
    mockAgentUpdate.mockResolvedValue(updated)

    const res = await PATCH(makeRequest({ name: 'Updated Name' }), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('name', 'Updated Name')
  })

  it('returns 200 and updates version', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindFirst.mockResolvedValue(makeAgent())
    const updated = makeAgent({ version: '2.0.0' })
    mockAgentUpdate.mockResolvedValue(updated)

    const res = await PATCH(makeRequest({ version: '2.0.0' }), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('version', '2.0.0')
  })

  it('allows OPERATOR role to patch', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    mockAgentFindFirst.mockResolvedValue(makeAgent())
    mockAgentUpdate.mockResolvedValue(makeAgent({ name: 'Updated' }))

    const res = await PATCH(makeRequest({ name: 'Updated' }), makeParams())
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/connectors/agents/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
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

  it('returns 404 when agent belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockAgentFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('agent-other'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when agent does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('soft-deletes by setting isRevoked=true and returns 200', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockAgentFindFirst.mockResolvedValue(makeAgent())
    const revoked = makeAgent({ isRevoked: true })
    mockAgentUpdate.mockResolvedValue(revoked)

    const res = await DELETE(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockAgentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRevoked: true }),
      })
    )
    expect(data).toHaveProperty('isRevoked', true)
  })
})
