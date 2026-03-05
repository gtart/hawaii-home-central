import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'
import { put } from '@vercel/blob'
import sharp from 'sharp'

// Images
const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
])
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
])
const IMAGE_EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif',
}

// Documents
const DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/rtf',
])
const DOC_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf',
])
const DOC_EXT_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain', '.csv': 'text/csv', '.rtf': 'application/rtf',
}

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

function getFileExt(name: string): string | undefined {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0]
}

function isAllowedFile(file: File): boolean {
  if (file.type && (IMAGE_TYPES.has(file.type) || DOC_TYPES.has(file.type))) return true
  const ext = getFileExt(file.name)
  if (ext && (IMAGE_EXTENSIONS.has(ext) || DOC_EXTENSIONS.has(ext))) return true
  return false
}

function isImageFile(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type)) return true
  const ext = getFileExt(file.name)
  if (ext && IMAGE_EXTENSIONS.has(ext)) return true
  return false
}

function resolveContentType(file: File): string {
  if (file.type && (IMAGE_TYPES.has(file.type) || DOC_TYPES.has(file.type))) return file.type
  const ext = getFileExt(file.name)
  if (ext) {
    if (IMAGE_EXT_TO_MIME[ext]) return IMAGE_EXT_TO_MIME[ext]
    if (DOC_EXT_TO_MIME[ext]) return DOC_EXT_TO_MIME[ext]
  }
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
      { error: 'File upload is not configured. Please contact support.' },
      { status: 500 }
    )
  }

  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  const access = await resolveToolAccess(userId, projectId, 'finish_decisions')
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
      { error: `Invalid file type "${file.type || 'unknown'}". Allowed: images (JPEG, PNG, WebP, HEIC) and documents (PDF, Word, Excel, PowerPoint, TXT, CSV, RTF)` },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 20MB' }, { status: 400 })
  }

  const contentType = resolveContentType(file)
  const isImage = isImageFile(file)
  const pathname = `finish-decisions/${projectId}/files/${Date.now()}-${file.name}`
  const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType,
      token: blobToken,
    })

    let thumbnailUrl: string | undefined
    if (isImage) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const thumbBuffer = await sharp(Buffer.from(arrayBuffer))
          .resize({ width: 400, withoutEnlargement: true })
          .jpeg({ quality: 75 })
          .toBuffer()

        const thumbPathname = `finish-decisions/${projectId}/files/thumb_${Date.now()}-${file.name.replace(/\.[^.]+$/, '.jpg')}`
        const thumbBlob = await put(thumbPathname, thumbBuffer, {
          access: 'public',
          contentType: 'image/jpeg',
          token: blobToken,
        })
        thumbnailUrl = thumbBlob.url
      } catch (thumbErr) {
        console.error('Thumbnail generation failed (using original):', thumbErr)
        thumbnailUrl = blob.url
      }
    }

    return NextResponse.json({
      url: blob.url,
      thumbnailUrl,
      id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: contentType,
      fileType: isImage ? 'image' : 'document' as const,
    }, { status: 201 })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('File upload failed:', { fileName: file.name, errMsg, err })
    return NextResponse.json(
      { error: 'Storage upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
