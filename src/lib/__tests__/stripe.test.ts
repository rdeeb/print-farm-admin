/**
 * Unit tests for pure utility functions in src/lib/stripe.ts
 * Tests getTierFromPriceId and getPrinterLimit without network/DB deps.
 *
 * NOTE: PLAN_CONFIG is evaluated at module load time from process.env, so we
 * must set env vars before the module is imported. We use jest.isolateModules
 * to guarantee a fresh module load after env vars are set.
 */

// Mock the stripe SDK constructor so it doesn't throw without a real key
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({}))
})

const PRICE_IDS = {
  STRIPE_SECRET_KEY: 'sk_test_fake',
  STRIPE_PRICE_SOLO_MONTHLY: 'price_solo_monthly',
  STRIPE_PRICE_SOLO_ANNUAL: 'price_solo_annual',
  STRIPE_PRICE_SHOP_MONTHLY: 'price_shop_monthly',
  STRIPE_PRICE_SHOP_ANNUAL: 'price_shop_annual',
  STRIPE_PRICE_FARM_MONTHLY: 'price_farm_monthly',
  STRIPE_PRICE_FARM_ANNUAL: 'price_farm_annual',
} as const

// Apply env vars before any module is loaded in these tests
Object.assign(process.env, PRICE_IDS)

// ── Lazy imports (loaded after env vars, using isolateModules) ────────────────
let getTierFromPriceId: (priceId: string) => import('@prisma/client').PlanTier
let getPrinterLimit: (tier: import('@prisma/client').PlanTier) => number
let PLAN_CONFIG: Record<string, { printerLimit: number }>
let PlanTier: typeof import('@prisma/client').PlanTier

beforeAll(() => {
  jest.isolateModules(() => {
    const stripeModule = require('../stripe')
    const prismaClient = require('@prisma/client')
    getTierFromPriceId = stripeModule.getTierFromPriceId
    getPrinterLimit = stripeModule.getPrinterLimit
    PLAN_CONFIG = stripeModule.PLAN_CONFIG
    PlanTier = prismaClient.PlanTier
  })
})

describe('PLAN_CONFIG', () => {
  it('has entries for all four tiers', () => {
    expect(Object.keys(PLAN_CONFIG)).toEqual(
      expect.arrayContaining(['TRIAL', 'SOLO', 'SHOP', 'FARM'])
    )
  })
})

describe('getTierFromPriceId', () => {
  it('returns SOLO for the SOLO monthly price ID', () => {
    expect(getTierFromPriceId('price_solo_monthly')).toBe(PlanTier.SOLO)
  })

  it('returns SOLO for the SOLO annual price ID', () => {
    expect(getTierFromPriceId('price_solo_annual')).toBe(PlanTier.SOLO)
  })

  it('returns SHOP for the SHOP monthly price ID', () => {
    expect(getTierFromPriceId('price_shop_monthly')).toBe(PlanTier.SHOP)
  })

  it('returns SHOP for the SHOP annual price ID', () => {
    expect(getTierFromPriceId('price_shop_annual')).toBe(PlanTier.SHOP)
  })

  it('returns FARM for the FARM monthly price ID', () => {
    expect(getTierFromPriceId('price_farm_monthly')).toBe(PlanTier.FARM)
  })

  it('returns FARM for the FARM annual price ID', () => {
    expect(getTierFromPriceId('price_farm_annual')).toBe(PlanTier.FARM)
  })

  it('returns TRIAL for an unknown price ID', () => {
    expect(getTierFromPriceId('price_does_not_exist')).toBe(PlanTier.TRIAL)
  })

  it('returns TRIAL for an empty string', () => {
    expect(getTierFromPriceId('')).toBe(PlanTier.TRIAL)
  })
})

describe('getPrinterLimit', () => {
  it('returns 5 for TRIAL', () => {
    expect(getPrinterLimit(PlanTier.TRIAL)).toBe(5)
  })

  it('returns 5 for SOLO', () => {
    expect(getPrinterLimit(PlanTier.SOLO)).toBe(5)
  })

  it('returns 20 for SHOP', () => {
    expect(getPrinterLimit(PlanTier.SHOP)).toBe(20)
  })

  it('returns Infinity for FARM (unlimited)', () => {
    expect(getPrinterLimit(PlanTier.FARM)).toBe(Infinity)
  })

  it('FARM limit can be used in numeric comparisons without overflow issues', () => {
    const limit = getPrinterLimit(PlanTier.FARM)
    expect(999999 < limit).toBe(true)
  })
})
