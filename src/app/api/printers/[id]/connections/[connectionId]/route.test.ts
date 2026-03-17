// Mocks MUST be declared before imports
const mockGetServerSession = jest.fn()
const mockConnectionFindFirst = jest.fn()
const mockConnectionUpdate = jest.fn()
const mockConnectionDelete = jest.fn()
const mockEncryptCredentials = jest.fn()

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
    printerConnection: {
      findFirst: (...args: unknown[]) => mockConnectionFindFirst(...args),
      update: (...args: unknown[]) => mockConnectionUpdate(...args),
      delete: (...args: unknown[]) => mockConnectionDelete(...args),
    },
  },
}))

jest.mock('@/lib/connector-crypto', () => ({
  encryptCredentials: (...args: unknown[]) => mockEncryptCredentials(...args),
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

function makeParams(id = 'printer-1', connectionId = 'conn-1') {
  return { params: { id, connectionId } }
}

function makeConnection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    tenantId: 'tenant-1',
    printerId: 'printer-1',
    platform: 'BAMBU_LAB',
    host: '192.168.1.100',
    port: 8883,
    path: null,
    useTls: true,
    authType: 'API_TOKEN',
    accessMode: 'LOCAL_FULL',
    credentialsEncrypted: { ciphertext: 'enc', iv: 'iv', tag: 'tag' },
    capabilities: null,
    isEnabled: true,
    lastValidatedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('GET /api/printers/[id]/connections/[connectionId]', () => {
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

  it('returns 404 when connection belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockConnectionFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('printer-other', 'conn-other'))

    expect(res.status).toBe(404)
    expect(mockConnectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('returns 404 when connection does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('printer-1', 'nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 200 with connection data', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    const conn = makeConnection()
    mockConnectionFindFirst.mockResolvedValue(conn)

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('id', 'conn-1')
    expect(data).toHaveProperty('platform', 'BAMBU_LAB')

    // credentialsEncrypted must never be returned; hasCredentials boolean replaces it
    expect(data).not.toHaveProperty('credentialsEncrypted')
    expect(data).toHaveProperty('hasCredentials')
  })

  it('does not decrypt credentials in response', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(makeConnection())

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    // Neither raw credentials nor the encrypted blob may be returned
    expect(data).not.toHaveProperty('credentials')
    expect(data).not.toHaveProperty('credentialsEncrypted')
  })
})

describe('PATCH /api/printers/[id]/connections/[connectionId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEncryptCredentials.mockReturnValue({ ciphertext: 'new-enc', iv: 'new-iv', tag: 'new-tag' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ host: '10.0.0.1' }), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
    const res = await PATCH(makeRequest({ host: '10.0.0.1' }), makeParams())
    expect(res.status).toBe(403)
  })

  it('allows OPERATOR role to patch', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    mockConnectionFindFirst.mockResolvedValue(makeConnection())
    mockConnectionUpdate.mockResolvedValue(makeConnection({ host: '10.0.0.1' }))

    const res = await PATCH(makeRequest({ host: '10.0.0.1' }), makeParams())
    expect(res.status).toBe(200)
  })

  it('returns 404 when connection belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockConnectionFindFirst.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ host: '10.0.0.1' }), makeParams('printer-other', 'conn-other'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when connection does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ host: '10.0.0.1' }), makeParams('printer-1', 'nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 200 and updates fields', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(makeConnection())
    const updated = makeConnection({ host: '10.0.0.1', port: 9000 })
    mockConnectionUpdate.mockResolvedValue(updated)

    const res = await PATCH(makeRequest({ host: '10.0.0.1', port: 9000 }), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('host', '10.0.0.1')

    // credentialsEncrypted must never be returned; hasCredentials boolean replaces it
    expect(data).not.toHaveProperty('credentialsEncrypted')
    expect(data).toHaveProperty('hasCredentials')
  })

  it('re-encrypts credentials when provided in patch', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(makeConnection())
    mockConnectionUpdate.mockResolvedValue(makeConnection())

    const newCreds = { serial: 'NEW123', accessCode: 'new-secret' }
    await PATCH(makeRequest({ credentials: newCreds }), makeParams())

    expect(mockEncryptCredentials).toHaveBeenCalledWith(newCreds)
    expect(mockConnectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          credentialsEncrypted: { ciphertext: 'new-enc', iv: 'new-iv', tag: 'new-tag' },
        }),
      })
    )
  })

  it('does not call encryptCredentials when credentials not in patch', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(makeConnection())
    mockConnectionUpdate.mockResolvedValue(makeConnection({ host: '10.0.0.1' }))

    await PATCH(makeRequest({ host: '10.0.0.1' }), makeParams())

    expect(mockEncryptCredentials).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/printers/[id]/connections/[connectionId]', () => {
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

  it('returns 403 when role is OPERATOR (ADMIN only for delete)', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 404 when connection belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockConnectionFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('printer-other', 'conn-other'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when connection does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(null)

    const res = await DELETE(makeRequest(), makeParams('printer-1', 'nonexistent'))
    expect(res.status).toBe(404)
  })

  it('deletes connection and returns 200', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockConnectionFindFirst.mockResolvedValue(makeConnection())
    mockConnectionDelete.mockResolvedValue(makeConnection())

    const res = await DELETE(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockConnectionDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conn-1' },
      })
    )
    expect(data).toHaveProperty('success', true)
  })
})
