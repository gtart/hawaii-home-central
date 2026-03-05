import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'
import { checkSsrf } from '@/lib/ssrf'
import { fetchLinkPreview } from '@/lib/linkPreview'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'
import { put } from '@vercel/blob'
import sharp from 'sharp'

const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB
const IMAGE_FETCH_TIMEOUT = 15_000
const HEAD_TIMEOUT = 8_000

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

// ---------------------------------------------------------------------------
// POST /api/captured-items
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  let body: {
    url?: string
    note?: string
    suggestedToolKey?: string
    suggestedCollectionId?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { url, note, suggestedToolKey, suggestedCollectionId } = body

  // --- Note-only capture ---
  if (!url && note) {
    const item = await prisma.capturedItem.create({
      data: {
        projectId,
        type: 'NOTE',
        sourceUrl: null,
        note: note.slice(0, 2000),
        suggestedToolKey: suggestedToolKey ?? null,
        suggestedCollectionId: suggestedCollectionId ?? null,
        capturedByUserId: userId,
      },
    })

    writeActivityEvents([{
      projectId,
      toolKey: 'inbox',
      action: 'captured',
      summaryText: `Captured note: "${note.slice(0, 40).trim()}${note.length > 40 ? '…' : ''}"`,
      actorUserId: userId,
    }]).catch(() => {})

    return NextResponse.json(item, { status: 201 })
  }

  // --- URL capture ---
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL or note is required' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol')
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // SSRF check
  const allowLocalhost =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_IMAGE_PROXY_LOCALHOST === 'true'
  const ssrfError = await checkSsrf(parsed.hostname, allowLocalhost)
  if (ssrfError) {
    return NextResponse.json({ error: ssrfError }, { status: 403 })
  }

  // Detect content type via HEAD (fall back to GET if HEAD fails)
  let contentType: string | null = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEAD_TIMEOUT)
    const headRes = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    })
    clearTimeout(timeout)
    contentType = headRes.headers.get('content-type')
  } catch {
    // HEAD failed — try GET with range header
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), HEAD_TIMEOUT)
      const getRes = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Range: 'bytes=0-0',
        },
      })
      clearTimeout(timeout)
      contentType = getRes.headers.get('content-type')
    } catch {
      // Both failed — treat as page
    }
  }

  const isImage = contentType?.startsWith('image/') ?? false

  if (isImage) {
    return handleImageCapture({
      url,
      projectId,
      userId,
      allowLocalhost,
      suggestedToolKey: suggestedToolKey ?? null,
      suggestedCollectionId: suggestedCollectionId ?? null,
      note: note ?? null,
    })
  } else {
    return handlePageCapture({
      url,
      projectId,
      userId,
      suggestedToolKey: suggestedToolKey ?? null,
      suggestedCollectionId: suggestedCollectionId ?? null,
      note: note ?? null,
    })
  }
}

// ---------------------------------------------------------------------------
// Image capture
// ---------------------------------------------------------------------------

async function handleImageCapture(opts: {
  url: string
  projectId: string
  userId: string
  allowLocalhost: boolean
  suggestedToolKey: string | null
  suggestedCollectionId: string | null
  note: string | null
}) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json(
      { error: 'File storage is not configured.' },
      { status: 500 }
    )
  }

  // Fetch the full image
  let imageBuffer: Buffer
  let finalContentType: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT)
    const res = await fetch(opts.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: `${new URL(opts.url).protocol}//${new URL(opts.url).hostname}/`,
      },
    })
    clearTimeout(timeout)

    // SSRF re-check on final URL after redirects
    const finalUrl = new URL(res.url)
    const redirectSsrf = await checkSsrf(finalUrl.hostname, opts.allowLocalhost)
    if (redirectSsrf) {
      return NextResponse.json({ error: redirectSsrf }, { status: 403 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
    }

    finalContentType = res.headers.get('content-type') || 'image/jpeg'
    if (!finalContentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL did not return an image' }, { status: 415 })
    }

    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large (max 20MB)' }, { status: 413 })
    }
    imageBuffer = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: 'Failed to download image' }, { status: 502 })
  }

  // Upload to Vercel Blob
  const ext = MIME_TO_EXT[finalContentType.split(';')[0]] || 'jpg'
  const pathname = `captured-items/${opts.projectId}/${Date.now()}-capture.${ext}`

  try {
    const blob = await put(pathname, imageBuffer, {
      access: 'public',
      contentType: finalContentType,
      token: blobToken,
    })

    // Generate thumbnail
    let thumbnailUrl: string = blob.url
    try {
      const thumbBuffer = await sharp(imageBuffer)
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer()

      const thumbPathname = `captured-items/${opts.projectId}/${Date.now()}-thumb.jpg`
      const thumbBlob = await put(thumbPathname, thumbBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
        token: blobToken,
      })
      thumbnailUrl = thumbBlob.url
    } catch (thumbErr) {
      console.error('Thumbnail generation failed (using original):', thumbErr)
    }

    const item = await prisma.capturedItem.create({
      data: {
        projectId: opts.projectId,
        type: 'IMAGE',
        sourceUrl: opts.url,
        imageUrl: blob.url,
        thumbnailUrl,
        originalImageUrl: opts.url,
        note: opts.note?.slice(0, 2000) ?? null,
        suggestedToolKey: opts.suggestedToolKey,
        suggestedCollectionId: opts.suggestedCollectionId,
        capturedByUserId: opts.userId,
      },
    })

    writeActivityEvents([{
      projectId: opts.projectId,
      toolKey: 'inbox',
      action: 'captured',
      summaryText: `Captured image from ${hostnameFromUrl(opts.url)}`,
      actorUserId: opts.userId,
    }]).catch(() => {})

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('Image capture upload failed:', err)
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Page capture
// ---------------------------------------------------------------------------

async function handlePageCapture(opts: {
  url: string
  projectId: string
  userId: string
  suggestedToolKey: string | null
  suggestedCollectionId: string | null
  note: string | null
}) {
  const preview = await fetchLinkPreview(opts.url)

  const item = await prisma.capturedItem.create({
    data: {
      projectId: opts.projectId,
      type: 'PAGE',
      sourceUrl: opts.url,
      title: preview.title?.slice(0, 200) ?? null,
      description: preview.description?.slice(0, 500) ?? null,
      siteName: preview.siteName?.slice(0, 100) ?? null,
      originalImageUrl: preview.primaryImage ?? null,
      note: opts.note?.slice(0, 2000) ?? null,
      suggestedToolKey: opts.suggestedToolKey,
      suggestedCollectionId: opts.suggestedCollectionId,
      capturedByUserId: opts.userId,
    },
  })

  const summaryTitle = preview.title || hostnameFromUrl(opts.url)
  writeActivityEvents([{
    projectId: opts.projectId,
    toolKey: 'inbox',
    action: 'captured',
    summaryText: `Captured page: ${summaryTitle}`,
    actorUserId: opts.userId,
  }]).catch(() => {})

  return NextResponse.json(item, { status: 201 })
}

// ---------------------------------------------------------------------------
// GET /api/captured-items
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as 'UNSORTED' | 'SORTED' | 'DISMISSED' | null
  const type = url.searchParams.get('type') as 'IMAGE' | 'PAGE' | 'NOTE' | null
  const limitParam = parseInt(url.searchParams.get('limit') || '20', 10)
  const limit = Math.min(Math.max(limitParam, 1), 50)
  const cursor = url.searchParams.get('cursor')

  // Composite cursor: "createdAtISO__id"
  let cursorWhere = {}
  if (cursor) {
    const sepIdx = cursor.indexOf('__')
    if (sepIdx !== -1) {
      const cursorCreatedAt = new Date(cursor.slice(0, sepIdx))
      const cursorId = cursor.slice(sepIdx + 2)
      cursorWhere = {
        OR: [
          { createdAt: { lt: cursorCreatedAt } },
          { createdAt: cursorCreatedAt, id: { lt: cursorId } },
        ],
      }
    } else {
      cursorWhere = { createdAt: { lt: new Date(cursor) } }
    }
  }

  const items = await prisma.capturedItem.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...cursorWhere,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })

  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const lastItem = page[page.length - 1]
  const nextCursor = hasMore && lastItem
    ? `${lastItem.createdAt.toISOString()}__${lastItem.id}`
    : null

  return NextResponse.json({ items: page, nextCursor })
}
