'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'

interface SubscriptionData {
  tier: 'TRIAL' | 'SOLO' | 'SHOP' | 'FARM'
  status: string
  planName: string
  printerLimit: number | null
  printerCount: number
}

interface SubscriptionGateProps {
  /** The content to render when within plan limits */
  children: React.ReactNode
  /**
   * If provided, overrides the fetched printer count for gate evaluation.
   * Useful when the parent already knows the count.
   */
  printerCount?: number
}

/**
 * SubscriptionGate wraps content that should be gated behind printer-limit enforcement.
 * When the tenant's active printer count exceeds the plan limit, an upgrade prompt is
 * shown instead of (or alongside) the children.
 *
 * Usage:
 *   <SubscriptionGate>
 *     <AddPrinterButton />
 *   </SubscriptionGate>
 */
export function SubscriptionGate({ children, printerCount: propPrinterCount }: SubscriptionGateProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/subscription')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSubscription(data)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return null
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">Unable to verify subscription. Please refresh the page.</div>
    )
  }

  if (!subscription) {
    return <>{children}</>
  }

  const effectivePrinterCount =
    propPrinterCount !== undefined ? propPrinterCount : subscription.printerCount

  // FARM has null printerLimit (unlimited) — never block
  const isOverLimit =
    subscription.printerLimit !== null &&
    effectivePrinterCount >= subscription.printerLimit

  if (!isOverLimit) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <Card className="border-amber-200 bg-amber-50 mt-4">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Printer limit reached ({effectivePrinterCount} / {subscription.printerLimit})
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Your <strong>{subscription.planName}</strong> plan allows up to{' '}
                {subscription.printerLimit} printer{subscription.printerLimit === 1 ? '' : 's'}.
                Upgrade your plan to add more printers.
              </p>
              <Link href="/subscribe" className="mt-3 inline-block">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
