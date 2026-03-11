/**
 * Unit tests for GET /api/subscription
 *
 * Mocks:
 *   - next-auth (getServerSession)
 *   - @/lib/auth (authOptions)
 *   - @/lib/prisma (subscription.findUnique, printer.count)
 *   - @/lib/api-response (apiError, apiSuccess)
 *   - stripe SDK (constructor)
 *   - @/lib/stripe (getPrinterLimit, PLAN_CONFIG re-exported from the real module)
 */

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.STRIPE_PRICE_SOLO_MONTHLY = 'price_solo_monthly'
process.env.STRIPE_PRICE_SOLO_ANNUAL = 'price_solo_annual'
process.env.STRIPE_PRICE_SHOP_MONTHLY = 'price_shop_monthly'
process.env.STRIPE_PRICE_SHOP_ANNUAL = 'price_shop_annual'
process.env.STRIPE_PRICE_FARM_MONTHLY = 'price_farm_monthly'
process.env.STRIPE_PRICE_FARM_ANNUAL = 'price_farm_annual'

// ── next-auth mock ───────────────────────────────────────────────────────────
const mockGetServerSession = jest.fn()

jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

jest.mock('@/lib/auth', () => ({ authOptions: {} }))

// ── api-response mock ────────────────────────────────────────────────────────
jest.mock('@/lib/api-response', () => ({
  apiError: (code: string, message: string, status: number) =>
    ({ status, json: () => Promise.resolve({ error: message, code }) }) as unknown as Response,
  apiSuccess: (data: unknown, status = 200) =>
    ({ status, json: () => Promise.resolve(data) }) as unknown as Response,
}))

// ── Prisma mock ──────────────────────────────────────────────────────────────
const mockSubscriptionFindUnique = jest.fn()
const mockPrinterCount = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    },
    printer: {
      count: (...args: unknown[]) => mockPrinterCount(...args),
    },
  },
}))

// ── Stripe SDK mock ──────────────────────────────────────────────────────────
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({}))
})

// Import route AFTER all mocks are set up
import { GET } from '../route'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_SESSION = { user: { tenantId: 'tenant-abc' } }

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-db-1',
    tenantId: 'tenant-abc',
    tier: 'SOLO',
    status: 'active',
    trialEndsAt: null,
    currentPeriodEnd: new Date('2026-04-01'),
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: 'sub_stripe_1',
    stripePriceId: 'price_solo_monthly',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue(MOCK_SESSION)
    mockSubscriptionFindUnique.mockResolvedValue(makeSubscription())
    mockPrinterCount.mockResolvedValue(3)
  })

  // ── Authentication ───────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when session is null', async () => {
      mockGetServerSession.mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when session has no tenantId', async () => {
      mockGetServerSession.mockResolvedValue({ user: {} })
      const res = await GET()
      expect(res.status).toBe(401)
    })
  })

  // ── Not found ────────────────────────────────────────────────────────────

  describe('missing subscription record', () => {
    it('returns 404 when subscription record does not exist', async () => {
      mockSubscriptionFindUnique.mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })
  })

  // ── Active subscription ──────────────────────────────────────────────────

  describe('active SOLO subscription', () => {
    it('returns 200 with correct tier, status, and printerLimit', async () => {
      const res = await GET()
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.tier).toBe('SOLO')
      expect(body.status).toBe('active')
      expect(body.printerLimit).toBe(5)
    })

    it('returns printerCount from db', async () => {
      mockPrinterCount.mockResolvedValue(4)
      const res = await GET()
      const body = await res.json()
      expect(body.printerCount).toBe(4)
    })

    it('returns hasActiveSubscription true when status is active', async () => {
      const res = await GET()
      const body = await res.json()
      expect(body.hasActiveSubscription).toBe(true)
    })

    it('returns hasActiveSubscription false when status is past_due', async () => {
      mockSubscriptionFindUnique.mockResolvedValue(makeSubscription({ status: 'past_due' }))
      const res = await GET()
      const body = await res.json()
      expect(body.hasActiveSubscription).toBe(false)
    })
  })

  // ── FARM tier — unlimited ────────────────────────────────────────────────

  describe('FARM tier', () => {
    it('returns printerLimit as null (Infinity serialised to null)', async () => {
      mockSubscriptionFindUnique.mockResolvedValue(makeSubscription({ tier: 'FARM' }))
      const res = await GET()
      const body = await res.json()
      expect(body.printerLimit).toBeNull()
    })
  })

  // ── SHOP tier ────────────────────────────────────────────────────────────

  describe('SHOP tier', () => {
    it('returns printerLimit of 20', async () => {
      mockSubscriptionFindUnique.mockResolvedValue(makeSubscription({ tier: 'SHOP' }))
      const res = await GET()
      const body = await res.json()
      expect(body.printerLimit).toBe(20)
    })
  })

  // ── Trial days remaining ─────────────────────────────────────────────────

  describe('trial tier', () => {
    it('returns trialDaysRemaining > 0 when trialEndsAt is in the future', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      mockSubscriptionFindUnique.mockResolvedValue(
        makeSubscription({ tier: 'TRIAL', trialEndsAt: futureDate })
      )
      const res = await GET()
      const body = await res.json()
      expect(body.trialDaysRemaining).toBeGreaterThan(0)
      expect(body.trialDaysRemaining).toBeLessThanOrEqual(10)
    })

    it('returns trialDaysRemaining of 0 when trialEndsAt is in the past', async () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      mockSubscriptionFindUnique.mockResolvedValue(
        makeSubscription({ tier: 'TRIAL', trialEndsAt: pastDate })
      )
      const res = await GET()
      const body = await res.json()
      expect(body.trialDaysRemaining).toBe(0)
    })

    it('returns trialDaysRemaining null when trialEndsAt is null', async () => {
      mockSubscriptionFindUnique.mockResolvedValue(
        makeSubscription({ tier: 'TRIAL', trialEndsAt: null })
      )
      const res = await GET()
      const body = await res.json()
      expect(body.trialDaysRemaining).toBeNull()
    })

    it('returns trialDaysRemaining null for non-trial tiers', async () => {
      const res = await GET()
      const body = await res.json()
      // tier is SOLO (default), so trialDaysRemaining should be null
      expect(body.trialDaysRemaining).toBeNull()
    })
  })

  // ── Error handling ───────────────────────────────────────────────────────

  describe('error handling', () => {
    it('returns 500 when prisma throws an unexpected error', async () => {
      mockSubscriptionFindUnique.mockRejectedValue(new Error('DB connection lost'))
      const res = await GET()
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.code).toBe('INTERNAL_ERROR')
    })
  })
})
