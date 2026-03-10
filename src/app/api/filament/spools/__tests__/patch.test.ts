// Mocks must be declared before any imports that depend on them
const mockGetServerSession = jest.fn()
const mockFindFirst = jest.fn()
const mockUpdate = jest.fn()
const mockCreateNotification = jest.fn()

jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/api-response', () => ({
  apiError: (code: string, message: string, status: number) =>
    ({ status, json: () => Promise.resolve({ error: message, code }) }) as unknown as Response,
  apiSuccess: (data: unknown, status = 200) =>
    ({ status, json: () => Promise.resolve(data) }) as unknown as Response,
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    filamentSpool: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}))

jest.mock('@/lib/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

import { PATCH } from '../[id]/route'

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      tenantId: 'tenant-1',
      role: 'ADMIN',
      ...overrides,
    },
  }
}

function createRequest(body: Record<string, unknown>) {
  return {
    json: () => Promise.resolve(body),
  } as unknown as import('next/server').NextRequest
}

function makeParams(id = 'spool-1') {
  return { params: { id } }
}

const baseExistingSpool = {
  id: 'spool-1',
  remainingPercent: 80,
  lowStockThreshold: 20,
  landedCostTotal: null,
}

const baseUpdatedSpool = {
  id: 'spool-1',
  weight: 1000,
  capacity: 1000,
  remainingWeight: 150,
  remainingQuantity: 150,
  remainingPercent: 15,
  lowStockThreshold: 20,
  landedCostTotal: null,
  purchaseDate: null,
  notes: null,
  filament: {
    brand: 'Hatchbox',
    type: { code: 'PLA' },
    color: { name: 'Black' },
  },
}

describe('PATCH /api/filament/spools/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authentication & authorization', () => {
    it('returns 401 when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)
      const res = await PATCH(createRequest({}), makeParams())
      expect(res.status).toBe(401)
    })

    it('returns 401 when session has no tenantId', async () => {
      mockGetServerSession.mockResolvedValue({ user: { role: 'ADMIN' } })
      const res = await PATCH(createRequest({}), makeParams())
      expect(res.status).toBe(401)
    })

    it('returns 403 when user role is VIEWER', async () => {
      mockGetServerSession.mockResolvedValue(makeSession({ role: 'VIEWER' }))
      const res = await PATCH(createRequest({}), makeParams())
      expect(res.status).toBe(403)
    })

    it('returns 404 when spool not found', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(null)
      const res = await PATCH(createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50 }), makeParams())
      expect(res.status).toBe(404)
    })
  })

  describe('threshold crossing notification', () => {
    it('fires notification when spool crosses threshold (was above, now below)', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue({ ...baseExistingSpool, remainingPercent: 80 })
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, remainingPercent: 15 })
      mockCreateNotification.mockResolvedValue({ id: 'notif-1' })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 15 }),
        makeParams()
      )

      expect(res.status).toBe(200)
      expect(mockCreateNotification).toHaveBeenCalledTimes(1)
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          type: 'FILAMENT_LOW',
          dedupeKey: 'spool-1',
        })
      )
    })

    it('does NOT fire notification when spool was already below threshold before update', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      // Previously already below threshold (15 <= 20)
      mockFindFirst.mockResolvedValue({ ...baseExistingSpool, remainingPercent: 15 })
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, remainingPercent: 10 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 10 }),
        makeParams()
      )

      expect(res.status).toBe(200)
      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('does NOT fire notification when spool remains above threshold', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue({ ...baseExistingSpool, remainingPercent: 80 })
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, remainingPercent: 50 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50 }),
        makeParams()
      )

      expect(res.status).toBe(200)
      expect(mockCreateNotification).not.toHaveBeenCalled()
    })

    it('does NOT fire notification when remainingPercent is exactly 0 (empty spool)', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue({ ...baseExistingSpool, remainingPercent: 80 })
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, remainingPercent: 0 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 0 }),
        makeParams()
      )

      expect(res.status).toBe(200)
      // remainingPercent === 0 should NOT trigger (isNowBelow requires > 0)
      expect(mockCreateNotification).not.toHaveBeenCalled()
    })
  })

  describe('lowStockThreshold validation', () => {
    it('returns 400 when lowStockThreshold is a string (non-finite number)', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(baseExistingSpool)

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50, lowStockThreshold: 'bad' }),
        makeParams()
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.code).toBe('BAD_REQUEST')
    })

    it('returns 400 when lowStockThreshold is NaN', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(baseExistingSpool)

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50, lowStockThreshold: NaN }),
        makeParams()
      )

      expect(res.status).toBe(400)
    })

    it('clamps lowStockThreshold above 100 to 100 (no 400)', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(baseExistingSpool)
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, lowStockThreshold: 100 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50, lowStockThreshold: 150 }),
        makeParams()
      )

      // Server clamps to 100 rather than rejecting
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lowStockThreshold: 100 }),
        })
      )
    })

    it('clamps lowStockThreshold below 0 to 0 (no 400)', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(baseExistingSpool)
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, lowStockThreshold: 0 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50, lowStockThreshold: -10 }),
        makeParams()
      )

      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lowStockThreshold: 0 }),
        })
      )
    })

    it('accepts lowStockThreshold of 0', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(baseExistingSpool)
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, lowStockThreshold: 0 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50, lowStockThreshold: 0 }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })

    it('accepts lowStockThreshold of 100', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      mockFindFirst.mockResolvedValue(baseExistingSpool)
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, lowStockThreshold: 100 })

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 50, lowStockThreshold: 100 }),
        makeParams()
      )

      expect(res.status).toBe(200)
    })
  })

  describe('notification error isolation', () => {
    it('returns 200 even if createNotification throws', async () => {
      mockGetServerSession.mockResolvedValue(makeSession())
      // Spool was above threshold, will cross now
      mockFindFirst.mockResolvedValue({ ...baseExistingSpool, remainingPercent: 80 })
      mockUpdate.mockResolvedValue({ ...baseUpdatedSpool, remainingPercent: 15 })
      mockCreateNotification.mockRejectedValue(new Error('DB connection lost'))

      const res = await PATCH(
        createRequest({ weight: 1000, capacity: 1000, remainingPercent: 15 }),
        makeParams()
      )

      // Should still succeed — notification error must not propagate
      expect(res.status).toBe(200)
    })
  })
})
