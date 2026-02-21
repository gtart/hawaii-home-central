import type { PunchlistPhoto } from './types'

// ---- Shared seed data for autocomplete ----

export const LOCATION_SEEDS = [
  'Kitchen',
  'Master Bathroom',
  'Guest Bathroom',
  'Living Room',
  'Dining Room',
  'Master Bedroom',
  'Guest Bedroom',
  'Hallway',
  'Garage',
  'Lanai',
  'Exterior',
  'Roof',
  'Laundry Room',
  'Office',
]

export const ASSIGNEE_SEEDS = [
  'GC',
  'Plumber',
  'Electrician',
  'Painter',
  'Tile',
  'Cabinet Installer',
  'HVAC',
  'Flooring',
  'Drywall',
  'Homeowner',
]

// ---- Client-side image resize (saves storage + fixes large iPhone photos) ----

export function resizeImage(file: File, maxDim = 1600, quality = 0.75): Promise<File> {
  // Skip small files — no resize needed
  if (file.size <= 1 * 1024 * 1024) return Promise.resolve(file)

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      // Already within bounds and small enough
      if (width <= maxDim && height <= maxDim && file.size <= 5 * 1024 * 1024) {
        resolve(file)
        return
      }

      const scale = Math.min(maxDim / width, maxDim / height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return } // Fallback: use original
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // Fallback: try original
    }

    img.src = url
  })
}

// ---- Photo upload utility ----

export async function uploadFile(file: File): Promise<PunchlistPhoto> {
  const resized = await resizeImage(file)
  const formData = new FormData()
  formData.append('file', resized)

  const res = await fetch('/api/tools/punchlist/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`
    try {
      const data = await res.json()
      if (data.error) msg = data.error
    } catch { /* non-JSON response */ }
    throw new Error(msg)
  }

  const { url, thumbnailUrl, id } = await res.json()
  return { id, url, thumbnailUrl, uploadedAt: new Date().toISOString() }
}
