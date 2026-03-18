export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getStripe, getTierFromPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { Prisma, PlanTier } from '@prisma/client'
import Stripe from 'stripe'
import { trackEvent, pushCurrentSnapshot } from '@/lib/sa-connector'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      try {
        const session = event.data.object as Stripe.Checkout.Session
        const tenantId = session.metadata?.tenantId

        if (!tenantId || !session.subscription) {
          break
        }

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as Stripe.Subscription).id

        const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId)
        const priceId = stripeSubscription.items.data[0]?.price.id

        // #5: Use getTierFromPriceId for all cases including empty/undefined price ID
        const tier: PlanTier = getTierFromPriceId(priceId ?? '')

        // #4: current_period_end exists at runtime but was removed from Stripe v20 TS types
        const currentPeriodEnd = new Date(
          (stripeSubscription as unknown as { current_period_end: number }).current_period_end * 1000
        )

        await prisma.subscription.update({
          where: { tenantId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            tier,
            status: stripeSubscription.status,
            currentPeriodEnd,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        })

        void trackEvent({ event_type: 'paid_converted', occurred_at: new Date(), external_entity_id: tenantId, metadata: { tier } })
        void pushCurrentSnapshot()
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          console.error('checkout.session.completed: subscription record not found', err)
          return NextResponse.json({ received: true })
        }
        const message = err instanceof Error ? err.message : 'checkout.session.completed handler error'
        console.error(message, err)
        return NextResponse.json({ error: message }, { status: 500 })
      }
      break
    }

    case 'customer.subscription.updated': {
      try {
        const sub = event.data.object as Stripe.Subscription
        const tenantId = sub.metadata?.tenantId

        const priceId = sub.items.data[0]?.price.id
        if (!priceId) {
          console.warn('Webhook: priceId missing on subscription.updated, skipping tier update', { subscriptionId: sub.id })
        }
        const tier: PlanTier | undefined = priceId ? getTierFromPriceId(priceId) : undefined

        // #4: current_period_end exists at runtime but was removed from Stripe v20 TS types
        const currentPeriodEnd = new Date(
          (sub as unknown as { current_period_end: number }).current_period_end * 1000
        )

        type SubscriptionUpdateData = {
          status: string
          currentPeriodEnd: Date
          cancelAtPeriodEnd: boolean
          stripePriceId?: string
          tier?: PlanTier
        }

        const updateData: SubscriptionUpdateData = {
          status: sub.status,
          currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        }

        if (priceId) updateData.stripePriceId = priceId
        if (tier) updateData.tier = tier

        if (tenantId) {
          await prisma.subscription.update({
            where: { tenantId },
            data: updateData,
          })
        } else {
          console.warn('Webhook: tenantId missing from metadata, falling back to subscriptionId lookup', { subscriptionId: sub.id })
          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: updateData,
          })
        }

        void pushCurrentSnapshot()
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          console.error('customer.subscription.updated: subscription record not found', err)
          return NextResponse.json({ received: true })
        }
        const message = err instanceof Error ? err.message : 'customer.subscription.updated handler error'
        console.error(message, err)
        return NextResponse.json({ error: message }, { status: 500 })
      }
      break
    }

    case 'customer.subscription.deleted': {
      try {
        const sub = event.data.object as Stripe.Subscription
        const tenantId = sub.metadata?.tenantId

        const updateData = {
          status: 'canceled',
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null as string | null,
          stripePriceId: null as string | null,
          tier: PlanTier.TRIAL,
          currentPeriodEnd: null as Date | null,
        }

        if (tenantId) {
          await prisma.subscription.update({
            where: { tenantId },
            data: updateData,
          })
        } else {
          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: updateData,
          })
        }

        void trackEvent({ event_type: 'churned', occurred_at: new Date(), external_entity_id: tenantId ?? sub.id })
        void pushCurrentSnapshot()
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          console.error('customer.subscription.deleted: subscription record not found', err)
          return NextResponse.json({ received: true })
        }
        const message = err instanceof Error ? err.message : 'customer.subscription.deleted handler error'
        console.error(message, err)
        return NextResponse.json({ error: message }, { status: 500 })
      }
      break
    }

    case 'invoice.payment_failed': {
      try {
        const invoice = event.data.object as Stripe.Invoice
        // invoice.subscription may be a string ID or an expanded Subscription object
        const rawSubscription = (invoice as unknown as { subscription?: string | { id: string } }).subscription
        const subscriptionId =
          typeof rawSubscription === 'string'
            ? rawSubscription
            : rawSubscription?.id

        if (!subscriptionId) break

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'past_due' },
        })
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          console.error('invoice.payment_failed: subscription record not found', err)
          return NextResponse.json({ received: true })
        }
        const message = err instanceof Error ? err.message : 'invoice.payment_failed handler error'
        console.error(message, err)
        return NextResponse.json({ error: message }, { status: 500 })
      }
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return NextResponse.json({ received: true })
}
