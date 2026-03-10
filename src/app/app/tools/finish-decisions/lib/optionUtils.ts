/** Shared utility functions for option display */

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function linkHostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export async function fetchLinkPreview(url: string): Promise<{ linkTitle?: string; linkDescription?: string; linkImage?: string }> {
  try {
    const res = await fetch('/api/tools/finish-decisions/link-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      linkTitle: data.title || undefined,
      linkDescription: data.description || undefined,
      linkImage: data.image || undefined,
    }
  } catch {
    return {}
  }
}

/** If the price looks like a bare number (with optional commas/decimals), prepend $ */
export function displayPrice(raw: string | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (/^\$/.test(trimmed)) return trimmed
  if (/^[\d,]+(\.\d{1,2})?$/.test(trimmed)) return `$${trimmed}`
  return trimmed
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function docTypeColor(mimeType: string | undefined): string {
  if (!mimeType) return 'text-cream/40'
  if (mimeType.startsWith('image/')) return 'text-purple-400'
  if (mimeType === 'application/pdf') return 'text-red-400'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'text-blue-400'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'text-green-400'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-400'
  return 'text-cream/40'
}

export function docTypeLabel(mimeType: string | undefined): string {
  if (!mimeType) return 'FILE'
  if (mimeType.startsWith('image/')) return 'IMG'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'DOC'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT'
  if (mimeType === 'text/plain') return 'TXT'
  if (mimeType === 'text/csv') return 'CSV'
  return 'FILE'
}

export const isValidUrl = (url: string) => /^https?:\/\/.+/i.test(url)
