import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Protect API routes
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/auth/')) {
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
          pathname.startsWith('/api/auth/')
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