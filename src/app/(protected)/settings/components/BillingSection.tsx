'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Printer, Clock, ArrowUpRight, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface SubscriptionData {
  tier: 'TRIAL' | 'SOLO' | 'SHOP' | 'FARM'
  status: string
  planName: string
  printerLimit: number | null
  printerCount: number
  trialEndsAt: string | null
  trialDaysRemaining: number | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  // #12: boolean instead of raw stripeSubscriptionId
  hasActiveSubscription: boolean
}

const TIER_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  TRIAL: 'secondary',
  SOLO: 'default',
  SHOP: 'default',
  FARM: 'default',
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  trialing: 'secondary',
  active: 'default',
  past_due: 'destructive',
  canceled: 'outline',
  incomplete: 'destructive',
}

export function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  // #14: error state
  const [error, setError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscription')
      if (!res.ok) throw new Error('Failed to load subscription')
      const data = await res.json()
      setSubscription(data)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      // #14: set error state instead of (only) toasting
      setError('Could not load billing information.')
    } finally {
      setLoading(false)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to open portal')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Portal error:', err)
      toast({
        title: 'Could not open billing portal',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing &amp; Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-sm text-gray-500">
            Loading billing information...
          </div>
        </CardContent>
      </Card>
    )
  }

  // #14: error card with retry button
  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing &amp; Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={fetchSubscription}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return null
  }

  const usagePercent =
    subscription.printerLimit !== null
      ? Math.min(100, Math.round((subscription.printerCount / subscription.printerLimit) * 100))
      : 0

  // #17: use >= for consistency with SubscriptionGate
  const isOverLimit =
    subscription.printerLimit !== null && subscription.printerCount >= subscription.printerLimit

  const isTrial = subscription.tier === 'TRIAL'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing &amp; Subscription
        </CardTitle>
        <CardDescription>Manage your plan and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">Current Plan</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">{subscription.planName}</span>
              <Badge variant={TIER_BADGE_VARIANT[subscription.tier] ?? 'secondary'}>
                {subscription.tier}
              </Badge>
              <Badge variant={STATUS_BADGE_VARIANT[subscription.status] ?? 'secondary'}>
                {subscription.status}
              </Badge>
            </div>
          </div>
          {/* #12: use hasActiveSubscription instead of stripeSubscriptionId */}
          {!isTrial && subscription.hasActiveSubscription && (
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
              <ExternalLink className="h-4 w-4 mr-1" />
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </Button>
          )}
        </div>

        {/* Trial Warning */}
        {isTrial && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {subscription.trialDaysRemaining !== null && subscription.trialDaysRemaining > 0
                    ? `${subscription.trialDaysRemaining} day${subscription.trialDaysRemaining === 1 ? '' : 's'} remaining in your trial`
                    : 'Your trial has expired'}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Upgrade to a paid plan to continue using all features after your trial ends.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Notice */}
        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Your subscription will be cancelled on{' '}
              <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>.
              Reactivate it in the billing portal to continue.
            </p>
          </div>
        )}

        {/* Printer Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Printer className="h-4 w-4" />
              Printer Usage
            </div>
            <span className={`text-sm font-semibold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
              {subscription.printerCount} / {subscription.printerLimit === null ? 'Unlimited' : subscription.printerLimit}
            </span>
          </div>
          {subscription.printerLimit !== null && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${isOverLimit ? 'bg-red-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          {isOverLimit && (
            <p className="text-xs text-red-600">
              You have reached your plan&apos;s printer limit. Upgrade to add more printers.
            </p>
          )}
        </div>

        {/* Renewal Info */}
        {subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd && (
          <p className="text-xs text-gray-500">
            Next renewal: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        {/* Upgrade CTA */}
        {(isTrial || isOverLimit) && (
          <div className="pt-2">
            <Link href="/subscribe">
              <Button className="w-full">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                {isTrial ? 'Choose a Plan' : 'Upgrade Your Plan'}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
