import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkSsrf } from '@/lib/ssrf'

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

  // SSRF protection: block private/reserved IPs
  const allowLocalhost =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_IMAGE_PROXY_LOCALHOST === 'true'
  const ssrfError = await checkSsrf(parsed.hostname, allowLocalhost)
  if (ssrfError) {
    return NextResponse.json({ error: ssrfError }, { status: 403 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timeout)

    // SSRF check on the final URL after redirects
    const finalUrl = new URL(res.url)
    const redirectSsrf = await checkSsrf(finalUrl.hostname, allowLocalhost)
    if (redirectSsrf) {
      return NextResponse.json({ error: redirectSsrf }, { status: 403 })
    }

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
