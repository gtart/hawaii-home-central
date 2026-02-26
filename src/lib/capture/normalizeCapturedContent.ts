/**
 * Normalize CapturedContent into tool-specific data structures.
 * Pure functions — no side effects.
 */

import type { CapturedContent } from './decodeBookmarklet'
import type { OptionV3, OptionImageV3 } from '@/data/finish-decisions'
import type { Idea, IdeaImage } from '@/data/mood-boards'
import { genId } from '@/data/mood-boards'

/**
 * Convert CapturedContent + selected image URLs into a mood board Idea.
 */
export function capturedToMoodBoardIdea(
  content: CapturedContent,
  selectedUrls: Set<string>,
  overrides: { name?: string; notes?: string } = {}
): Idea {
  const ts = new Date().toISOString()

  const images: IdeaImage[] = content.images
    .filter((img) => selectedUrls.has(img.url))
    .map((img) => ({
      id: genId('img'),
      url: img.url,
      label: img.label,
      sourceUrl: content.url,
    }))

  return {
    id: genId('idea'),
    name: overrides.name?.trim() || content.title || 'Imported idea',
    notes: overrides.notes?.trim() || '',
    images,
    heroImageId: images[0]?.id || null,
    sourceUrl: content.url,
    sourceTitle: content.title || '',
    tags: [],
    createdAt: ts,
    updatedAt: ts,
  }
}

/**
 * Convert CapturedContent + selected image URLs into a finish-decisions OptionV3.
 */
export function capturedToSelectionOption(
  content: CapturedContent,
  selectedUrls: Set<string>,
  overrides: { name?: string; notes?: string } = {}
): OptionV3 {
  const ts = new Date().toISOString()

  const images: OptionImageV3[] = content.images
    .filter((img) => selectedUrls.has(img.url))
    .map((img) => ({
      id: crypto.randomUUID(),
      url: img.url,
      label: img.label,
      sourceUrl: content.url,
    }))

  return {
    id: crypto.randomUUID(),
    name: overrides.name?.trim() || content.title || 'Imported idea',
    notes: overrides.notes?.trim() || '',
    urls: content.url ? [{ id: crypto.randomUUID(), url: content.url }] : [],
    kind: images.length > 0 ? 'image' : 'text',
    images: images.length > 0 ? images : undefined,
    heroImageId: images[0]?.id || null,
    imageUrl: images[0]?.url,
    thumbnailUrl: images[0]?.url,
    createdAt: ts,
    updatedAt: ts,
  }
}
