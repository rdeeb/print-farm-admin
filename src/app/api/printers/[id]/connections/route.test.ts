// Mocks MUST be declared before imports
const mockGetServerSession = jest.fn()
const mockPrinterFindFirst = jest.fn()
const mockConnectionFindMany = jest.fn()
const mockConnectionCreate = jest.fn()
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
    printer: {
      findFirst: (...args: unknown[]) => mockPrinterFindFirst(...args),
    },
    printerConnection: {
      findMany: (...args: unknown[]) => mockConnectionFindMany(...args),
      create: (...args: unknown[]) => mockConnectionCreate(...args),
    },
  },
}))

jest.mock('@/lib/connector-crypto', () => ({
  encryptCredentials: (...args: unknown[]) => mockEncryptCredentials(...args),
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

function makeRequest(body?: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body ?? {}),
  } as unknown as import('next/server').NextRequest
}

function makeParams(id = 'printer-1') {
  return { params: { id } }
}

function makePrinter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'printer-1',
    tenantId: 'tenant-1',
    name: 'Test Printer',
    ...overrides,
  }
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

describe('GET /api/printers/[id]/connections', () => {
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

  it('returns 404 when printer belongs to different tenant', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-A' }))
    mockPrinterFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('printer-other'))

    expect(res.status).toBe(404)
    expect(mockPrinterFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-A' }),
      })
    )
  })

  it('returns 404 when printer does not exist', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(null)

    const res = await GET(makeRequest(), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns connections for the printer with tenant isolation', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ tenantId: 'tenant-1' }))
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    const connections = [makeConnection()]
    mockConnectionFindMany.mockResolvedValue(connections)

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)

    // Verify tenant isolation on connections query
    expect(mockConnectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )

    // credentialsEncrypted must never be returned; hasCredentials boolean replaces it
    expect(data[0]).not.toHaveProperty('credentialsEncrypted')
    expect(data[0]).toHaveProperty('hasCredentials')
  })

  it('returns empty array when printer has no connections', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    mockConnectionFindMany.mockResolvedValue([])

    const res = await GET(makeRequest(), makeParams())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual([])
  })
})

describe('POST /api/printers/[id]/connections', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEncryptCredentials.mockReturnValue({ ciphertext: 'enc', iv: 'iv', tag: 'tag' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ platform: 'BAMBU_LAB' }), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is VIEWER', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
    const res = await POST(makeRequest({ platform: 'BAMBU_LAB' }), makeParams())
    expect(res.status).toBe(403)
  })

  it('allows OPERATOR role to create connection', async () => {
    mockGetServerSession.mockResolvedValue(makeSession({ role: 'OPERATOR' }))
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    mockConnectionCreate.mockResolvedValue(makeConnection())

    const res = await POST(makeRequest({ platform: 'BAMBU_LAB' }), makeParams())
    expect(res.status).toBe(201)
  })

  it('returns 404 when printer not found', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(null)

    const res = await POST(makeRequest({ platform: 'BAMBU_LAB' }), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 400 when platform is missing', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())

    const res = await POST(makeRequest({}), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 409 when platform already exists for this printer', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())

    const p2002Error = Object.assign(new Error('Unique constraint failed'), {
      code: 'P2002',
      clientVersion: '5.0.0',
    })
    mockConnectionCreate.mockRejectedValue(p2002Error)

    const res = await POST(makeRequest({ platform: 'BAMBU_LAB' }), makeParams())
    expect(res.status).toBe(409)
  })

  it('encrypts credentials before storing and does not return raw credentials', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    const created = makeConnection()
    mockConnectionCreate.mockResolvedValue(created)

    const rawCreds = { serial: 'SN123', accessCode: 'secret' }
    const encryptedBlob = { ciphertext: 'encrypted-data', iv: 'random-iv', tag: 'auth-tag' }
    mockEncryptCredentials.mockReturnValue(encryptedBlob)

    const res = await POST(
      makeRequest({ platform: 'BAMBU_LAB', credentials: rawCreds }),
      makeParams()
    )
    const data = await res.json()

    expect(res.status).toBe(201)

    // encryptCredentials must be called with the raw credentials
    expect(mockEncryptCredentials).toHaveBeenCalledWith(rawCreds)

    // The created record should store encrypted form, not raw
    expect(mockConnectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          credentialsEncrypted: encryptedBlob,
        }),
      })
    )

    // Response should NOT contain raw credentials
    expect(data).not.toHaveProperty('credentials')
  })

  it('creates connection without credentials when none provided', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    const created = makeConnection({ credentialsEncrypted: null })
    mockConnectionCreate.mockResolvedValue(created)

    const res = await POST(
      makeRequest({ platform: 'BAMBU_LAB', host: '192.168.1.50' }),
      makeParams()
    )

    expect(res.status).toBe(201)
    expect(mockEncryptCredentials).not.toHaveBeenCalled()
  })

  it('creates connection and returns 201', async () => {
    mockGetServerSession.mockResolvedValue(makeSession())
    mockPrinterFindFirst.mockResolvedValue(makePrinter())
    const created = makeConnection()
    mockConnectionCreate.mockResolvedValue(created)

    const res = await POST(
      makeRequest({ platform: 'BAMBU_LAB', host: '192.168.1.100', port: 8883 }),
      makeParams()
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data).toHaveProperty('id', 'conn-1')
    expect(data).toHaveProperty('platform', 'BAMBU_LAB')

    // credentialsEncrypted must never be returned; hasCredentials boolean replaces it
    expect(data).not.toHaveProperty('credentialsEncrypted')
    expect(data).toHaveProperty('hasCredentials')
  })
})
