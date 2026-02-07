import { auth } from '@/auth'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/app')) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/app/:path*'],
}
