import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'
import { put } from '@vercel/blob'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.doc', '.docx',
])

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

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
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  if (ext && map[ext]) return map[ext]
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

  const access = await resolveToolAccess(userId, projectId, 'project_summary')
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
      { error: `Invalid file type "${file.type || 'unknown'}". Allowed: JPEG, PNG, WebP, PDF, DOC, DOCX` },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Max 20MB' },
      { status: 400 }
    )
  }

  const contentType = resolveContentType(file)
  const pathname = `project-summary/${projectId}/${Date.now()}-${file.name}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType,
      token: blobToken,
    })

    const id = `ps_doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: contentType,
      id,
    }, { status: 201 })
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('Blob upload failed:', { fileName: file.name, errMsg, err })
    return NextResponse.json(
      { error: 'Storage upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
