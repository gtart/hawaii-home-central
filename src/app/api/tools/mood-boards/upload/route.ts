import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'
import { put } from '@vercel/blob'
import sharp from 'sharp'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
])

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
}

function getFileExt(name: string): string | undefined {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0]
}

function isAllowedFile(file: File): boolean {
  if (file.type && ALLOWED_TYPES.has(file.type)) return true
  const ext = getFileExt(file.name)
  if (ext && ALLOWED_EXTENSIONS.has(ext)) return true
  return false
}

function resolveContentType(file: File): string {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type
  const ext = getFileExt(file.name)
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext]
  return 'application/octet-stream'
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json(
      { error: 'Photo upload is not configured. Please contact support.' },
      { status: 500 }
    )
  }

  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  const access = await resolveToolAccess(userId, projectId, 'mood_boards')
  if (!access || access === 'VIEW') {
    return NextResponse.json({ error: 'No edit access' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file received — please try again.' }, { status: 400 })
  }

  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { error: `Invalid file type "${file.type || 'unknown'}". Allowed: JPEG, PNG, WebP, HEIC` },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Max 10MB' },
      { status: 400 }
    )
  }

  const contentType = resolveContentType(file)
  const pathname = `mood-boards/${projectId}/${Date.now()}-${file.name}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType,
      token: blobToken,
    })

    const id = `mb_img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    // Generate a 400px-wide JPEG thumbnail for fast grid loading
    let thumbnailUrl = blob.url
    try {
      const arrayBuffer = await file.arrayBuffer()
      const thumbBuffer = await sharp(Buffer.from(arrayBuffer))
        .resize({ width: 400, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer()

      const thumbPathname = `mood-boards/${projectId}/thumb_${Date.now()}-${file.name.replace(/\.[^.]+$/, '.jpg')}`
      const thumbBlob = await put(thumbPathname, thumbBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
        token: blobToken,
      })
      thumbnailUrl = thumbBlob.url
    } catch (thumbErr) {
      console.error('Thumbnail generation failed (using original):', thumbErr)
    }

    return NextResponse.json({ url: blob.url, thumbnailUrl, id }, { status: 201 })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('Blob upload failed:', { fileName: file.name, errMsg, err })
    return NextResponse.json(
      { error: 'Storage upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
