import Stripe from 'stripe'
import { PlanTier } from '@prisma/client'

// Lazily initialized so a missing STRIPE_SECRET_KEY does not crash at build time.
// The client is created on first use; any API call without the key will throw.
let _stripe: Stripe | undefined

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

export interface PlanConfig {
  name: string
  description: string
  /** Printer limit for this tier. -1 means unlimited (FARM). */
  printerLimit: number
  monthlyPriceId: string | undefined
  annualPriceId: string | undefined
  monthlyPrice: number | null
  annualPrice: number | null
}

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
  TRIAL: {
    name: 'Trial',
    description: '14-day free trial with full access',
    printerLimit: 5,
    monthlyPriceId: undefined,
    annualPriceId: undefined,
    monthlyPrice: null,
    annualPrice: null,
  },
  SOLO: {
    name: 'Solo',
    description: 'Perfect for individual makers',
    printerLimit: 5,
    monthlyPriceId: process.env.STRIPE_PRICE_SOLO_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_SOLO_ANNUAL,
    monthlyPrice: 19,
    annualPrice: 15,
  },
  SHOP: {
    name: 'Shop',
    description: 'For small print shops and teams',
    printerLimit: 20,
    monthlyPriceId: process.env.STRIPE_PRICE_SHOP_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_SHOP_ANNUAL,
    monthlyPrice: 49,
    annualPrice: 39,
  },
  FARM: {
    name: 'Farm',
    description: 'Unlimited printers for large operations',
    // #19: Use -1 as sentinel for unlimited instead of Infinity
    printerLimit: -1,
    monthlyPriceId: process.env.STRIPE_PRICE_FARM_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_FARM_ANNUAL,
    monthlyPrice: 99,
    annualPrice: 79,
  },
}

/**
 * Returns the PlanTier associated with a given Stripe price ID.
 * Defaults to TRIAL if the price ID is not recognized.
 */
export function getTierFromPriceId(priceId: string): PlanTier {
  for (const [tier, config] of Object.entries(PLAN_CONFIG)) {
    if (config.monthlyPriceId === priceId || config.annualPriceId === priceId) {
      return tier as PlanTier
    }
  }
  return PlanTier.TRIAL
}

/**
 * Returns the printer limit for a given plan tier.
 * Returns Infinity for FARM (unlimited) so callers can use numeric comparisons directly.
 * The raw value in PLAN_CONFIG is -1 to avoid JSON serialization issues.
 */
export function getPrinterLimit(tier: PlanTier): number {
  const limit = PLAN_CONFIG[tier].printerLimit
  // #19: -1 sentinel → Infinity for comparison logic
  return limit === -1 ? Infinity : limit
}

