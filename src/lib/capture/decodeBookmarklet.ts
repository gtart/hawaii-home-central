/**
 * Bookmarklet payload decoder.
 *
 * Handles the full pipeline: hash extraction -> base64 decode -> JSON parse -> validation.
 * Returns a typed CapturedContent on success or a DecodeError on failure.
 */

// ── Types ──

export interface CapturedImage {
  url: string
  label?: string
}

export interface CapturedContent {
  url: string
  title: string
  images: CapturedImage[]
  source: 'bookmarklet' | 'import-url'
}

export interface DecodeError {
  code: 'NO_HASH' | 'DECODE_FAILED' | 'PARSE_FAILED' | 'INVALID_SHAPE'
  message: string
  /** Safe debug string (no user content) */
  debug?: string
}

export type DecodeResult =
  | { ok: true; data: CapturedContent }
  | { ok: false; error: DecodeError }

// ── Constants ──

const HASH_PREFIX = '#bookmarklet='
const STORAGE_KEY = 'hhc_bookmarklet_pending'

// ── Helpers ──

/**
 * Base64-decode a string, handling both standard base64 and base64url.
 * Uses TextDecoder for Unicode safety.
 */
function base64Decode(b64: string): string {
  // Convert base64url to standard base64
  let normalized = b64.replace(/-/g, '+').replace(/_/g, '/')
  // Pad if needed
  while (normalized.length % 4 !== 0) normalized += '='

  const binaryStr = atob(normalized)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Validate and coerce raw JSON into CapturedContent.
 * Lenient: missing fields get defaults rather than rejecting.
 */
function validateShape(data: unknown): CapturedContent | null {
  if (!data || typeof data !== 'object') return null

  const obj = data as Record<string, unknown>

  // url is required
  const url = typeof obj.url === 'string' ? obj.url.trim() : ''
  if (!url) return null

  const title = typeof obj.title === 'string' ? obj.title.slice(0, 200) : ''

  // images: coerce to array, filter valid entries
  let images: CapturedImage[] = []
  if (Array.isArray(obj.images)) {
    images = obj.images
      .filter(
        (img): img is { url: string; label?: string } =>
          !!img && typeof img === 'object' && typeof (img as Record<string, unknown>).url === 'string'
      )
      .map((img) => ({
        url: img.url.trim(),
        label: typeof img.label === 'string' ? img.label.slice(0, 100) : undefined,
      }))
      .filter((img) => img.url.length > 0)
  }

  return { url, title, images, source: 'bookmarklet' }
}

// ── Main decode function ──

/**
 * Attempt to decode bookmarklet data from the given hash string.
 *
 * Usage:
 *   const result = decodeBookmarkletHash(window.location.hash)
 *   if (result.ok) { ... result.data ... }
 */
export function decodeBookmarkletHash(hash: string): DecodeResult {
  if (!hash || !hash.startsWith(HASH_PREFIX)) {
    return { ok: false, error: { code: 'NO_HASH', message: 'No bookmarklet data in URL.' } }
  }

  const b64 = hash.slice(HASH_PREFIX.length)
  if (!b64) {
    return { ok: false, error: { code: 'DECODE_FAILED', message: 'Empty payload.', debug: 'b64_empty' } }
  }

  let jsonStr: string
  try {
    jsonStr = base64Decode(b64)
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'DECODE_FAILED',
        message: 'Could not decode the saved data.',
        debug: `base64_err:${e instanceof Error ? e.message.slice(0, 60) : 'unknown'}`,
      },
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return {
      ok: false,
      error: {
        code: 'PARSE_FAILED',
        message: 'Saved data was corrupted.',
        debug: `json_err:len=${jsonStr.length}`,
      },
    }
  }

  const content = validateShape(parsed)
  if (!content) {
    return {
      ok: false,
      error: {
        code: 'INVALID_SHAPE',
        message: 'Saved data was incomplete.',
        debug: `shape_err:keys=${Object.keys(parsed as object).join(',')}`,
      },
    }
  }

  return { ok: true, data: content }
}

/**
 * Try to read bookmarklet data from sessionStorage (internal same-window flow).
 * Returns null if nothing found. Clears the key on read.
 */
export function readSessionStoragePayload(): CapturedContent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)

    const parsed = JSON.parse(raw) as unknown
    return validateShape(parsed)
  } catch {
    return null
  }
}

/**
 * Clear the bookmarklet hash from the URL bar (prevents re-import on refresh).
 */
export function clearBookmarkletHash(): void {
  if (typeof window !== 'undefined' && window.location.hash.startsWith(HASH_PREFIX)) {
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}
