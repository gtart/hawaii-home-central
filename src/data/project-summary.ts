// ---------------------------------------------------------------------------
// Project Summary — data types, defaults, and validation.
// Payload-in-ToolCollection pattern (same as Punchlist/Selections).
// ---------------------------------------------------------------------------

// ── Types ──

export type ChangeStatus = 'proposed' | 'approved' | 'not_approved'
export type DecisionStatus = 'open' | 'decided'
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
  sort_order: number
  created_at: string
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
  final_note?: string
  links: SummaryLink[]
  created_at: string
  updated_at: string
}

export interface SummaryDecision {
  id: string
  title: string
  description?: string
  status: DecisionStatus
  resolution?: string
  links: SummaryLink[]
  created_at: string
  updated_at: string
}

export interface ProjectSummaryPayload {
  version: 1
  summary: {
    text: string
    baseline_amount?: string
    approved_changes_total?: string
    current_total?: string
    budget_note?: string
    updated_at: string
  }
  documents: SummaryDocument[]
  changes: SummaryChange[]
  openDecisions: SummaryDecision[]
}

// ── Defaults ──

export const DEFAULT_PROJECT_SUMMARY_PAYLOAD: ProjectSummaryPayload = {
  version: 1,
  summary: {
    text: '',
    updated_at: new Date().toISOString(),
  },
  documents: [],
  changes: [],
  openDecisions: [],
}

// ── Valid enum sets ──

export const VALID_CHANGE_STATUSES: ReadonlySet<string> = new Set<ChangeStatus>([
  'proposed', 'approved', 'not_approved',
])

export const VALID_DECISION_STATUSES: ReadonlySet<string> = new Set<DecisionStatus>([
  'open', 'decided',
])

export const VALID_DOC_TYPES: ReadonlySet<string> = new Set<DocType>([
  'plan', 'contract', 'spec', 'permit', 'pricing', 'other',
])

export const VALID_LINK_TYPES: ReadonlySet<string> = new Set<SummaryLinkType>([
  'selection', 'fix_item', 'document',
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
    sort_order: typeof raw.sort_order === 'number' ? raw.sort_order : 0,
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

function coerceChange(raw: unknown): SummaryChange | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()
  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    title: isString(raw.title) ? raw.title : 'Untitled',
    ...(isString(raw.description) ? { description: raw.description } : {}),
    ...(isString(raw.requested_by) ? { requested_by: raw.requested_by } : {}),
    status: isString(raw.status) && VALID_CHANGE_STATUSES.has(raw.status)
      ? raw.status as ChangeStatus
      : 'proposed',
    ...(isString(raw.cost_impact) ? { cost_impact: raw.cost_impact } : {}),
    ...(isString(raw.schedule_impact) ? { schedule_impact: raw.schedule_impact } : {}),
    ...(isString(raw.final_note) ? { final_note: raw.final_note } : {}),
    links: coerceLinks(raw.links),
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

function coerceDecision(raw: unknown): SummaryDecision | null {
  if (!isObject(raw)) return null
  const ts = new Date().toISOString()
  return {
    id: isString(raw.id) ? raw.id : crypto.randomUUID(),
    title: isString(raw.title) ? raw.title : 'Untitled',
    ...(isString(raw.description) ? { description: raw.description } : {}),
    status: isString(raw.status) && VALID_DECISION_STATUSES.has(raw.status)
      ? raw.status as DecisionStatus
      : 'open',
    ...(isString(raw.resolution) ? { resolution: raw.resolution } : {}),
    links: coerceLinks(raw.links),
    created_at: isString(raw.created_at) ? raw.created_at : ts,
    updated_at: isString(raw.updated_at) ? raw.updated_at : ts,
  }
}

export function ensureShape(raw: unknown): ProjectSummaryPayload {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROJECT_SUMMARY_PAYLOAD
  const obj = raw as Record<string, unknown>

  const summaryRaw = isObject(obj.summary) ? obj.summary : {}
  const ts = new Date().toISOString()

  return {
    version: 1,
    summary: {
      text: isString(summaryRaw.text) ? summaryRaw.text : '',
      ...(isString(summaryRaw.baseline_amount) ? { baseline_amount: summaryRaw.baseline_amount } : {}),
      ...(isString(summaryRaw.approved_changes_total) ? { approved_changes_total: summaryRaw.approved_changes_total } : {}),
      ...(isString(summaryRaw.current_total) ? { current_total: summaryRaw.current_total } : {}),
      ...(isString(summaryRaw.budget_note) ? { budget_note: summaryRaw.budget_note } : {}),
      updated_at: isString(summaryRaw.updated_at) ? summaryRaw.updated_at : ts,
    },
    documents: Array.isArray(obj.documents)
      ? (obj.documents as unknown[]).map(coerceDocument).filter((d): d is SummaryDocument => d !== null)
      : [],
    changes: Array.isArray(obj.changes)
      ? (obj.changes as unknown[]).map(coerceChange).filter((c): c is SummaryChange => c !== null)
      : [],
    openDecisions: Array.isArray(obj.openDecisions)
      ? (obj.openDecisions as unknown[]).map(coerceDecision).filter((d): d is SummaryDecision => d !== null)
      : [],
  }
}
