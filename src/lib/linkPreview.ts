// ---------------------------------------------------------------------------
// Link preview extraction helpers
// ---------------------------------------------------------------------------

export interface CandidateImage {
  url: string
  label?: string
}

export interface LinkPreviewResult {
  title?: string
  description?: string
  canonicalUrl?: string
  siteName?: string
  primaryImage?: string
  images: CandidateImage[]
}

// ---------------------------------------------------------------------------
// HTML parsing helpers
// ---------------------------------------------------------------------------

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

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href
  } catch {
    return src
  }
}

function parseMetaTags(src: string): Record<string, string> {
  const map: Record<string, string> = {}
  const tagRe = /<meta\s+([^>]*?)(?:\s*\/)?>/gi
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = tagRe.exec(src)) !== null) {
    const attrs = tagMatch[1]
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

function extractCanonicalLink(html: string): string | undefined {
  const m = html.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']+)["']/i)
  return m ? decodeEntities(m[1].trim()) : undefined
}

function extractCandidateImages(
  html: string,
  baseUrl: string,
  primaryImage?: string,
): CandidateImage[] {
  const MAX = 12
  const seen = new Set<string>()
  const results: CandidateImage[] = []

  if (primaryImage) {
    seen.add(primaryImage)
    results.push({ url: primaryImage, label: 'Primary (OG image)' })
  }

  const imgRe = /<img\s+([^>]*?)(?:\s*\/)?>/gi
  let match: RegExpExecArray | null
  while ((match = imgRe.exec(html)) !== null && results.length < MAX) {
    const attrs = match[1]

    const srcMatch =
      attrs.match(/\bdata-src\s*=\s*["']([^"']+)["']/i) ||
      attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
    if (!srcMatch) continue

    const rawSrc = decodeEntities(srcMatch[1].trim())

    if (rawSrc.startsWith('data:')) continue
    if (/\.svg(\?|$)/i.test(rawSrc)) continue
    if (/\b(icon|sprite|logo|badge|pixel|spacer|blank|1x1)\b/i.test(rawSrc)) continue

    const wMatch = attrs.match(/\bwidth\s*=\s*["']?(\d+)/i)
    const hMatch = attrs.match(/\bheight\s*=\s*["']?(\d+)/i)
    if (wMatch && parseInt(wMatch[1]) < 50) continue
    if (hMatch && parseInt(hMatch[1]) < 50) continue

    const resolved = resolveUrl(rawSrc, baseUrl)
    if (seen.has(resolved)) continue
    seen.add(resolved)

    const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i)
    const titleMatch = attrs.match(/\btitle\s*=\s*["']([^"']*)["']/i)
    let label = altMatch ? decodeEntities(altMatch[1].trim()) : ''
    if (!label && titleMatch) label = decodeEntities(titleMatch[1].trim())
    if (!label) {
      try {
        const pathname = new URL(resolved).pathname
        const filename = pathname.split('/').pop() || ''
        label = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 60)
      } catch { /* ignore */ }
    }

    results.push({
      url: resolved.slice(0, 500),
      label: label?.slice(0, 80) || undefined,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Main fetch + extract function
// ---------------------------------------------------------------------------

export async function fetchLinkPreview(url: string): Promise<LinkPreviewResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)

  try {
    const parsed = new URL(url)
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
      },
    })

    if (!res.ok) return { images: [] }

    const raw = await res.text()
    const html = raw.slice(0, 200_000)

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

    const canonicalUrl = meta['og:url'] || extractCanonicalLink(html)
    const siteName = meta['og:site_name']

    const rawImage =
      meta['og:image'] ||
      meta['og:image:url'] ||
      meta['twitter:image'] ||
      meta['twitter:image:src']
    const primaryImage = rawImage ? resolveUrl(rawImage, url) : undefined

    const candidateImages = extractCandidateImages(html, url, primaryImage)

    return {
      title: title?.slice(0, 120),
      description: description?.slice(0, 200),
      canonicalUrl: canonicalUrl?.slice(0, 500),
      siteName: siteName?.slice(0, 80),
      primaryImage: primaryImage?.slice(0, 500),
      images: candidateImages,
    }
  } catch {
    return { images: [] }
  } finally {
    clearTimeout(timeout)
  }
}
