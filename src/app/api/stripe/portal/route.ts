export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return apiError('UNAUTHORIZED', 'Authentication required', 401)
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: session.user.tenantId },
    })

    if (!subscription) {
      return apiError('NOT_FOUND', 'Subscription record not found', 404)
    }

    if (!subscription.stripeCustomerId) {
      return apiError('BAD_REQUEST', 'Stripe customer not yet linked. Please contact support.', 400)
    }

    const appUrl = process.env.NEXTAUTH_URL
    if (!appUrl) throw new Error('NEXTAUTH_URL is not configured')

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    })

    return apiSuccess({ url: portalSession.url })
  } catch (error: unknown) {
    console.error('Stripe portal error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return apiError('INTERNAL_ERROR', message, 500)
  }
}
