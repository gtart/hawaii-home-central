export interface UploadResult {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  id: string
}

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  '.pdf', '.doc', '.docx',
  '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.rtf',
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
    throw new Error('Invalid file type. Allowed: images, PDF, Office docs, TXT, CSV')
  }

  // Upload via server-side put() — no callback needed.
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/tools/project-summary/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Upload failed (${res.status})`)
  }

  const data = await res.json()
  const id = `ps_doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  return {
    url: data.url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: data.contentType || file.type || 'application/octet-stream',
    id,
  }
}
