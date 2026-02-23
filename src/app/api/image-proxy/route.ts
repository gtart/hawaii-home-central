import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * GET /api/image-proxy?url=<encoded-image-url>
 *
 * Proxies external images through our server so:
 * - Hotlink-protected CDNs don't block the browser request
 * - We send a proper Referer header that CDNs expect
 * - CORS restrictions on the image origin don't affect the client
 *
 * Requires auth to prevent open-proxy abuse.
 * Responses are cached by the browser/CDN for 24 hours.
 */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url param', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(imageUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return new NextResponse('Upstream fetch failed', { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'

    // Only proxy actual images
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 415 })
    }

    const data = await res.arrayBuffer()

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Proxy error', { status: 502 })
  }
}
