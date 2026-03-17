import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe, PLAN_CONFIG } from '@/lib/stripe'
import { apiError, apiSuccess } from '@/lib/api-response'
import { z } from 'zod'

const checkoutSchema = z.object({
  tier: z.enum(['SOLO', 'SHOP', 'FARM']),
  interval: z.enum(['monthly', 'annual']),
  discountCode: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    // #8: Parse and validate before any resolution logic
    const parsed = checkoutSchema.safeParse(await request.json())
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ')
      return apiError('BAD_REQUEST', message, 400)
    }

    const { tier, interval, discountCode } = parsed.data

    // #7: Resolve price ID server-side only from PLAN_CONFIG — never from client input
    const config = PLAN_CONFIG[tier]
    const resolvedPriceId = interval === 'annual' ? config.annualPriceId : config.monthlyPriceId

    if (!resolvedPriceId) {
      return apiError(
        'BAD_REQUEST',
        `Price ID not configured for ${tier} ${interval}. Ensure STRIPE_PRICE_${tier}_${interval.toUpperCase()} is set.`,
        400
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!subscription) {
      return apiError('NOT_FOUND', 'Subscription record not found', 404)
    }

    if (!subscription.stripeCustomerId) {
      let customerId: string
      try {
        const customer = await getStripe().customers.create({ metadata: { tenantId: session.user.tenantId } })
        await prisma.subscription.update({
          where: { tenantId: session.user.tenantId },
          data: { stripeCustomerId: customer.id },
        })
        customerId = customer.id
      } catch {
        return apiError('SERVICE_UNAVAILABLE', 'Payment processor temporarily unavailable. Please try again.', 503)
      }
      subscription.stripeCustomerId = customerId
    }

    const appUrl = process.env.NEXTAUTH_URL
    if (!appUrl) throw new Error('NEXTAUTH_URL is not configured')

    // Resolve discount coupon if a code was provided
    let stripeCouponId: string | undefined
    if (discountCode) {
      const discount = await prisma.discountCode.findUnique({
        where: { code: discountCode.toUpperCase().trim() },
      })
      if (
        discount &&
        discount.isActive &&
        (discount.maxUses === null || discount.usedCount < discount.maxUses) &&
        (discount.expiresAt === null || discount.expiresAt > new Date())
      ) {
        if (!discount.stripeCouponId) {
          const coupon = await getStripe().coupons.create({
            percent_off: discount.discountPercent,
            duration: discount.durationMonths ? 'repeating' : 'forever',
            ...(discount.durationMonths ? { duration_in_months: discount.durationMonths } : {}),
            name: `Early Access ${discount.discountPercent}% off`,
          })
          await prisma.discountCode.update({
            where: { id: discount.id },
            data: { stripeCouponId: coupon.id },
          })
          stripeCouponId = coupon.id
        } else {
          stripeCouponId = discount.stripeCouponId
        }
        // Reserve the code against this tenant to prevent parallel redemptions
        await prisma.discountCode.update({
          where: { id: discount.id },
          data: {
            usedCount: { increment: 1 },
            redeemedAt: new Date(),
            redeemedByTenantId: session.user.tenantId,
          },
        })
      }
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: subscription.stripeCustomerId,
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      success_url: `${appUrl}/settings?billing=success`,
      cancel_url: `${appUrl}/subscribe?billing=cancelled`,
      subscription_data: {
        metadata: {
          tenantId: session.user.tenantId,
        },
      },
      metadata: {
        tenantId: session.user.tenantId,
      },
    })

    return apiSuccess({ url: checkoutSession.url })
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return apiError('INTERNAL_ERROR', message, 500)
  }
}
