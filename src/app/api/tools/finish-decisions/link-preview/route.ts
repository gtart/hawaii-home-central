import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/** POST /api/tools/finish-decisions/link-preview
 *  Body: { url: string }
 *  Returns: { title?, description?, image? }
 *  Fetches the page server-side and extracts OG / basic meta tags.
 *  Returns empty object on any failure — non-critical enrichment only.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let url: string
  try {
    const body = await req.json()
    url = body.url
    if (!url || typeof url !== 'string') throw new Error('missing url')
    new URL(url) // validate
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Full browser-like headers — avoids Cloudflare / bot detection
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return NextResponse.json({})

    // Only parse the first ~200 KB — <head> tags are always near the top
    const raw = await res.text()
    const html = raw.slice(0, 200_000)

    /** Parse every <meta> tag into a property→content map */
    function parseMetaTags(src: string): Record<string, string> {
      const map: Record<string, string> = {}
      const tagRe = /<meta\s+([^>]*?)(?:\s*\/)?>/gi
      let tagMatch: RegExpExecArray | null
      while ((tagMatch = tagRe.exec(src)) !== null) {
        const attrs = tagMatch[1]
        // Extract property or name
        const keyMatch =
          attrs.match(/\bproperty\s*=\s*["']([^"']+)["']/i) ||
          attrs.match(/\bname\s*=\s*["']([^"']+)["']/i)
        const valMatch = attrs.match(/\bcontent\s*=\s*["']([^"']*)["']/i)
        if (keyMatch && valMatch) {
          const key = keyMatch[1].toLowerCase().trim()
          if (!(key in map)) map[key] = decodeEntities(valMatch[1].trim())
        }
      }
      return map
    }

    /** Decode common HTML entities in attribute values */
    function decodeEntities(s: string): string {
      return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&nbsp;/g, ' ')
    }

    /** Resolve a possibly-relative image URL against the page origin */
    function resolveUrl(src: string, base: string): string {
      try {
        return new URL(src, base).href
      } catch {
        return src
      }
    }

    const meta = parseMetaTags(html)

    const title =
      meta['og:title'] ||
      meta['twitter:title'] ||
      (() => {
        const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        return m ? decodeEntities(m[1].trim()) : undefined
      })()

    const description =
      meta['og:description'] ||
      meta['twitter:description'] ||
      meta['description']

    const rawImage =
      meta['og:image'] ||
      meta['og:image:url'] ||
      meta['twitter:image'] ||
      meta['twitter:image:src']

    const image = rawImage ? resolveUrl(rawImage, url) : undefined

    return NextResponse.json({
      title: title?.slice(0, 120),
      description: description?.slice(0, 200),
      image: image?.slice(0, 500),
    })
  } catch {
    // Timeout, network error, bot block — return empty gracefully
    return NextResponse.json({})
  }
}
