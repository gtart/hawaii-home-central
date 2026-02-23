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
    const timeout = setTimeout(() => controller.abort(), 6_000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HHCLinkPreview/1.0)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return NextResponse.json({})

    const html = await res.text()

    function extractMeta(property: string): string | undefined {
      // og: and name= variants
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${property.replace('og:', '')}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property.replace('og:', '')}["']`, 'i'),
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m?.[1]) return m[1].trim()
      }
      return undefined
    }

    function extractTitle(): string | undefined {
      const og = extractMeta('og:title')
      if (og) return og
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      return m?.[1]?.trim()
    }

    const title = extractTitle()
    const description = extractMeta('og:description') ?? extractMeta('description')
    const image = extractMeta('og:image')

    return NextResponse.json({
      title: title?.slice(0, 120),
      description: description?.slice(0, 200),
      image: image?.slice(0, 500),
    })
  } catch {
    // Timeout, CORS, network error — return empty gracefully
    return NextResponse.json({})
  }
}
