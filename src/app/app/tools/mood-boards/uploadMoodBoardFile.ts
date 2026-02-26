export async function uploadMoodBoardFile(
  file: File
): Promise<{ url: string; thumbnailUrl: string; id: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let res: Response
  try {
    res = await fetch('/api/tools/mood-boards/upload', {
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
