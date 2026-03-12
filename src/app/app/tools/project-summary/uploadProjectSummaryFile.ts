export interface UploadResult {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  id: string
}

export async function uploadProjectSummaryFile(
  file: File
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

  let res: Response
  try {
    res = await fetch('/api/tools/project-summary/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Upload timed out. Check your connection and try again.')
    }
    throw err
  }
  clearTimeout(timeout)

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`
    try {
      const data = await res.json()
      if (data.error) msg = data.error
    } catch {
      /* non-JSON */
    }
    throw new Error(msg)
  }

  return res.json()
}
