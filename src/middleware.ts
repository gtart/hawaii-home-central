import { auth } from '@/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const needsAuth = pathname.startsWith('/app') || pathname.startsWith('/admin')

  if (!req.auth && needsAuth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
