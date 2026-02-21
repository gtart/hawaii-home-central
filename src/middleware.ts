import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // 1. Maintenance mode — highest precedence, blocks almost everything
  if (process.env.MAINTENANCE_MODE === 'true') {
    const exempt =
      path === '/maintenance' ||
      path.startsWith('/api/auth') ||       // NextAuth (admin sign-in)
      path.startsWith('/api/early-access') || // waitlist still works
      path.startsWith('/_next') ||
      path === '/login'                      // admin needs to reach login page

    // Admins with a session can reach /admin
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

  // 2. Auth gate — only for protected routes
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
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)',
  ],
}
