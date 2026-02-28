import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import dns from 'node:dns/promises'

// ---------------------------------------------------------------------------
// SSRF protection helpers
// ---------------------------------------------------------------------------

function parseIPv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map(Number)
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null
  return octets as [number, number, number, number]
}

function isBlockedIPv4(
  [a, b, , ]: [number, number, number, number],
  allowLocalhost: boolean
): boolean {
  // Always block: link-local / cloud metadata (169.254.0.0/16)
  if (a === 169 && b === 254) return true
  // Always block: 0.0.0.0
  if (a === 0) return true
  // Localhost 127.0.0.0/8
  if (a === 127) return !allowLocalhost
  // Private ranges — always blocked
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

function isBlockedIp(ip: string, allowLocalhost: boolean): boolean {
  if (ip === '::') return true
  if (ip === '::1') return !allowLocalhost
  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (ip.startsWith('::ffff:')) {
    const octets = parseIPv4(ip.slice(7))
    if (octets) return isBlockedIPv4(octets, allowLocalhost)
    return true
  }
  // fe80::/10 link-local IPv6
  if (ip.toLowerCase().startsWith('fe80')) return true
  // fc00::/7 unique-local IPv6
  const first = ip.toLowerCase().split(':')[0]
  if (first && (first.startsWith('fc') || first.startsWith('fd'))) return true

  const octets = parseIPv4(ip)
  if (octets) return isBlockedIPv4(octets, allowLocalhost)

  return true // unknown format → block
}

async function checkSsrf(hostname: string, allowLocalhost: boolean): Promise<string | null> {
  // Raw IPv4 literal
  if (parseIPv4(hostname)) {
    return isBlockedIp(hostname, allowLocalhost) ? 'Blocked by SSRF protection' : null
  }

  // Raw IPv6 literal (brackets stripped by URL parser)
  const bare = hostname.replace(/^\[|\]$/g, '')
  if (bare.includes(':')) {
    return isBlockedIp(bare, allowLocalhost) ? 'Blocked by SSRF protection' : null
  }

  // Hostname → resolve DNS and check every IP
  const ips: string[] = []
  try { ips.push(...await dns.resolve4(hostname)) } catch { /* no A record */ }
  try { ips.push(...await dns.resolve6(hostname)) } catch { /* no AAAA record */ }

  if (ips.length === 0) return 'DNS resolution failed'

  for (const ip of ips) {
    if (isBlockedIp(ip, allowLocalhost)) return 'Blocked by SSRF protection'
  }
  return null
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

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
  const allowLocalhost = process.env.ALLOW_IMAGE_PROXY_LOCALHOST === 'true'
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
