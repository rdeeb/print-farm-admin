'use client'

import { useState } from 'react'

const SURVEY_QUESTIONS = [
  {
    field: 'printerCountAndMonitoring' as const,
    label: 'How many printers are you running today, and how do you currently monitor them?',
    placeholder: 'e.g. 8 printers, I check manually or use OctoPrint...',
  },
  {
    field: 'biggestProblem' as const,
    label: 'What is the most expensive or frustrating problem you experience when running multiple printers?',
    placeholder: 'e.g. Failed prints I don\'t catch in time, losing track of filament costs...',
  },
  {
    field: 'toolsTried' as const,
    label: 'Have you tried any tools to solve this problem?',
    placeholder: 'e.g. Spreadsheets, OrcaSlicer, Obico... what did you like or dislike?',
  },
  {
    field: 'doublePrintersBreak' as const,
    label: 'What would break in your operation if you doubled the number of printers tomorrow?',
    placeholder: 'e.g. I couldn\'t track jobs, order management would collapse...',
  },
  {
    field: 'worthPerMonth' as const,
    label: 'If a tool solved that problem for you, what would it be worth per month?',
    placeholder: 'e.g. $50/mo, $100/mo...',
  },
]

type SurveyFields = {
  printerCountAndMonitoring: string
  biggestProblem: string
  toolsTried: string
  doublePrintersBreak: string
  worthPerMonth: string
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export function PreRegistrationSection() {
  const [email, setEmail] = useState('')
  const [wantsSurvey, setWantsSurvey] = useState(false)
  const [survey, setSurvey] = useState<SurveyFields>({
    printerCountAndMonitoring: '',
    biggestProblem: '',
    toolsTried: '',
    doublePrintersBreak: '',
    worthPerMonth: '',
  })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [discountCode, setDiscountCode] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitState('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/wishlist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          ...(wantsSurvey ? survey : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error?.message ?? 'Something went wrong. Please try again.')
        setSubmitState('error')
        return
      }

      setDiscountCode(data.data?.discountCode ?? null)
      setSubmitState('success')
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <section id="early-access" className="py-20 px-4 bg-indigo-50">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re on the list!</h2>
          <p className="text-gray-600 mb-6">
            We&apos;ll reach out as soon as we launch. Thanks for your interest in 3D Farm Admin.
          </p>
          {discountCode && (
            <div className="bg-white border border-green-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm font-medium text-green-700 mb-2">
                Your 25% first-year discount code
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                  {discountCode}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(discountCode)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Copy code"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Save this code — you&apos;ll apply it at checkout when we launch. Valid for 25% off your first year.
              </p>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section id="early-access" className="py-20 px-4 bg-indigo-50">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Launching soon
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Be the first to know when we launch
          </h2>
          <p className="text-lg text-gray-500">
            Join the waitlist and we&apos;ll notify you the moment 3D Farm Admin is ready.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Your email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Survey opt-in */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={wantsSurvey}
                onChange={(e) => setWantsSurvey(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center">
                {wantsSurvey && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                I&apos;m happy to answer a few quick questions
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Answer 5 short questions and get{' '}
                <span className="font-semibold text-green-600">25% off your first year</span>{' '}
                when we launch.
              </p>
            </div>
          </label>

          {/* Survey questions */}
          {wantsSurvey && (
            <div className="space-y-5 border-t border-gray-100 pt-5">
              {SURVEY_QUESTIONS.map((q, i) => (
                <div key={q.field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="text-indigo-500 font-semibold mr-1">{i + 1}.</span>
                    {q.label}
                  </label>
                  <textarea
                    rows={2}
                    value={survey[q.field]}
                    onChange={(e) => setSurvey((prev) => ({ ...prev, [q.field]: e.target.value }))}
                    placeholder={q.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {submitState === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              {errorMessage}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitState === 'loading'}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
          >
            {submitState === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </span>
            ) : wantsSurvey ? (
              'Join the Waitlist & Claim My Discount'
            ) : (
              'Join the Waitlist'
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            No spam. We&apos;ll only email you when we launch.
          </p>
        </form>
      </div>
    </section>
  )
}
