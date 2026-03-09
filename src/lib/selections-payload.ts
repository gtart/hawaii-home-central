/**
 * Normalized Selections payload reader.
 *
 * Multiple server-side consumers need to extract a flat list of selections
 * from either V3 (rooms-based) or V4 (flat selections) payloads. This module
 * provides a single, canonical way to do that so drift between consumers
 * cannot reoccur.
 */

import type { StatusV3 } from '@/data/finish-decisions'

// ---------------------------------------------------------------------------
// Normalized types (minimal — only what consumers actually need)
// ---------------------------------------------------------------------------

export interface NormalizedSelection {
  id: string
  title: string
  status: StatusV3
  notes: string
  optionCount: number
  hasSelectedOption: boolean
  /** First selected-option thumbnail URL, if any */
  thumbnailUrl: string | null
  tags: string[]
  location?: string
  dueDate?: string | null
  comments: Array<{
    text: string
    authorName?: string
    authorEmail?: string
    createdAt: string
  }>
}

export interface NormalizedSelectionsResult {
  version: number
  selections: NormalizedSelection[]
}

export interface SelectionStatusCounts {
  /** 'deciding' status with zero options */
  notStarted: number
  /** 'deciding' status with at least one option */
  deciding: number
  /** 'selected' | 'ordered' | 'done' */
  done: number
  total: number
}

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

/**
 * Read any finish_decisions payload (V3 or V4) and return a flat,
 * normalized list of selections with computed counts.
 */
export function readSelectionsPayload(raw: unknown): NormalizedSelectionsResult {
  if (!raw || typeof raw !== 'object') {
    return { version: 0, selections: [] }
  }

  const payload = raw as Record<string, unknown>
  const version = typeof payload.version === 'number' ? payload.version : 0

  // V4: flat selections array (current)
  if (version >= 4 || Array.isArray(payload.selections)) {
    const selections = Array.isArray(payload.selections) ? payload.selections : []
    return {
      version: 4,
      selections: selections.map(normalizeSelectionV4),
    }
  }

  // V3: rooms → decisions
  if (Array.isArray(payload.rooms)) {
    const rooms = payload.rooms as Array<Record<string, unknown>>
    const selections: NormalizedSelection[] = []
    for (const room of rooms) {
      const decisions = Array.isArray(room.decisions) ? room.decisions : []
      for (const d of decisions as Array<Record<string, unknown>>) {
        selections.push(normalizeDecisionV3(d))
      }
    }
    return { version: 3, selections }
  }

  return { version, selections: [] }
}

/**
 * Compute status-based counts from a normalized selections list.
 */
export function countSelectionStatuses(selections: NormalizedSelection[]): SelectionStatusCounts {
  let notStarted = 0
  let deciding = 0
  let done = 0

  for (const s of selections) {
    const status = s.status || 'deciding'
    if (status === 'deciding') {
      if (s.optionCount === 0) notStarted++
      else deciding++
    } else {
      done++
    }
  }

  return { notStarted, deciding, done, total: selections.length }
}

// ---------------------------------------------------------------------------
// Internal normalizers
// ---------------------------------------------------------------------------

function getOptionThumb(option: Record<string, unknown>): string | null {
  const images = option.images as Array<{ thumbnailUrl?: string; url: string }> | undefined
  if (images?.length) {
    return images[0].thumbnailUrl || images[0].url
  }
  return (option.thumbnailUrl as string) || (option.imageUrl as string) || null
}

function normalizeSelectionV4(raw: unknown): NormalizedSelection {
  const s = raw as Record<string, unknown>
  const options = Array.isArray(s.options) ? (s.options as Array<Record<string, unknown>>) : []
  const selected = options.find((o) => o.isSelected)
  const comments = Array.isArray(s.comments) ? (s.comments as Array<Record<string, unknown>>) : []

  return {
    id: String(s.id || ''),
    title: String(s.title || 'Untitled'),
    status: (s.status as StatusV3) || 'deciding',
    notes: String(s.notes || ''),
    optionCount: options.length,
    hasSelectedOption: !!selected,
    thumbnailUrl: selected ? getOptionThumb(selected) : (options.length > 0 ? getOptionThumb(options[0]) : null),
    tags: Array.isArray(s.tags) ? (s.tags as string[]) : [],
    location: s.location as string | undefined,
    dueDate: (s.dueDate as string) ?? null,
    comments: comments.map((c) => ({
      text: String(c.text || ''),
      authorName: c.authorName as string | undefined,
      authorEmail: c.authorEmail as string | undefined,
      createdAt: String(c.createdAt || ''),
    })),
  }
}

function normalizeDecisionV3(raw: Record<string, unknown>): NormalizedSelection {
  const options = Array.isArray(raw.options) ? (raw.options as Array<Record<string, unknown>>) : []
  const selected = options.find((o) => o.isSelected)
  const comments = Array.isArray(raw.comments) ? (raw.comments as Array<Record<string, unknown>>) : []

  return {
    id: String(raw.id || ''),
    title: String(raw.title || 'Untitled'),
    status: (raw.status as StatusV3) || 'deciding',
    notes: String(raw.notes || ''),
    optionCount: options.length,
    hasSelectedOption: !!selected,
    thumbnailUrl: selected ? getOptionThumb(selected) : null,
    tags: [],
    location: raw.location as string | undefined,
    dueDate: (raw.dueDate as string) ?? null,
    comments: comments.map((c) => ({
      text: String(c.text || ''),
      authorName: c.authorName as string | undefined,
      authorEmail: c.authorEmail as string | undefined,
      createdAt: String(c.createdAt || ''),
    })),
  }
}
