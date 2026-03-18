import { createConnectorClient } from 'rd-sa-connector'
import type { ConnectorClient, TrackEventInput, StateSnapshotInput, RequestOptions } from 'rd-sa-connector'
import { prisma } from '@/lib/prisma'
import { PLAN_CONFIG } from '@/lib/stripe'
import { PlanTier } from '@prisma/client'

// Optional — the app runs fine without it; events are silently skipped.
function buildClient(): ConnectorClient | null {
  const { RD_BASE_URL, RD_APP_ID, RD_APP_SECRET } = process.env
  if (!RD_BASE_URL || !RD_APP_ID || !RD_APP_SECRET) return null
  return createConnectorClient({ baseUrl: RD_BASE_URL, appId: RD_APP_ID, appSecret: RD_APP_SECRET })
}

const client = buildClient()

/**
 * Fire-and-forget event tracking. Failures are logged but never thrown —
 * the calling route should not break if the SA dashboard is unavailable.
 */
export async function trackEvent(input: TrackEventInput, options?: RequestOptions): Promise<void> {
  if (!client) return
  try {
    await client.trackEvent(input, options)
  } catch (err) {
    console.warn('[sa-connector] trackEvent failed:', err)
  }
}

export async function pushStateSnapshot(input: StateSnapshotInput): Promise<void> {
  if (!client) return
  try {
    await client.pushStateSnapshot(input)
  } catch (err) {
    console.warn('[sa-connector] pushStateSnapshot failed:', err)
  }
}

/**
 * Queries the DB to compute current metrics and pushes a snapshot.
 * Safe to call fire-and-forget — never throws.
 */
export async function pushCurrentSnapshot(): Promise<void> {
  if (!client) return
  try {
    const subscriptions = await prisma.subscription.findMany({
      select: { tier: true, status: true, stripePriceId: true },
    })

    let active_accounts = 0
    let active_trials = 0
    let mrr = 0

    for (const sub of subscriptions) {
      if (sub.tier === PlanTier.TRIAL) {
        if (sub.status === 'trialing' || sub.status === 'active') active_trials++
        continue
      }
      if (sub.status !== 'active' && sub.status !== 'past_due') continue

      active_accounts++

      const config = PLAN_CONFIG[sub.tier]
      if (sub.stripePriceId === config.annualPriceId && config.annualPrice !== null) {
        mrr += config.annualPrice
      } else if (sub.stripePriceId === config.monthlyPriceId && config.monthlyPrice !== null) {
        mrr += config.monthlyPrice
      }
    }

    await client.pushStateSnapshot({
      occurred_at: new Date(),
      active_accounts,
      active_trials,
      mrr,
      lifetime_revenue: 0, // TODO: accumulate from invoice.payment_succeeded webhook
    })
  } catch (err) {
    console.warn('[sa-connector] pushCurrentSnapshot failed:', err)
  }
}
