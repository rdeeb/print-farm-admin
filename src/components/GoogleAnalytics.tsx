'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const GA_ID = 'G-83EBJ2902K'
const CONSENT_KEY = 'printfleet_cookie_consent'

export function GoogleAnalytics() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    // Check existing consent on mount
    if (localStorage.getItem(CONSENT_KEY) === 'analytics') {
      setAnalyticsEnabled(true)
    }

    // Listen for consent granted during this session
    function onConsent() {
      setAnalyticsEnabled(true)
    }
    window.addEventListener('cookie-consent-analytics', onConsent)
    return () => window.removeEventListener('cookie-consent-analytics', onConsent)
  }, [])

  if (!analyticsEnabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
