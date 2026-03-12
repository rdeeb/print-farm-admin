'use client'

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    id: 'solo',
    name: 'Solo',
    monthlyPrice: 19,
    annualPrice: 15,
    description: 'For independent makers running a small fleet.',
    printers: 'Up to 5 printers',
    features: [
      'Full order management',
      'BOM cost calculator',
      'Filament spool tracking',
      'Client portal',
      'Print queue management',
      'Basic analytics',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'shop',
    name: 'Shop',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'For growing shops ready to scale operations.',
    printers: 'Up to 20 printers',
    features: [
      'Everything in Solo',
      'Advanced analytics & reporting',
      'Multi-user access (up to 5)',
      'Priority support',
      'CSV & JSON data export',
      'Custom pricing templates',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'farm',
    name: 'Farm',
    monthlyPrice: 99,
    annualPrice: 79,
    description: 'For full-scale farms with no limits.',
    printers: 'Unlimited printers',
    features: [
      'Everything in Shop',
      'Unlimited team members',
      'Dedicated account manager',
      'SLA support',
      'Custom integrations',
      'White-label client portal',
      'Advanced cost modeling',
    ],
    popular: false,
  },
]

export function PricingSection() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section id="pricing" className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Start free. Upgrade when you need to. No hidden fees, no per-seat pricing on the lower tiers.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-1 bg-gray-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                interval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                interval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-md">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = interval === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const ctaUrl = `/subscribe?plan=${plan.id}&interval=${interval}`

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.popular
                    ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-105 border-2 border-indigo-500'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      ${price}
                    </span>
                    <span className={`text-sm mb-1.5 ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>
                      /mo{interval === 'annual' ? ', billed annually' : ''}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 font-medium ${plan.popular ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {plan.printers}
                  </p>
                </div>

                <Link
                  href={ctaUrl}
                  className={`w-full text-center py-3 px-4 rounded-xl font-semibold text-sm transition-colors mb-8 ${
                    plan.popular
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Start Free Trial
                </Link>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <svg
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-indigo-200' : 'text-green-500'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.popular ? 'text-indigo-100' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          All plans include a 14-day free trial. No credit card required to start.{' '}
          <Link href="#faq" className="text-indigo-600 hover:underline">
            See FAQ
          </Link>{' '}
          for details.
        </p>
      </div>
    </section>
  )
}
