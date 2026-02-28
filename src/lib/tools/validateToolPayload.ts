/**
 * Per-tool payload validation and coercion for server-side writes.
 *
 * Design principles:
 * - COERCE over REJECT: fix what we can, only reject truly unrecoverable shapes.
 * - Backward compatible: old payloads load fine, get upgraded in-place.
 * - Minimal logging: no user content in logs.
 */

type ValidationResult =
  | { valid: true; payload: Record<string, unknown> }
  | { valid: false; reason: string }

// ── Finish Decisions (V3) ──

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

const VALID_STATUSES = ['deciding', 'selected', 'ordered', 'done']

function coerceOption(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null
  return {
    ...raw,
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    name: isString(raw.name) ? raw.name : 'Untitled',
    notes: isString(raw.notes) ? raw.notes : '',
    urls: Array.isArray(raw.urls) ? raw.urls : [],
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

function coerceDecision(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null
  const options = Array.isArray(raw.options)
    ? (raw.options as unknown[]).map(coerceOption).filter(Boolean)
    : []
  const status = isString(raw.status) && VALID_STATUSES.includes(raw.status)
    ? raw.status
    : 'deciding'
  return {
    ...raw,
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    title: isString(raw.title) ? raw.title : 'Untitled',
    status,
    notes: isString(raw.notes) ? raw.notes : '',
    options,
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

function coerceRoom(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null
  const decisions = Array.isArray(raw.decisions)
    ? (raw.decisions as unknown[]).map(coerceDecision).filter(Boolean)
    : []
  return {
    ...raw,
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    type: isString(raw.type) ? raw.type : 'other',
    name: isString(raw.name) ? raw.name : 'Unnamed Room',
    decisions,
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

function validateFinishDecisions(payload: Record<string, unknown>): ValidationResult {
  // Accept v3 payloads; coerce as needed
  const version = typeof payload.version === 'number' ? payload.version : 3
  if (version < 3) {
    // v1/v2 payloads need client-side migration, not server-side.
    // Allow them through — the client ensureShape will handle it.
    return { valid: true, payload }
  }

  const rooms = Array.isArray(payload.rooms)
    ? (payload.rooms as unknown[]).map(coerceRoom).filter(Boolean)
    : []

  // Coerce ownedKitIds (project-level pack ownership)
  const ownedKitIds = Array.isArray(payload.ownedKitIds) ? payload.ownedKitIds : []

  return { valid: true, payload: { ...payload, version: 3, rooms, ownedKitIds } }
}

// ── Mood Boards (V1) ──

function coerceIdea(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null
  return {
    ...raw,
    id: isString(raw.id) ? raw.id : `idea_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: isString(raw.name) ? raw.name : 'Untitled',
    notes: isString(raw.notes) ? raw.notes : '',
    images: Array.isArray(raw.images) ? raw.images : [],
    heroImageId: raw.heroImageId ?? null,
    sourceUrl: isString(raw.sourceUrl) && raw.sourceUrl !== '' ? raw.sourceUrl : null,
    sourceTitle: isString(raw.sourceTitle) && raw.sourceTitle !== '' ? raw.sourceTitle : null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

function coerceBoard(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null
  const ideas = Array.isArray(raw.ideas)
    ? (raw.ideas as unknown[]).map(coerceIdea).filter(Boolean)
    : []
  return {
    ...raw,
    id: isString(raw.id) ? raw.id : `board_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: isString(raw.name) ? raw.name : 'Untitled Board',
    ideas,
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

function validateMoodBoards(payload: Record<string, unknown>): ValidationResult {
  const boards = Array.isArray(payload.boards)
    ? (payload.boards as unknown[]).map(coerceBoard).filter(Boolean)
    : []

  return { valid: true, payload: { ...payload, version: 1, boards } }
}

// ── Punchlist (V3) ──

function validatePunchlist(payload: Record<string, unknown>): ValidationResult {
  // Punchlist already has robust ensureShape on client. Just ensure basic shape.
  if (!Array.isArray(payload.items)) {
    return { valid: true, payload: { ...payload, items: [], version: 3, nextItemNumber: 1 } }
  }
  return { valid: true, payload }
}

// ── Before You Sign (V1) ──

function validateBeforeYouSign(payload: Record<string, unknown>): ValidationResult {
  if (!Array.isArray(payload.contractors)) {
    return { valid: true, payload: { ...payload, contractors: [], version: 1 } }
  }
  return { valid: true, payload }
}

// ── Main entry point ──

const VALIDATORS: Record<string, (p: Record<string, unknown>) => ValidationResult> = {
  finish_decisions: validateFinishDecisions,
  mood_boards: validateMoodBoards,
  punchlist: validatePunchlist,
  before_you_sign: validateBeforeYouSign,
}

/**
 * Validate and coerce an incoming tool payload before persisting.
 * Returns { valid: true, payload } with the coerced payload, or { valid: false, reason }.
 */
export function validateAndCoerceToolPayload(
  toolKey: string,
  incoming: unknown
): ValidationResult {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return { valid: false, reason: 'payload_not_object' }
  }

  const validator = VALIDATORS[toolKey]
  if (!validator) {
    // No specific validator — pass through (other tools like hold_points, etc.)
    return { valid: true, payload: incoming as Record<string, unknown> }
  }

  return validator(incoming as Record<string, unknown>)
}
