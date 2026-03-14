import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { put } from '@vercel/blob'
import sharp from 'sharp'

/**
 * POST /api/generate-thumbnail
 *
 * Accepts a Vercel Blob URL, fetches the image, generates a 400px JPEG
 * thumbnail, uploads it to Blob storage, and returns the thumbnail URL.
 *
 * Used after client-side uploads to generate thumbnails without passing
 * the full image through the serverless function body.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const { imageUrl, prefix } = await request.json()
  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
  }

  try {
    const res = await fetch(imageUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }

    const arrayBuffer = await res.arrayBuffer()
    const thumbBuffer = await sharp(Buffer.from(arrayBuffer))
      .resize({ width: 400, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer()

    const thumbPrefix = typeof prefix === 'string' ? prefix : 'uploads'
    const thumbPathname = `${thumbPrefix}/thumb_${Date.now()}.jpg`
    const thumbBlob = await put(thumbPathname, thumbBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
      token: blobToken,
    })

    return NextResponse.json({ thumbnailUrl: thumbBlob.url })
  } catch (err) {
    console.error('Thumbnail generation failed:', err)
    return NextResponse.json(
      { error: 'Thumbnail generation failed' },
      { status: 500 },
    )
  }
}
