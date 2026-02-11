import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Temporarily allow all requests through for auth debugging
  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
