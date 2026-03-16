const MAX_SIZE = 40 * 1024 * 1024 // 40MB

export async function uploadMoodBoardFile(
  file: File
): Promise<{ url: string; thumbnailUrl: string; id: string }> {
  if (file.size === 0) {
    throw new Error('Empty file received — please try again.')
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File too large. Max 40MB')
  }

  // Step 1: Upload via server-side put()
  const formData = new FormData()
  formData.append('file', file)
  const uploadRes = await fetch('/api/tools/mood-boards/upload', {
    method: 'POST',
    body: formData,
  })
  if (!uploadRes.ok) {
    const data = await uploadRes.json().catch(() => ({}))
    throw new Error(data.error || `Upload failed (${uploadRes.status})`)
  }
  const blob = await uploadRes.json()

  const id = `mb_img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  // Step 2: Generate thumbnail via server (fetches from blob URL, no body limit)
  let thumbnailUrl = blob.url as string
  try {
    const thumbRes = await fetch('/api/generate-thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: blob.url, prefix: 'mood-boards' }),
    })
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json()
      if (thumbData.thumbnailUrl) thumbnailUrl = thumbData.thumbnailUrl
    }
  } catch {
    // Fall back to full-size URL if thumbnail generation fails
  }

  return { url: blob.url, thumbnailUrl, id }
}
