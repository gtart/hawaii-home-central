import { upload } from '@vercel/blob/client'

export interface UploadFileResult {
  url: string
  thumbnailUrl?: string
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: 'image' | 'document'
}

const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
])

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
])

const MAX_SIZE = 40 * 1024 * 1024 // 40MB

function isImageFile(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type)) return true
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (ext && IMAGE_EXTENSIONS.has(ext)) return true
  return false
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  if (file.size === 0) {
    throw new Error('Empty file received — please try again.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Max 40MB')
  }

  // Step 1: Upload directly to Vercel Blob
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/tools/finish-decisions/upload-file',
  })

  const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const isImage = isImageFile(file)
  const mimeType = blob.contentType || file.type || 'application/octet-stream'

  // Step 2: Generate thumbnail for images
  let thumbnailUrl: string | undefined
  if (isImage) {
    thumbnailUrl = blob.url // fallback
    try {
      const thumbRes = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: blob.url, prefix: 'finish-decisions' }),
      })
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json()
        if (thumbData.thumbnailUrl) thumbnailUrl = thumbData.thumbnailUrl
      }
    } catch {
      // Fall back to full-size URL
    }
  }

  return {
    url: blob.url,
    thumbnailUrl,
    id,
    fileName: file.name,
    fileSize: file.size,
    mimeType,
    fileType: isImage ? 'image' : 'document',
  }
}
