import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Maintenance mode — highest precedence
  if (process.env.MAINTENANCE_MODE === 'true') {
    const exempt =
      path === '/maintenance' ||
      path.startsWith('/api/auth') ||
      path.startsWith('/api/early-access') ||
      path.startsWith('/_next') ||
      path === '/login'

    if (path.startsWith('/admin')) {
      const hasSession =
        req.cookies.has('__Secure-authjs.session-token') ||
        req.cookies.has('authjs.session-token')
      if (hasSession) return NextResponse.next()
    }

    if (!exempt) {
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  }

  // Auth gate — only for /app and /admin
  if (path.startsWith('/app') || path.startsWith('/admin')) {
    const hasSession =
      req.cookies.has('__Secure-authjs.session-token') ||
      req.cookies.has('authjs.session-token')

    if (!hasSession) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run middleware on protected routes — not on public pages
    '/app/:path*',
    '/admin/:path*',
  ],
}
