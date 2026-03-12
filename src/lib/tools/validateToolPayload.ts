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
    files: Array.isArray(raw.files) ? raw.files : [],
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

function coerceSelection(raw: unknown): Record<string, unknown> | null {
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
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: isString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString(),
  }
}

function validateFinishDecisions(payload: Record<string, unknown>): ValidationResult {
  const version = typeof payload.version === 'number' ? payload.version : 3

  // V4: flat selections array
  if (version >= 4) {
    const selections = Array.isArray(payload.selections)
      ? (payload.selections as unknown[]).map(coerceSelection).filter(Boolean)
      : []
    const ownedKitIds = Array.isArray(payload.ownedKitIds) ? payload.ownedKitIds : []
    const appliedKitIds = Array.isArray(payload.appliedKitIds) ? payload.appliedKitIds : []
    return { valid: true, payload: { ...payload, version: 4, selections, ownedKitIds, appliedKitIds } }
  }

  // v1/v2 payloads need client-side migration
  if (version < 3) {
    return { valid: true, payload }
  }

  // V3: rooms-based (legacy, will be migrated client-side)
  const rooms = Array.isArray(payload.rooms)
    ? (payload.rooms as unknown[]).map(coerceRoom).filter(Boolean)
    : []
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

// ── Project Alignment (V1) ──

const VALID_AL_STATUSES = [
  'open', 'waiting_on_homeowner', 'waiting_on_contractor', 'needs_pricing',
  'needs_decision', 'accepted', 'rejected', 'implemented', 'superseded',
]
const VALID_AL_TYPES = [
  'change_request', 'scope_clarification', 'scope_omission', 'plan_mismatch',
  'design_correction', 'open_question', 'allowance_upgrade', 'site_condition',
  'version_conflict',
]
const VALID_COST_SCHEDULE = ['none', 'possible', 'confirmed', 'unknown']
const VALID_WAITING_ON = ['homeowner', 'contractor', 'designer', 'vendor', 'none']

function coerceAlignmentItem(raw: unknown): Record<string, unknown> | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()
  return {
    ...raw,
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    itemNumber: typeof raw.itemNumber === 'number' ? raw.itemNumber : 0,
    title: isString(raw.title) ? raw.title : 'Untitled',
    type: isString(raw.type) && VALID_AL_TYPES.includes(raw.type) ? raw.type : 'open_question',
    status: isString(raw.status) && VALID_AL_STATUSES.includes(raw.status) ? raw.status : 'open',
    area_label: isString(raw.area_label) ? raw.area_label : '',
    summary: isString(raw.summary) ? raw.summary : '',
    original_expectation: isString(raw.original_expectation) ? raw.original_expectation : '',
    current_issue: isString(raw.current_issue) ? raw.current_issue : '',
    proposed_resolution: isString(raw.proposed_resolution) ? raw.proposed_resolution : '',
    current_agreed_answer: isString(raw.current_agreed_answer) ? raw.current_agreed_answer : '',
    cost_impact_status: isString(raw.cost_impact_status) && VALID_COST_SCHEDULE.includes(raw.cost_impact_status) ? raw.cost_impact_status : 'unknown',
    cost_impact_amount_text: isString(raw.cost_impact_amount_text) ? raw.cost_impact_amount_text : '',
    schedule_impact_status: isString(raw.schedule_impact_status) && VALID_COST_SCHEDULE.includes(raw.schedule_impact_status) ? raw.schedule_impact_status : 'unknown',
    schedule_impact_text: isString(raw.schedule_impact_text) ? raw.schedule_impact_text : '',
    waiting_on_role: isString(raw.waiting_on_role) && VALID_WAITING_ON.includes(raw.waiting_on_role) ? raw.waiting_on_role : 'none',
    artifact_links: Array.isArray(raw.artifact_links) ? raw.artifact_links : [],
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    guest_responses: Array.isArray(raw.guest_responses) ? raw.guest_responses : [],
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
    // Optional fields — preserve if valid, omit if not
    ...(isString(raw.resolved_at) ? { resolved_at: raw.resolved_at } : {}),
    ...(isString(raw.answer_updated_at) ? { answer_updated_at: raw.answer_updated_at } : {}),
    ...(isString(raw.answer_updated_by_name) ? { answer_updated_by_name: raw.answer_updated_by_name } : {}),
    ...(isString(raw.what_changed) ? { what_changed: raw.what_changed } : {}),
    ...(isString(raw.what_did_not_change) ? { what_did_not_change: raw.what_did_not_change } : {}),
    ...(isString(raw.whats_still_open) ? { whats_still_open: raw.whats_still_open } : {}),
    ...(isString(raw.superseded_by_id) ? { superseded_by_id: raw.superseded_by_id } : {}),
    ...(isString(raw.supersedes_id) ? { supersedes_id: raw.supersedes_id } : {}),
    ...(isString(raw.created_by_name) ? { created_by_name: raw.created_by_name } : {}),
    ...(isString(raw.created_by_email) ? { created_by_email: raw.created_by_email } : {}),
  }
}

function validateProjectAlignment(payload: Record<string, unknown>): ValidationResult {
  const items = Array.isArray(payload.items)
    ? (payload.items as unknown[]).map(coerceAlignmentItem).filter(Boolean)
    : []
  const nextItemNumber = typeof payload.nextItemNumber === 'number'
    ? payload.nextItemNumber
    : items.length + 1
  return { valid: true, payload: { ...payload, version: 1, items, nextItemNumber } }
}

// ── Project Summary (V1) ──

const VALID_PS_CHANGE_STATUSES = ['proposed', 'approved', 'not_approved']
const VALID_PS_DECISION_STATUSES = ['open', 'decided']

function validateProjectSummary(payload: Record<string, unknown>): ValidationResult {
  const summaryRaw = isObject(payload.summary) ? payload.summary : {}
  const summary = {
    text: isString(summaryRaw.text) ? summaryRaw.text : '',
    ...(isString(summaryRaw.baseline_amount) ? { baseline_amount: summaryRaw.baseline_amount } : {}),
    ...(isString(summaryRaw.approved_changes_total) ? { approved_changes_total: summaryRaw.approved_changes_total } : {}),
    ...(isString(summaryRaw.current_total) ? { current_total: summaryRaw.current_total } : {}),
    ...(isString(summaryRaw.budget_note) ? { budget_note: summaryRaw.budget_note } : {}),
    updated_at: isString(summaryRaw.updated_at) ? summaryRaw.updated_at : new Date().toISOString(),
  }

  const documents = Array.isArray(payload.documents)
    ? (payload.documents as unknown[]).filter(isObject)
    : []
  const changes = Array.isArray(payload.changes)
    ? (payload.changes as unknown[]).filter(isObject).map((c) => ({
      ...c,
      status: isString(c.status) && VALID_PS_CHANGE_STATUSES.includes(c.status) ? c.status : 'proposed',
      links: Array.isArray(c.links) ? c.links : [],
    }))
    : []
  const openDecisions = Array.isArray(payload.openDecisions)
    ? (payload.openDecisions as unknown[]).filter(isObject).map((d) => ({
      ...d,
      status: isString(d.status) && VALID_PS_DECISION_STATUSES.includes(d.status) ? d.status : 'open',
      links: Array.isArray(d.links) ? d.links : [],
    }))
    : []

  return { valid: true, payload: { version: 1, summary, documents, changes, openDecisions } }
}

// ── Main entry point ──

const VALIDATORS: Record<string, (p: Record<string, unknown>) => ValidationResult> = {
  finish_decisions: validateFinishDecisions,
  mood_boards: validateMoodBoards,
  punchlist: validatePunchlist,
  before_you_sign: validateBeforeYouSign,
  project_alignment: validateProjectAlignment,
  project_summary: validateProjectSummary,
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
