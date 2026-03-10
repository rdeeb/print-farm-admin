const mockCreate = jest.fn()
const mockFindUnique = jest.fn()

jest.mock('@/lib/api-response', () => ({
  apiError: (code: string, message: string, status: number) =>
    ({ status, json: () => Promise.resolve({ error: message, code }) }) as unknown as Response,
  apiSuccess: (data: unknown, status = 200) =>
    ({ status, json: () => Promise.resolve(data) }) as unknown as Response,
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    passwordResetToken: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

import { POST } from './route'

function createRequest(body: { email?: string }) {
  return { json: () => Promise.resolve(body) } as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(createRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('BAD_REQUEST')
    expect(data.error).toContain('Email')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns 200 and does not create token when user not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await POST(createRequest({ email: 'nobody@example.com' }))
    expect(res.status).toBe(200)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates token and returns 200 when user exists', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    })
    mockCreate.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'abc123',
      expiresAt: new Date(),
    })

    const res = await POST(createRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    const createCall = mockCreate.mock.calls[0][0]
    expect(createCall.data.userId).toBe('user-1')
    expect(createCall.data.token).toBeDefined()
    expect(createCall.data.token.length).toBeGreaterThan(10)
    expect(createCall.data.expiresAt).toBeInstanceOf(Date)
  })
})
