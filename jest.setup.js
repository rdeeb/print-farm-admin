import '@testing-library/jest-dom'

// Polyfill Response for NextResponse (API routes and api-response.ts)
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.status = init.status ?? 200
      this.body = body
    }
    json() {
      return Promise.resolve(this.body)
    }
    static json(data, init = {}) {
      return new globalThis.Response(data, { ...init, status: init.status ?? 200 })
    }
  }
} else if (typeof globalThis.Response.json !== 'function') {
  globalThis.Response.json = function (data, init = {}) {
    return new globalThis.Response(data, { ...init, status: init.status ?? 200 })
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

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}