'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'How long is the free trial?',
    answer:
      '14 days. You get full access to all features of the plan you choose during the trial — no artificial restrictions. At the end of the trial, you can subscribe to continue or your account will be paused (your data stays safe).',
  },
  {
    question: 'Do I need a credit card to start the free trial?',
    answer:
      'No. You can start your 14-day free trial with just your email address. We only ask for payment information when you decide to subscribe.',
  },
  {
    question: 'Can I upgrade or downgrade my plan later?',
    answer:
      'Yes, at any time. Upgrades take effect immediately and you\'re only charged the prorated difference. Downgrades take effect at the start of your next billing cycle.',
  },
  {
    question: 'Can I export my data if I decide to leave?',
    answer:
      'Absolutely. You own your data. Shop and Farm plans include CSV and JSON data export for all orders, jobs, clients, and cost records. Solo plan includes CSV export for orders.',
  },
  {
    question: 'Does PrintFleet support multiple users?',
    answer:
      'Yes. The Shop plan supports up to 5 team members with role-based access (Admin, Operator, Viewer). The Farm plan supports unlimited team members. The Solo plan is designed for a single user.',
  },
  {
    question: 'What printer types are supported?',
    answer:
      'We support any printer you can add manually, plus native integrations with Bambu Lab and Klipper-based printers. Prusa Connect and Creality Cloud integrations are on the roadmap. If your printer can push status data, we can connect to it.',
  },
  {
    question: 'Is my client data kept private?',
    answer:
      'Yes. Each account is fully isolated — your clients, orders, and cost data are never shared across accounts. We use industry-standard encryption at rest and in transit. See our Privacy Policy for full details.',
  },
  {
    question: 'What happens when I exceed my printer limit?',
    answer:
      'You\'ll be notified when you approach your plan\'s printer limit. You can upgrade to the next plan at any time to add more printers. We won\'t disable your account without warning.',
  },
]

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-900 pr-8">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="py-20 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-gray-500">
            Everything you need to know before you start.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <FaqItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="mt-10 text-center p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
          <p className="text-gray-700 mb-2 font-medium">Still have questions?</p>
          <p className="text-gray-500 text-sm">
            Email us at{' '}
            <a href="mailto:hello@printfleet.app" className="text-indigo-600 hover:underline">
              hello@printfleet.app
            </a>
            {' '}— we reply within one business day.
          </p>
        </div>
      </div>
    </section>
  )
}
