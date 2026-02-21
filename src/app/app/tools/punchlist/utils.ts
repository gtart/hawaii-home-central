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

// ---- Photo upload utility ----

export async function uploadFile(file: File): Promise<PunchlistPhoto> {
  const formData = new FormData()
  formData.append('file', file)

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
