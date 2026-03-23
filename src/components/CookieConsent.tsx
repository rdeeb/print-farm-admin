'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'printfleet_cookie_consent'

export type CookieConsent = 'essential' | 'analytics'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  function handleEssential() {
    localStorage.setItem(CONSENT_KEY, 'essential')
    setVisible(false)
  }

  function handleAnalytics() {
    localStorage.setItem(CONSENT_KEY, 'analytics')
    window.dispatchEvent(new Event('cookie-consent-analytics'))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300"
    >
      <div
        className="border-t"
        style={{
          background: '#fff',
          borderColor: '#e5e7eb',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: '#10231c' }}>
              We use cookies
            </p>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              Essential cookies keep the app working. Analytics cookies (Google Analytics) help us
              understand how people use PrintFleet — no personal data is sold.{' '}
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: '#254336' }}
              >
                Privacy policy
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleEssential}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
              style={{ color: '#374151', border: '1px solid #d1d5db' }}
            >
              Essential only
            </button>
            <button
              onClick={handleAnalytics}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: '#d96c42' }}
            >
              Allow analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
