const mockFindUnique = jest.fn()

jest.mock('@/lib/api-response', () => ({
  apiError: (code: string, message: string, status: number) =>
    ({ status, json: () => Promise.resolve({ error: message, code }) }) as unknown as Response,
  apiSuccess: (data: unknown, status = 200) =>
    ({ status, json: () => Promise.resolve(data) }) as unknown as Response,
}))

const mockUserUpdate = jest.fn()
const mockTokenUpdate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockTokenUpdate(...args),
    },
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    $transaction: (promises: Promise<unknown>[]) => Promise.all(promises),
  },
}))

import { POST } from './route'

jest.mock('bcryptjs', () => ({
  hash: (password: string) => Promise.resolve(`hashed:${password}`),
}))

function createRequest(body: { token?: string; password?: string }) {
  return { json: () => Promise.resolve(body) } as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserUpdate.mockResolvedValue({})
    mockTokenUpdate.mockResolvedValue({})
  })

  it('returns 400 when token is missing', async () => {
    const res = await POST(createRequest({ password: 'newpassword123' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('BAD_REQUEST')
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns 400 when password is too short', async () => {
    const res = await POST(createRequest({ token: 'valid-token', password: 'short' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('8 characters')
  })

  it('returns 400 when token is invalid or not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const res = await POST(createRequest({ token: 'bad-token', password: 'newpassword123' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Invalid or expired')
  })

  it('returns 400 when token is already used', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'used-token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: new Date(),
      user: { id: 'user-1' },
    })

    const res = await POST(createRequest({ token: 'used-token', password: 'newpassword123' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('already been used')
  })

  it('returns 400 when token is expired', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 3600000),
      usedAt: null,
      user: { id: 'user-1' },
    })

    const res = await POST(createRequest({ token: 'expired-token', password: 'newpassword123' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('expired')
  })

  it('updates password and marks token used when valid', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 3600000),
      usedAt: null,
      user: { id: 'user-1' },
    })
    mockUserUpdate.mockResolvedValue({})
    mockTokenUpdate.mockResolvedValue({})

    const res = await POST(createRequest({ token: 'valid-token', password: 'newpassword123' }))
    expect(res.status).toBe(200)
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ password: 'hashed:newpassword123' }),
      })
    )
    expect(mockTokenUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'token-1' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      })
    )
    const data = await res.json()
    expect(data.message).toContain('reset')
  })
})
