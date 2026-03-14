import { upload } from '@vercel/blob/client'

export interface UploadResult {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  id: string
}

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp',
  '.pdf', '.doc', '.docx',
])

const MAX_SIZE = 40 * 1024 * 1024 // 40MB

function getFileExt(name: string): string | undefined {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0]
}

export async function uploadProjectSummaryFile(
  file: File
): Promise<UploadResult> {
  // Client-side validation before uploading
  if (file.size === 0) {
    throw new Error('Empty file received — please try again.')
  }

  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Max 40MB')
  }

  const ext = getFileExt(file.name)
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, PDF, DOC, DOCX')
  }

  // Upload directly to Vercel Blob from the browser.
  // The handleUploadUrl validates auth + access and returns a client token.
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/tools/project-summary/upload',
  })

  const id = `ps_doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  return {
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: blob.contentType || file.type || 'application/octet-stream',
    id,
  }
}
