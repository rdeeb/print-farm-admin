/**
 * Unit tests for the Stripe webhook handler (POST /api/stripe/webhook).
 *
 * Mocks:
 *   - next/server (NextResponse) — avoids jsdom NextResponse cookie polyfill issues
 *   - stripe (SDK) — constructEvent + subscriptions.retrieve
 *   - @/lib/prisma — subscription.update
 *   - @/lib/stripe — re-exports stripe instance and getTierFromPriceId
 */

process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
process.env.STRIPE_PRICE_SOLO_MONTHLY = 'price_solo_monthly'
process.env.STRIPE_PRICE_SOLO_ANNUAL = 'price_solo_annual'
process.env.STRIPE_PRICE_SHOP_MONTHLY = 'price_shop_monthly'
process.env.STRIPE_PRICE_SHOP_ANNUAL = 'price_shop_annual'
process.env.STRIPE_PRICE_FARM_MONTHLY = 'price_farm_monthly'
process.env.STRIPE_PRICE_FARM_ANNUAL = 'price_farm_annual'

// ── next/server mock ─────────────────────────────────────────────────────────
// NextResponse relies on edge-runtime cookie internals unavailable in jsdom.
// Provide a lightweight stand-in. The factory form of jest.mock is always
// hoisted and intercepts the module before the route imports it.
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init: { status?: number } = {}) => ({
      status: init.status ?? 200,
      json: () => Promise.resolve(data),
    }),
  },
}))

// ── Prisma mock ──────────────────────────────────────────────────────────────
const mockSubscriptionUpdate = jest.fn()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subscription: {
      update: (...args: unknown[]) => mockSubscriptionUpdate(...args),
    },
  },
}))

// ── Stripe SDK mock ──────────────────────────────────────────────────────────
const mockConstructEvent = jest.fn()
const mockSubscriptionsRetrieve = jest.fn()

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
    },
  }))
})

// Import AFTER mocks are registered
import { POST } from '../webhook/route'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: string, signature: string | null = 'valid-sig'): Request {
  const headers = new Headers()
  if (signature !== null) {
    headers.set('stripe-signature', signature)
  }
  return { text: () => Promise.resolve(body), headers } as unknown as Request
}

function makeStripeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    items: { data: [{ price: { id: 'price_solo_monthly' } }] },
    current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    cancel_at_period_end: false,
    metadata: { tenantId: 'tenant-abc' },
    ...overrides,
  }
}

function makeEvent(type: string, object: unknown) {
  return { type, data: { object } }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSubscriptionUpdate.mockResolvedValue({})
  })

  // ── Signature validation ─────────────────────────────────────────────────

  describe('signature validation', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = makeRequest('{}', null)
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/stripe-signature/i)
    })

    it('returns 400 when constructEvent throws (invalid signature)', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found')
      })
      const req = makeRequest('{}', 'bad-sig')
      const res = await POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('No signatures found')
    })
  })

  // ── checkout.session.completed ───────────────────────────────────────────

  describe('checkout.session.completed', () => {
    it('updates subscription with correct tier and status', async () => {
      const stripeSub = makeStripeSubscription()
      mockSubscriptionsRetrieve.mockResolvedValue(stripeSub)

      const session = {
        metadata: { tenantId: 'tenant-abc' },
        subscription: 'sub_123',
      }
      mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-abc' },
          data: expect.objectContaining({
            tier: 'SOLO',
            status: 'active',
            stripeSubscriptionId: 'sub_123',
            stripePriceId: 'price_solo_monthly',
            cancelAtPeriodEnd: false,
          }),
        })
      )
    })

    it('does nothing and returns 200 when tenantId is missing from metadata', async () => {
      const session = { metadata: {}, subscription: 'sub_123' }
      mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)
      expect(mockSubscriptionUpdate).not.toHaveBeenCalled()
    })

    it('does nothing when subscription field is missing', async () => {
      const session = { metadata: { tenantId: 'tenant-abc' }, subscription: null }
      mockConstructEvent.mockReturnValue(makeEvent('checkout.session.completed', session))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)
      expect(mockSubscriptionUpdate).not.toHaveBeenCalled()
    })
  })

  // ── customer.subscription.updated ────────────────────────────────────────

  describe('customer.subscription.updated', () => {
    it('updates tier correctly when priceId is present', async () => {
      const sub = makeStripeSubscription({ metadata: { tenantId: 'tenant-abc' } })
      mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', sub))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-abc' },
          data: expect.objectContaining({
            tier: 'SOLO',
            status: 'active',
            stripePriceId: 'price_solo_monthly',
          }),
        })
      )
    })

    it('does NOT update tier when priceId is missing', async () => {
      const sub = makeStripeSubscription({
        items: { data: [{ price: { id: undefined } }] },
        metadata: { tenantId: 'tenant-abc' },
      })
      // Simulate missing price id by having items.data[0].price.id = undefined
      sub.items.data[0].price.id = undefined as unknown as string
      mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', sub))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ tier: expect.anything() }),
        })
      )
    })

    it('falls back to subscriptionId lookup and logs warning when tenantId missing', async () => {
      const sub = makeStripeSubscription({ metadata: {} })
      mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.updated', sub))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: 'sub_123' },
        })
      )
      // console.warn is suppressed globally but should have been called
      expect(console.warn).toHaveBeenCalled()
    })
  })

  // ── customer.subscription.deleted ────────────────────────────────────────

  describe('customer.subscription.deleted', () => {
    it('resets tier to TRIAL and sets status to canceled', async () => {
      const sub = makeStripeSubscription({ metadata: { tenantId: 'tenant-abc' } })
      mockConstructEvent.mockReturnValue(makeEvent('customer.subscription.deleted', sub))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-abc' },
          data: expect.objectContaining({
            tier: 'TRIAL',
            status: 'canceled',
            stripeSubscriptionId: null,
            stripePriceId: null,
            cancelAtPeriodEnd: false,
          }),
        })
      )
    })
  })

  // ── invoice.payment_failed ───────────────────────────────────────────────

  describe('invoice.payment_failed', () => {
    it('sets status to past_due', async () => {
      const invoice = { subscription: 'sub_123' }
      mockConstructEvent.mockReturnValue(makeEvent('invoice.payment_failed', invoice))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)

      expect(mockSubscriptionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: 'sub_123' },
          data: { status: 'past_due' },
        })
      )
    })

    it('does nothing and returns 200 when subscriptionId is missing', async () => {
      const invoice = { subscription: null }
      mockConstructEvent.mockReturnValue(makeEvent('invoice.payment_failed', invoice))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)
      expect(mockSubscriptionUpdate).not.toHaveBeenCalled()
    })
  })

  // ── Unknown event type ───────────────────────────────────────────────────

  describe('unknown event type', () => {
    it('returns 200 without calling prisma (no-op)', async () => {
      mockConstructEvent.mockReturnValue(makeEvent('some.unhandled.event', {}))

      const res = await POST(makeRequest('body'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)
      expect(mockSubscriptionUpdate).not.toHaveBeenCalled()
    })
  })
})
