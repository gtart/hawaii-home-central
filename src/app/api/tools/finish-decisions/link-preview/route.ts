import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { fetchLinkPreview } from '@/lib/linkPreview'

/** POST /api/tools/finish-decisions/link-preview
 *  Body: { url: string }
 *  Returns: { title?, description?, image?, canonicalUrl?, siteName?,
 *             primaryImage?, images?: CandidateImage[] }
 *  Fetches the page server-side and extracts OG / meta tags + candidate images.
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

  const result = await fetchLinkPreview(url)

  return NextResponse.json({
    title: result.title,
    description: result.description,
    image: result.primaryImage, // backward-compat
    canonicalUrl: result.canonicalUrl,
    siteName: result.siteName,
    primaryImage: result.primaryImage,
    images: result.images,
  })
}
