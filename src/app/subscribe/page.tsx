'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Printer, Zap, Building2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

type BillingInterval = 'monthly' | 'annual'

interface Plan {
  tier: 'SOLO' | 'SHOP' | 'FARM'
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  printerLimit: string
  features: string[]
  icon: React.ComponentType<{ className?: string }>
  highlighted: boolean
}

const PLANS: Plan[] = [
  {
    tier: 'SOLO',
    name: 'Solo',
    description: 'Perfect for individual makers and hobbyists',
    monthlyPrice: 19,
    annualPrice: 15,
    printerLimit: 'Up to 5 printers',
    features: [
      'Up to 5 printers',
      'Order & queue management',
      'Filament inventory tracking',
      'Cost estimation',
      'Client management',
    ],
    icon: Printer,
    highlighted: false,
  },
  {
    tier: 'SHOP',
    name: 'Shop',
    description: 'For growing print shops and teams',
    monthlyPrice: 49,
    annualPrice: 39,
    printerLimit: 'Up to 20 printers',
    features: [
      'Up to 20 printers',
      'Everything in Solo',
      'Advanced analytics',
      'Multi-operator support',
      'Priority support',
    ],
    icon: Building2,
    highlighted: true,
  },
  {
    tier: 'FARM',
    name: 'Farm',
    description: 'Unlimited scale for large operations',
    monthlyPrice: 99,
    annualPrice: 79,
    printerLimit: 'Unlimited printers',
    features: [
      'Unlimited printers',
      'Everything in Shop',
      'Custom integrations',
      'Dedicated account manager',
      'SLA support',
    ],
    icon: Zap,
    highlighted: false,
  },
]

export default function SubscribePage() {
  const [interval, setInterval] = useState<BillingInterval>('monthly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  // #16: subscription status state
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()
  // #15: useToast instead of alert()
  const { toast } = useToast()

  // #16: Fetch subscription status on mount for authenticated users
  useEffect(() => {
    if (!session) {
      setSubscriptionLoading(false)
      return
    }

    fetch('/api/subscription')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.status) setSubscriptionStatus(data.status)
        if (data?.tier) setSubscriptionTier(data.tier)
      })
      .catch(() => {
        // Non-fatal — just show the plan picker
      })
      .finally(() => setSubscriptionLoading(false))
  }, [session])

  const handleSelectPlan = async (plan: Plan) => {
    if (!session) {
      // Redirect to sign-in, then come back
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent('/subscribe')}`)
      return
    }

    setLoadingTier(plan.tier)

    try {
      // POST to checkout with tier + interval; the server resolves the Stripe price ID
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: plan.tier,
          interval,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create checkout session')
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      // #15: useToast instead of alert()
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoadingTier(null)
    }
  }

  // #16: Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  // #16: If user already has an active subscription, show a message instead of the plan picker
  if (session && subscriptionTier !== null && subscriptionTier !== 'TRIAL') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="rounded-full bg-green-100 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You already have an active subscription</h2>
          <p className="text-gray-600 mb-6">
            Your account is already on a paid plan. You can manage your billing details from your settings.
          </p>
          <Link href="/settings">
            <Button>Go to Settings</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose the right plan for your farm
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Upgrade or cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8 gap-4">
            <span className={`text-sm font-medium ${interval === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setInterval(prev => prev === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${interval === 'annual' ? 'bg-indigo-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={interval === 'annual'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${interval === 'annual' ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-medium ${interval === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <Badge variant="secondary" className="ml-2 text-xs">Save up to 21%</Badge>
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const price = interval === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const isLoading = loadingTier === plan.tier

            return (
              <Card
                key={plan.tier}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? 'border-indigo-600 shadow-lg ring-2 ring-indigo-600'
                    : 'border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${plan.highlighted ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                      <Icon className={`h-6 w-6 ${plan.highlighted ? 'text-indigo-600' : 'text-gray-600'}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">${price}</span>
                    <span className="text-gray-500 text-sm ml-1">/mo</span>
                    {interval === 'annual' && (
                      <p className="text-xs text-gray-500 mt-1">Billed annually (${price * 12}/yr)</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm font-medium text-gray-700 mb-3">{plan.printerLimit}</p>
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.highlighted ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? 'Redirecting...'
                      : session
                        ? 'Get Started'
                        : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-500 mt-10">
          All plans include a 14-day free trial. Cancel anytime. Prices in USD.
        </p>
      </div>
    </div>
  )
}
