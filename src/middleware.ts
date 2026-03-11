import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Routes that must never be blocked by subscription checks
const SUBSCRIPTION_EXEMPT_PREFIXES = [
  '/subscribe',
  '/auth',
  '/api/auth/',
  '/api/stripe/webhook',
]

function isSubscriptionExempt(pathname: string): boolean {
  return SUBSCRIPTION_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Protect API routes
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/stripe/webhook')) {
        return NextResponse.next()
      }

      if (!token) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        const url = req.nextUrl.clone()
        url.pathname = '/auth/signin'
        url.search = `callbackUrl=${encodeURIComponent(pathname)}`
        return NextResponse.redirect(url)
      }
    }

    // Role-based access control for admin routes
    if (pathname.startsWith('/dashboard/admin')) {
      if (token?.role !== 'ADMIN') {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    // Subscription / trial expiry check for protected page routes (T-F5-8)
    // Only run for authenticated users on non-exempt, non-API routes
    if (
      token &&
      !pathname.startsWith('/api/') &&
      !isSubscriptionExempt(pathname)
    ) {
      try {
        // Call the internal subscription API — avoids Prisma in Edge runtime
        const subscriptionUrl = new URL('/api/subscription', req.nextUrl.origin)
        const subscriptionRes = await fetch(subscriptionUrl.toString(), {
          headers: {
            // Forward the session cookie so the API route authenticates correctly
            cookie: req.headers.get('cookie') ?? '',
          },
        })

        if (subscriptionRes.ok) {
          const sub = await subscriptionRes.json()

          const status: string = sub.status ?? ''
          const trialEndsAt: string | null = sub.trialEndsAt ?? null
          const printerLimit: number | null = sub.printerLimit ?? null

          // Build redirect URL helper
          const redirectToSubscribe = (reason: string) => {
            const url = req.nextUrl.clone()
            url.pathname = '/subscribe'
            url.search = `reason=${reason}`
            return NextResponse.redirect(url)
          }

          // Trial expired
          if (status === 'trialing' && trialEndsAt !== null) {
            const trialEnd = new Date(trialEndsAt)
            if (trialEnd < new Date()) {
              return redirectToSubscribe('trial_expired')
            }
          }

          // Past due or canceled
          if (status === 'past_due' || status === 'canceled') {
            return redirectToSubscribe('payment_required')
          }

          // Attach printer limit header to the response
          const response = NextResponse.next()
          if (printerLimit !== null) {
            response.headers.set('x-printer-limit', String(printerLimit))
          } else {
            // null means unlimited (FARM tier)
            response.headers.set('x-printer-limit', 'unlimited')
          }
          return response
        }
      } catch {
        // If the subscription check fails (e.g. network error during SSR),
        // allow the request through rather than blocking all access
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow public routes
        if (
          pathname.startsWith('/auth/') ||
          pathname === '/' ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/subscribe')
        ) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}
