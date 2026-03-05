import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'
import { put } from '@vercel/blob'
import sharp from 'sharp'

const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
])
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
])
const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif',
}
const MAX_SIZE = 20 * 1024 * 1024

function getFileExt(name: string): string | undefined {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0]
}

function isImageFile(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type)) return true
  const ext = getFileExt(file.name)
  if (ext && IMAGE_EXTENSIONS.has(ext)) return true
  return false
}

function resolveContentType(file: File): string {
  if (file.type && IMAGE_TYPES.has(file.type)) return file.type
  const ext = getFileExt(file.name)
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext]
  return 'image/jpeg'
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json({ error: 'File storage not configured' }, { status: 500 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const suggestedToolKey = formData.get('suggestedToolKey') as string | null
  const suggestedCollectionId = formData.get('suggestedCollectionId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  }
  if (!isImageFile(file)) {
    return NextResponse.json({ error: 'Only image files are supported' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  const contentType = resolveContentType(file)
  const pathname = `captured-items/${projectId}/${Date.now()}-${file.name}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType,
      token: blobToken,
    })

    let thumbnailUrl = blob.url
    try {
      const arrayBuffer = await file.arrayBuffer()
      const thumbBuffer = await sharp(Buffer.from(arrayBuffer))
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer()

      const thumbPathname = `captured-items/${projectId}/${Date.now()}-thumb.jpg`
      const thumbBlob = await put(thumbPathname, thumbBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
        token: blobToken,
      })
      thumbnailUrl = thumbBlob.url
    } catch (thumbErr) {
      console.error('Thumbnail generation failed:', thumbErr)
    }

    const item = await prisma.capturedItem.create({
      data: {
        projectId,
        type: 'IMAGE',
        sourceUrl: null,
        imageUrl: blob.url,
        thumbnailUrl,
        originalImageUrl: null,
        title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        suggestedToolKey: suggestedToolKey ?? null,
        suggestedCollectionId: suggestedCollectionId ?? null,
        capturedByUserId: userId,
      },
    })

    writeActivityEvents([{
      projectId,
      toolKey: 'inbox',
      action: 'captured',
      summaryText: `Captured photo: ${file.name}`,
      actorUserId: userId,
    }]).catch(() => {})

    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    console.error('Capture upload failed:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
