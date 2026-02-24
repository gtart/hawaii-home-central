import type { OptionV3, OptionImageV3 } from '@/data/finish-decisions'

/**
 * Proxy external image URLs through /api/image-proxy to bypass hotlink protection.
 * Our own hosted images (Vercel Blob, relative paths) pass through unchanged.
 */
export function displayUrl(src: string): string {
  if (!src) return src
  if (src.startsWith('/') || src.includes('.vercel-storage.com') || src.includes('.public.blob.')) return src
  return `/api/image-proxy?url=${encodeURIComponent(src)}`
}

/**
 * Get all images for an option, migrating legacy single-image fields on the fly.
 * Returns a stable array (empty if no images).
 */
export function getAllImages(option: OptionV3): OptionImageV3[] {
  if (option.images && option.images.length > 0) return option.images

  // Legacy fallback: convert imageUrl/thumbnailUrl into a single-element array
  if (option.kind === 'image' && option.imageUrl) {
    return [
      {
        id: 'legacy',
        url: option.imageUrl,
        thumbnailUrl: option.thumbnailUrl,
      },
    ]
  }

  return []
}

/**
 * Get the hero (primary) image for display. Uses heroImageId if set,
 * otherwise falls back to the first image in the array.
 * Returns undefined if no images exist.
 */
export function getHeroImage(option: OptionV3): OptionImageV3 | undefined {
  const images = getAllImages(option)
  if (images.length === 0) return undefined

  if (option.heroImageId) {
    const found = images.find((img) => img.id === option.heroImageId)
    if (found) return found
  }

  return images[0]
}

/**
 * Migrate legacy single-image fields into the images[] array (in-place mutation).
 * Idempotent — safe to call multiple times.
 * Returns true if migration was performed.
 */
export function migrateLegacyToImages(option: OptionV3): boolean {
  if (option.images && option.images.length > 0) return false
  if (!option.imageUrl) return false

  option.images = [
    {
      id: crypto.randomUUID(),
      url: option.imageUrl,
      thumbnailUrl: option.thumbnailUrl,
    },
  ]
  option.heroImageId = option.images[0].id
  return true
}
