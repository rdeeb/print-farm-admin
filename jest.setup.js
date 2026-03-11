import '@testing-library/jest-dom'

// Polyfill TextDecoder/TextEncoder for @react-email/components (uses browser API in Node test env)
const { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder } = require('util')
if (typeof globalThis.TextDecoder === 'undefined') globalThis.TextDecoder = NodeTextDecoder
if (typeof globalThis.TextEncoder === 'undefined') globalThis.TextEncoder = NodeTextEncoder

// Polyfill Response for NextResponse (API routes and api-response.ts)
// Includes `this.headers` so NextResponse (which extends Response) can
// call `new ResponseCookies(this.headers)` without crashing in jsdom.
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.status = init.status ?? 200
      this.body = body
      this.headers = new Headers(init.headers ?? {})
    }
    json() {
      return Promise.resolve(this.body)
    }
    static json(data, init = {}) {
      const headers = new Headers({ 'content-type': 'application/json' })
      return new globalThis.Response(data, { ...init, status: init.status ?? 200, headers })
    }
  }
} else {
  // jsdom provides a native Response — patch static json if needed and ensure
  // the prototype has getSetCookie for edge-runtime cookie compatibility.
  if (typeof globalThis.Response.json !== 'function') {
    globalThis.Response.json = function (data, init = {}) {
      return new globalThis.Response(JSON.stringify(data), {
        ...init,
        status: init.status ?? 200,
        headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
      })
    }
  }
  if (typeof Headers !== 'undefined' && typeof Headers.prototype.getSetCookie !== 'function') {
    Headers.prototype.getSetCookie = function () { return [] }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'test-tenant-id',
        tenant: {
          id: 'test-tenant-id',
          name: 'Test Tenant',
          slug: 'test-tenant',
        },
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Stripe test env vars — required so PLAN_CONFIG in src/lib/stripe.ts is
// populated with price IDs before any test module is loaded.
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_fake'
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
process.env.STRIPE_PRICE_SOLO_MONTHLY = process.env.STRIPE_PRICE_SOLO_MONTHLY || 'price_solo_monthly'
process.env.STRIPE_PRICE_SOLO_ANNUAL = process.env.STRIPE_PRICE_SOLO_ANNUAL || 'price_solo_annual'
process.env.STRIPE_PRICE_SHOP_MONTHLY = process.env.STRIPE_PRICE_SHOP_MONTHLY || 'price_shop_monthly'
process.env.STRIPE_PRICE_SHOP_ANNUAL = process.env.STRIPE_PRICE_SHOP_ANNUAL || 'price_shop_annual'
process.env.STRIPE_PRICE_FARM_MONTHLY = process.env.STRIPE_PRICE_FARM_MONTHLY || 'price_farm_monthly'
process.env.STRIPE_PRICE_FARM_ANNUAL = process.env.STRIPE_PRICE_FARM_ANNUAL || 'price_farm_annual'

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}