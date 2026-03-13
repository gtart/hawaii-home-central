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
export type PlanStatus = 'draft' | 'shared' | 'confirmed' | 'acknowledged'
export type PlanItemCategory = 'included' | 'not_included' | 'still_to_decide'
export type DocType = 'plan' | 'contract' | 'spec' | 'permit' | 'pricing' | 'other'
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
  still_to_decide: PlanItem[]
  status: PlanStatus
  status_changed_at?: string
  content_changed_since_status?: boolean
  updated_at: string
}

export interface SummaryChange {
  id: string
  title: string
  description?: string
  requested_by?: string
  status: ChangeStatus
  cost_impact?: string
  schedule_impact?: string
  contractor_response?: string
  final_note?: string
  private_notes?: string
  incorporated: boolean
  incorporated_at?: string
  incorporated_by?: string
  changed_since_accepted?: boolean
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
    status: 'draft',
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
  'draft', 'shared', 'confirmed', 'acknowledged',
])

export const VALID_DOC_TYPES: ReadonlySet<string> = new Set<DocType>([
  'plan', 'contract', 'spec', 'permit', 'pricing', 'other',
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
    ...(isString(raw.requested_by) ? { requested_by: raw.requested_by } : {}),
    status,
    ...(isString(raw.cost_impact) ? { cost_impact: raw.cost_impact } : {}),
    ...(isString(raw.schedule_impact) ? { schedule_impact: raw.schedule_impact } : {}),
    ...(isString(raw.contractor_response) ? { contractor_response: raw.contractor_response } : {}),
    ...(isString(raw.final_note) ? { final_note: raw.final_note } : {}),
    ...(isString(raw.private_notes) ? { private_notes: raw.private_notes } : {}),
    incorporated: raw.incorporated === true,
    ...(isString(raw.incorporated_at) ? { incorporated_at: raw.incorporated_at } : {}),
    ...(isString(raw.incorporated_by) ? { incorporated_by: raw.incorporated_by } : {}),
    ...(typeof raw.changed_since_accepted === 'boolean' ? { changed_since_accepted: raw.changed_since_accepted } : {}),
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
      still_to_decide: stillToDecide,
      status: 'draft',
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

  const planStatus = isString(planRaw.status) && VALID_PLAN_STATUSES.has(planRaw.status)
    ? planRaw.status as PlanStatus
    : 'draft'

  return {
    version: 2,
    plan: {
      scope: isString(planRaw.scope) ? planRaw.scope : '',
      included: coercePlanItems(planRaw.included),
      not_included: coercePlanItems(planRaw.not_included),
      still_to_decide: coercePlanItems(planRaw.still_to_decide),
      status: planStatus,
      ...(isString(planRaw.status_changed_at) ? { status_changed_at: planRaw.status_changed_at } : {}),
      ...(typeof planRaw.content_changed_since_status === 'boolean'
        ? { content_changed_since_status: planRaw.content_changed_since_status }
        : { content_changed_since_status: false }),
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
