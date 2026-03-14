// ---------------------------------------------------------------------------
// Project Summary / Plan & Changes — data types, defaults, and validation.
// Payload-in-ToolCollection pattern (same as Punchlist/Selections).
//
// v1 → v2 migration: ensureShape silently converts v1 payloads to v2.
// Internal type names unchanged (ProjectSummaryPayload, etc.) for stability.
// ---------------------------------------------------------------------------

// ── v1 Types (kept for migration) ──

export type ChangeStatusV1 = 'proposed' | 'approved' | 'not_approved'
export type DecisionStatus = 'open' | 'pending_homeowner' | 'pending_contractor' | 'approved' | 'closed'

// ── v2 Types ──

export type ChangeStatus = 'requested' | 'awaiting_homeowner' | 'approved_by_homeowner' | 'accepted_by_contractor' | 'done' | 'closed'
export type PlanStatus = 'working' | 'approved' | 'unlocked'

/** Legacy plan statuses — kept for v2→v3 migration */
export type PlanStatusLegacy = 'draft' | 'shared' | 'confirmed' | 'acknowledged'
export type PlanItemCategory = 'included' | 'not_included' | 'still_to_decide'
export type OpenItemStatus = 'open' | 'waiting' | 'resolved' | 'closed'
export type DocType = 'plan' | 'contract' | 'spec' | 'permit' | 'pricing' | 'other'
export type DocScope = 'plan' | 'reference'
export type SummaryLinkType = 'selection' | 'fix_item' | 'document'

export interface SummaryLink {
  id: string
  linkType: SummaryLinkType
  toolKey?: string          // 'finish_decisions' | 'punchlist'
  collectionId?: string
  entityId?: string
  label: string
}

export interface SummaryDocument {
  id: string
  label: string
  docType?: DocType
  doc_scope?: DocScope
  date?: string
  isCurrent: boolean
  replacedByDocId?: string
  url?: string
  note?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  uploadedBy?: string
  uploadedAt?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ChangeAttachment {
  id: string
  type: 'file' | 'url'
  url: string
  label: string
  fileName?: string
  fileSize?: number
  mimeType?: string
  uploadedBy?: string
  uploadedAt?: string
}

export interface PlanItem {
  id: string
  text: string
  category: PlanItemCategory
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface OpenItem {
  id: string
  text: string
  status: OpenItemStatus
  // Resolution metadata (PCV1-011)
  resolved_at?: string
  resolved_by?: string
  resolution_note?: string
  // Waiting metadata
  waiting_on?: string
  // General audit fields
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  event: string   // 'plan_shared' | 'plan_confirmed' | 'plan_acknowledged' | 'change_approved' | 'change_incorporated' | etc.
  label: string
  actor?: string
  note?: string
  timestamp: string
  relatedEntityId?: string
}

export interface CurrentPlan {
  scope: string
  included: PlanItem[]
  not_included: PlanItem[]
  /** @deprecated Use open_items instead. Kept for backward-compatible migration. */
  still_to_decide: PlanItem[]
  open_items: OpenItem[]
  status: PlanStatus
  status_changed_at?: string
  content_changed_since_status?: boolean
  // Approval metadata (PCV1-004, PCV1-008)
  approved_at?: string
  approved_by?: string
  // Unlock metadata (PCV1-004)
  unlocked_at?: string
  unlocked_by?: string
  unlock_reason?: string
  // Revision tracking (PCV1-008)
  revision_number?: number
  updated_at: string
}

export interface SummaryChange {
  id: string
  title: string
  description?: string
  /** Why this change happened — context for future reference (PCV1-043) */
  rationale?: string
  requested_by?: string
  status: ChangeStatus
  /** Proposed cost impact — initial estimate before final agreement (PCV1-044) */
  proposed_cost_impact?: string
  /** Proposed schedule impact — initial estimate (PCV1-044) */
  proposed_schedule_impact?: string
  /** Final agreed cost impact (PCV1-044) */
  cost_impact?: string
  /** Final agreed schedule impact (PCV1-044) */
  schedule_impact?: string
  contractor_response?: string
  final_note?: string
  private_notes?: string
  incorporated: boolean
  incorporated_at?: string
  incorporated_by?: string
  changed_since_accepted?: boolean
  affects_sections?: string[]
  open_items?: OpenItem[]
  links: SummaryLink[]
  attachments?: ChangeAttachment[]
  created_at: string
  updated_at: string
}

export interface ProjectSummaryPayload {
  version: 2
  plan: CurrentPlan
  budget: {
    baseline_amount?: string
    budget_note?: string
    updated_at: string
  }
  documents: SummaryDocument[]
  changes: SummaryChange[]
  milestones: Milestone[]
}

// ── Defaults ──

export const DEFAULT_PROJECT_SUMMARY_PAYLOAD: ProjectSummaryPayload = {
  version: 2,
  plan: {
    scope: '',
    included: [],
    not_included: [],
    still_to_decide: [],
    open_items: [],
    status: 'working',
    content_changed_since_status: false,
    updated_at: new Date().toISOString(),
  },
  budget: {
    updated_at: new Date().toISOString(),
  },
  documents: [],
  changes: [],
  milestones: [],
}

// ── Valid enum sets ──

export const VALID_CHANGE_STATUSES: ReadonlySet<string> = new Set<ChangeStatus>([
  'requested', 'awaiting_homeowner', 'approved_by_homeowner', 'accepted_by_contractor', 'done', 'closed',
])

// Legacy v1 statuses — used during migration
const LEGACY_CHANGE_STATUSES: ReadonlySet<string> = new Set<ChangeStatusV1>([
  'proposed', 'approved', 'not_approved',
])

export const VALID_PLAN_STATUSES: ReadonlySet<string> = new Set<PlanStatus>([
  'working', 'approved', 'unlocked',
])

/** Legacy plan statuses — used during v2→v3 migration */
const LEGACY_PLAN_STATUSES: ReadonlySet<string> = new Set<PlanStatusLegacy>([
  'draft', 'shared', 'confirmed', 'acknowledged',
])

export const VALID_OPEN_ITEM_STATUSES: ReadonlySet<string> = new Set<OpenItemStatus>([
  'open', 'waiting', 'resolved', 'closed',
])

export const VALID_DOC_TYPES: ReadonlySet<string> = new Set<DocType>([
  'plan', 'contract', 'spec', 'permit', 'pricing', 'other',
])

export const VALID_DOC_SCOPES: ReadonlySet<string> = new Set<DocScope>([
  'plan', 'reference',
])

export const VALID_LINK_TYPES: ReadonlySet<string> = new Set<SummaryLinkType>([
  'selection', 'fix_item', 'document',
])

export const VALID_PLAN_ITEM_CATEGORIES: ReadonlySet<string> = new Set<PlanItemCategory>([
  'included', 'not_included', 'still_to_decide',
])

// ── ensureShape — coerce unknown payload to valid ProjectSummaryPayload ──

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function coerceLink(raw: unknown): SummaryLink | null {
  if (!isObject(raw)) return null
  if (!isString(raw.id) || !isString(raw.linkType)) return null
  if (!VALID_LINK_TYPES.has(raw.linkType)) return null
  return {
    id: raw.id,
    linkType: raw.linkType as SummaryLinkType,
    ...(isString(raw.toolKey) ? { toolKey: raw.toolKey } : {}),
    ...(isString(raw.collectionId) ? { collectionId: raw.collectionId } : {}),
    ...(isString(raw.entityId) ? { entityId: raw.entityId } : {}),
    label: isString(raw.label) ? raw.label : 'Untitled',
  }
}

function coerceLinks(raw: unknown): SummaryLink[] {
  if (!Array.isArray(raw)) return []
  return raw.map(coerceLink).filter((l): l is SummaryLink => l !== null)
}

function coerceDocument(raw: unknown): SummaryDocument | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()
  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    label: isString(raw.label) ? raw.label : 'Untitled',
    ...(isString(raw.docType) && VALID_DOC_TYPES.has(raw.docType) ? { docType: raw.docType as DocType } : {}),
    ...(isString(raw.doc_scope) && VALID_DOC_SCOPES.has(raw.doc_scope) ? { doc_scope: raw.doc_scope as DocScope } : {}),
    ...(isString(raw.date) ? { date: raw.date } : {}),
    isCurrent: raw.isCurrent === true,
    ...(isString(raw.replacedByDocId) ? { replacedByDocId: raw.replacedByDocId } : {}),
    ...(isString(raw.url) ? { url: raw.url } : {}),
    ...(isString(raw.note) ? { note: raw.note } : {}),
    ...(isString(raw.fileUrl) ? { fileUrl: raw.fileUrl } : {}),
    ...(isString(raw.fileName) ? { fileName: raw.fileName } : {}),
    ...(typeof raw.fileSize === 'number' ? { fileSize: raw.fileSize } : {}),
    ...(isString(raw.mimeType) ? { mimeType: raw.mimeType } : {}),
    ...(isString(raw.uploadedBy) ? { uploadedBy: raw.uploadedBy } : {}),
    ...(isString(raw.uploadedAt) ? { uploadedAt: raw.uploadedAt } : {}),
    sort_order: typeof raw.sort_order === 'number' ? raw.sort_order : 0,
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

function coerceAttachment(raw: unknown): ChangeAttachment | null {
  if (!isObject(raw)) return null
  if (!isString(raw.id) || !isString(raw.url)) return null
  return {
    id: raw.id,
    type: raw.type === 'url' ? 'url' : 'file',
    url: raw.url,
    label: isString(raw.label) ? raw.label : 'Untitled',
    ...(isString(raw.fileName) ? { fileName: raw.fileName } : {}),
    ...(typeof raw.fileSize === 'number' ? { fileSize: raw.fileSize } : {}),
    ...(isString(raw.mimeType) ? { mimeType: raw.mimeType } : {}),
    ...(isString(raw.uploadedBy) ? { uploadedBy: raw.uploadedBy } : {}),
    ...(isString(raw.uploadedAt) ? { uploadedAt: raw.uploadedAt } : {}),
  }
}

function coerceAttachments(raw: unknown): ChangeAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw.map(coerceAttachment).filter((a): a is ChangeAttachment => a !== null)
}

function coercePlanItem(raw: unknown): PlanItem | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()
  const category = isString(raw.category) && VALID_PLAN_ITEM_CATEGORIES.has(raw.category)
    ? raw.category as PlanItemCategory
    : 'still_to_decide'
  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    text: isString(raw.text) ? raw.text : '',
    category,
    ...(isString(raw.created_by) ? { created_by: raw.created_by } : {}),
    ...(isString(raw.updated_by) ? { updated_by: raw.updated_by } : {}),
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

function coercePlanItems(raw: unknown): PlanItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(coercePlanItem).filter((i): i is PlanItem => i !== null)
}

function coerceOpenItem(raw: unknown): OpenItem | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()
  let status: OpenItemStatus = 'open'
  if (isString(raw.status) && VALID_OPEN_ITEM_STATUSES.has(raw.status)) {
    status = raw.status as OpenItemStatus
  }
  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    text: isString(raw.text) ? raw.text : '',
    status,
    ...(isString(raw.resolved_at) ? { resolved_at: raw.resolved_at } : {}),
    ...(isString(raw.resolved_by) ? { resolved_by: raw.resolved_by } : {}),
    ...(isString(raw.resolution_note) ? { resolution_note: raw.resolution_note } : {}),
    ...(isString(raw.waiting_on) ? { waiting_on: raw.waiting_on } : {}),
    ...(isString(raw.created_by) ? { created_by: raw.created_by } : {}),
    ...(isString(raw.updated_by) ? { updated_by: raw.updated_by } : {}),
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

function coerceOpenItems(raw: unknown): OpenItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(coerceOpenItem).filter((i): i is OpenItem => i !== null)
}

/** Migrate a PlanItem from still_to_decide to an OpenItem with status 'open' */
function migratePlanItemToOpenItem(item: PlanItem): OpenItem {
  return {
    id: item.id,
    text: item.text,
    status: 'open',
    ...(item.created_by ? { created_by: item.created_by } : {}),
    ...(item.updated_by ? { updated_by: item.updated_by } : {}),
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

function coerceMilestone(raw: unknown): Milestone | null {
  if (!isObject(raw)) return null
  if (!isString(raw.id) || !isString(raw.event)) return null
  return {
    id: raw.id,
    event: raw.event,
    label: isString(raw.label) ? raw.label : raw.event,
    ...(isString(raw.actor) ? { actor: raw.actor } : {}),
    ...(isString(raw.note) ? { note: raw.note } : {}),
    timestamp: isString(raw.timestamp) ? raw.timestamp : new Date().toISOString(),
    ...(isString(raw.relatedEntityId) ? { relatedEntityId: raw.relatedEntityId } : {}),
  }
}

function coerceMilestones(raw: unknown): Milestone[] {
  if (!Array.isArray(raw)) return []
  return raw.map(coerceMilestone).filter((m): m is Milestone => m !== null)
}

/** Map legacy plan status to current */
function migratePlanStatus(status: string): PlanStatus {
  switch (status) {
    case 'draft': return 'working'
    case 'shared': return 'working'
    case 'confirmed': return 'approved'
    case 'acknowledged': return 'approved'
    default:
      if (VALID_PLAN_STATUSES.has(status)) return status as PlanStatus
      return 'working'
  }
}

/** Map v1 change status to v2 */
function migrateChangeStatus(status: string): ChangeStatus {
  switch (status) {
    case 'proposed': return 'requested'
    case 'approved': return 'approved_by_homeowner'
    case 'not_approved': return 'closed'
    default:
      if (VALID_CHANGE_STATUSES.has(status)) return status as ChangeStatus
      return 'requested'
  }
}

function coerceChange(raw: unknown): SummaryChange | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()

  // Determine status — handle both v1 and v2 statuses
  let status: ChangeStatus = 'requested'
  if (isString(raw.status)) {
    if (VALID_CHANGE_STATUSES.has(raw.status)) {
      status = raw.status as ChangeStatus
    } else if (LEGACY_CHANGE_STATUSES.has(raw.status)) {
      status = migrateChangeStatus(raw.status)
    }
  }

  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    title: isString(raw.title) ? raw.title : 'Untitled',
    ...(isString(raw.description) ? { description: raw.description } : {}),
    ...(isString(raw.rationale) ? { rationale: raw.rationale } : {}),
    ...(isString(raw.requested_by) ? { requested_by: raw.requested_by } : {}),
    status,
    ...(isString(raw.proposed_cost_impact) ? { proposed_cost_impact: raw.proposed_cost_impact } : {}),
    ...(isString(raw.proposed_schedule_impact) ? { proposed_schedule_impact: raw.proposed_schedule_impact } : {}),
    ...(isString(raw.cost_impact) ? { cost_impact: raw.cost_impact } : {}),
    ...(isString(raw.schedule_impact) ? { schedule_impact: raw.schedule_impact } : {}),
    ...(isString(raw.contractor_response) ? { contractor_response: raw.contractor_response } : {}),
    ...(isString(raw.final_note) ? { final_note: raw.final_note } : {}),
    ...(isString(raw.private_notes) ? { private_notes: raw.private_notes } : {}),
    incorporated: raw.incorporated === true,
    ...(isString(raw.incorporated_at) ? { incorporated_at: raw.incorporated_at } : {}),
    ...(isString(raw.incorporated_by) ? { incorporated_by: raw.incorporated_by } : {}),
    ...(typeof raw.changed_since_accepted === 'boolean' ? { changed_since_accepted: raw.changed_since_accepted } : {}),
    ...(Array.isArray(raw.affects_sections) ? { affects_sections: raw.affects_sections.filter((s: unknown): s is string => typeof s === 'string') } : {}),
    ...(Array.isArray(raw.open_items) && raw.open_items.length > 0 ? { open_items: coerceOpenItems(raw.open_items) } : {}),
    links: coerceLinks(raw.links),
    attachments: coerceAttachments(raw.attachments),
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

/** Migrate a v1 openDecision to a v2 PlanItem */
function migrateDecisionToPlanItem(raw: unknown): PlanItem | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()

  let text = isString(raw.title) ? raw.title : 'Untitled'

  // Preserve description
  if (isString(raw.description) && raw.description.trim()) {
    text += ` — ${raw.description.trim()}`
  }

  // Preserve resolution
  if (isString(raw.resolution) && raw.resolution.trim()) {
    text += ` [Resolution: ${raw.resolution.trim()}]`
  }

  // Preserve non-open status as context
  if (isString(raw.status) && raw.status !== 'open') {
    const statusLabel = raw.status === 'decided' ? 'closed' : raw.status
    text += ` (was: ${statusLabel})`
  }

  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    text,
    category: 'still_to_decide',
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

/** Migrate v1 payload to v2 */
function migrateV1toV2(obj: Record<string, unknown>): ProjectSummaryPayload {
  const summaryRaw = isObject(obj.summary) ? obj.summary : {}
  const ts = new Date().toISOString()

  // Migrate openDecisions to still_to_decide PlanItems
  const stillToDecide: PlanItem[] = Array.isArray(obj.openDecisions)
    ? (obj.openDecisions as unknown[])
        .map(migrateDecisionToPlanItem)
        .filter((d): d is PlanItem => d !== null)
    : []

  return {
    version: 2,
    plan: {
      scope: isString(summaryRaw.text) ? summaryRaw.text : '',
      included: [],
      not_included: [],
      still_to_decide: [],
      open_items: stillToDecide.map(migratePlanItemToOpenItem),
      status: 'working',
      content_changed_since_status: false,
      updated_at: isString(summaryRaw.updated_at) ? summaryRaw.updated_at : ts,
    },
    budget: {
      ...(isString(summaryRaw.baseline_amount) ? { baseline_amount: summaryRaw.baseline_amount } : {}),
      ...(isString(summaryRaw.budget_note) ? { budget_note: summaryRaw.budget_note } : {}),
      updated_at: isString(summaryRaw.updated_at) ? summaryRaw.updated_at : ts,
    },
    documents: Array.isArray(obj.documents)
      ? (obj.documents as unknown[]).map(coerceDocument).filter((d): d is SummaryDocument => d !== null)
      : [],
    changes: Array.isArray(obj.changes)
      ? (obj.changes as unknown[]).map(coerceChange).filter((c): c is SummaryChange => c !== null)
      : [],
    milestones: [],
  }
}

/** Coerce a v2 payload (validate all fields) */
function coerceV2(obj: Record<string, unknown>): ProjectSummaryPayload {
  const planRaw = isObject(obj.plan) ? obj.plan : {}
  const budgetRaw = isObject(obj.budget) ? obj.budget : {}
  const ts = new Date().toISOString()

  // Handle both current and legacy plan statuses
  let planStatus: PlanStatus = 'working'
  if (isString(planRaw.status)) {
    if (VALID_PLAN_STATUSES.has(planRaw.status)) {
      planStatus = planRaw.status as PlanStatus
    } else if (LEGACY_PLAN_STATUSES.has(planRaw.status)) {
      planStatus = migratePlanStatus(planRaw.status)
    }
  }

  // Migrate still_to_decide items into open_items if open_items doesn't exist yet
  const existingOpenItems = coerceOpenItems(planRaw.open_items)
  const legacyStillToDecide = coercePlanItems(planRaw.still_to_decide)
  // If we have still_to_decide items but no open_items, migrate them
  const migratedOpenItems = existingOpenItems.length > 0
    ? existingOpenItems
    : legacyStillToDecide.map(migratePlanItemToOpenItem)
  // Keep still_to_decide empty after migration — open_items is now authoritative
  const remainingStillToDecide = existingOpenItems.length > 0 ? legacyStillToDecide : []

  return {
    version: 2,
    plan: {
      scope: isString(planRaw.scope) ? planRaw.scope : '',
      included: coercePlanItems(planRaw.included),
      not_included: coercePlanItems(planRaw.not_included),
      still_to_decide: remainingStillToDecide,
      open_items: migratedOpenItems,
      status: planStatus,
      ...(isString(planRaw.status_changed_at) ? { status_changed_at: planRaw.status_changed_at } : {}),
      ...(typeof planRaw.content_changed_since_status === 'boolean'
        ? { content_changed_since_status: planRaw.content_changed_since_status }
        : { content_changed_since_status: false }),
      ...(isString(planRaw.approved_at) ? { approved_at: planRaw.approved_at } : {}),
      ...(isString(planRaw.approved_by) ? { approved_by: planRaw.approved_by } : {}),
      ...(isString(planRaw.unlocked_at) ? { unlocked_at: planRaw.unlocked_at } : {}),
      ...(isString(planRaw.unlocked_by) ? { unlocked_by: planRaw.unlocked_by } : {}),
      ...(isString(planRaw.unlock_reason) ? { unlock_reason: planRaw.unlock_reason } : {}),
      ...(typeof planRaw.revision_number === 'number' ? { revision_number: planRaw.revision_number } : {}),
      updated_at: isString(planRaw.updated_at) ? planRaw.updated_at : ts,
    },
    budget: {
      ...(isString(budgetRaw.baseline_amount) ? { baseline_amount: budgetRaw.baseline_amount } : {}),
      ...(isString(budgetRaw.budget_note) ? { budget_note: budgetRaw.budget_note } : {}),
      updated_at: isString(budgetRaw.updated_at) ? budgetRaw.updated_at : ts,
    },
    documents: Array.isArray(obj.documents)
      ? (obj.documents as unknown[]).map(coerceDocument).filter((d): d is SummaryDocument => d !== null)
      : [],
    changes: Array.isArray(obj.changes)
      ? (obj.changes as unknown[]).map(coerceChange).filter((c): c is SummaryChange => c !== null)
      : [],
    milestones: coerceMilestones(obj.milestones),
  }
}

export function ensureShape(raw: unknown): ProjectSummaryPayload {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROJECT_SUMMARY_PAYLOAD
  const obj = raw as Record<string, unknown>

  // v2 payload — validate and coerce
  if (obj.version === 2) {
    return coerceV2(obj)
  }

  // v1 payload (version === 1 or missing) — migrate to v2
  return migrateV1toV2(obj)
}
