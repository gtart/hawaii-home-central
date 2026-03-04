export interface UploadDocumentResult {
  url: string
  id: string
  fileName: string
  fileSize: number
  mimeType: string
}

export async function uploadDocument(file: File): Promise<UploadDocumentResult> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

  try {
    const res = await fetch('/api/tools/finish-decisions/upload-document', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(data.error || `Upload failed (${res.status})`)
    }

    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}
