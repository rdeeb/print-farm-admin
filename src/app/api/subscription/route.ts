export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPrinterLimit, PLAN_CONFIG } from '@/lib/stripe'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
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

    const printerCount = await prisma.printer.count({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
      },
    })

    const rawLimit = getPrinterLimit(subscription.tier)
    const planConfig = PLAN_CONFIG[subscription.tier]

    // Calculate days remaining on trial
    let trialDaysRemaining: number | null = null
    if (subscription.tier === 'TRIAL' && subscription.trialEndsAt) {
      const now = new Date()
      const diff = subscription.trialEndsAt.getTime() - now.getTime()
      trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }

    // #19: getPrinterLimit returns Infinity for FARM (unlimited); expose null to clients
    const printerLimit = rawLimit === Infinity ? null : rawLimit

    return apiSuccess({
      tier: subscription.tier,
      status: subscription.status,
      planName: planConfig.name,
      printerLimit,
      printerCount,
      trialEndsAt: subscription.trialEndsAt,
      trialDaysRemaining,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      // #12: boolean instead of the raw Stripe subscription ID
      hasActiveSubscription: subscription.status === 'active',
    })
  } catch (error: unknown) {
    console.error('Subscription status error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return apiError('INTERNAL_ERROR', message, 500)
  }
}
