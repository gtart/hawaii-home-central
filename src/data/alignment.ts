// ---------------------------------------------------------------------------
// Project Alignment — data types, enums, config, and public share helpers.
// Follows the same payload-in-ToolCollection pattern as Punchlist/Selections.
// ---------------------------------------------------------------------------

// ── Type Enums ──

export type AlignmentItemType =
  | 'change_request'
  | 'scope_clarification'
  | 'scope_omission'
  | 'plan_mismatch'
  | 'design_correction'
  | 'open_question'
  | 'allowance_upgrade'
  | 'site_condition'
  | 'version_conflict'

export type AlignmentItemStatus =
  | 'open'
  | 'waiting_on_homeowner'
  | 'waiting_on_contractor'
  | 'needs_pricing'
  | 'needs_decision'
  | 'accepted'        // workflow state — "we agree on this answer", NOT legal approval
  | 'rejected'
  | 'implemented'     // distinct from accepted — "this has been built/executed"
  | 'superseded'

export type CostImpactStatus = 'none' | 'possible' | 'confirmed' | 'unknown'
export type ScheduleImpactStatus = 'none' | 'possible' | 'confirmed' | 'unknown'
export type WaitingOnRole = 'homeowner' | 'contractor' | 'designer' | 'vendor' | 'none'

export type ArtifactType =
  | 'selection'
  | 'fix_item'
  | 'document'
  | 'plan'
  | 'photo'
  | 'room'
  | 'external_link'

export type RelationshipType = 'references' | 'affects' | 'supersedes' | 'source_of_truth'

// ── Interfaces ──

export interface AlignmentArtifactLink {
  id: string
  artifact_type: ArtifactType
  relationship: RelationshipType
  tool_key?: string        // e.g. 'finish_decisions', 'punchlist'
  collection_id?: string   // ToolCollection.id of referenced tool
  entity_id?: string       // ID within that tool's payload
  entity_label: string     // denormalized display name
  url?: string             // for external_link type
  created_at: string
}

/** Metadata-only — actual files stored via upload infra (S3/CDN). */
export interface AlignmentPhoto {
  id: string
  url: string              // CDN URL from upload endpoint
  thumbnailUrl?: string    // CDN thumbnail URL
  caption?: string
  created_at: string
}

export interface AlignmentGuestResponse {
  id: string
  share_token: string
  respondent_name: string
  respondent_email?: string
  understanding_of_issue?: string
  included_not_included_unsure?: 'included' | 'not_included' | 'unsure'
  cost_impact?: string
  schedule_impact?: string
  suggested_resolution?: string
  note?: string
  created_at: string
}

export interface AlignmentItem {
  id: string
  itemNumber: number
  title: string
  type: AlignmentItemType
  status: AlignmentItemStatus
  area_label: string
  summary: string
  original_expectation: string
  current_issue: string
  proposed_resolution: string
  current_agreed_answer: string
  cost_impact_status: CostImpactStatus
  cost_impact_amount_text: string
  schedule_impact_status: ScheduleImpactStatus
  schedule_impact_text: string
  waiting_on_role: WaitingOnRole
  artifact_links: AlignmentArtifactLink[]
  photos: AlignmentPhoto[]
  guest_responses: AlignmentGuestResponse[]
  created_by_name?: string
  created_by_email?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface AlignmentPayload {
  version: 1
  nextItemNumber: number
  items: AlignmentItem[]
}

// ── Defaults ──

export const DEFAULT_ALIGNMENT_PAYLOAD: AlignmentPayload = {
  version: 1,
  nextItemNumber: 1,
  items: [],
}

// ── Valid enum sets (for validation) ──

export const VALID_ITEM_TYPES: ReadonlySet<string> = new Set<AlignmentItemType>([
  'change_request', 'scope_clarification', 'scope_omission', 'plan_mismatch',
  'design_correction', 'open_question', 'allowance_upgrade', 'site_condition',
  'version_conflict',
])

export const VALID_STATUSES: ReadonlySet<string> = new Set<AlignmentItemStatus>([
  'open', 'waiting_on_homeowner', 'waiting_on_contractor', 'needs_pricing',
  'needs_decision', 'accepted', 'rejected', 'implemented', 'superseded',
])

export const VALID_COST_IMPACT: ReadonlySet<string> = new Set<CostImpactStatus>([
  'none', 'possible', 'confirmed', 'unknown',
])

export const VALID_SCHEDULE_IMPACT: ReadonlySet<string> = new Set<ScheduleImpactStatus>([
  'none', 'possible', 'confirmed', 'unknown',
])

export const VALID_WAITING_ON: ReadonlySet<string> = new Set<WaitingOnRole>([
  'homeowner', 'contractor', 'designer', 'vendor', 'none',
])

/** Statuses that indicate the item is "resolved" (no longer active). */
export const RESOLVED_STATUSES: ReadonlySet<AlignmentItemStatus> = new Set([
  'accepted', 'rejected', 'implemented', 'superseded',
])

/** Statuses that indicate the item is actively being worked on. */
export const ACTIVE_STATUSES: ReadonlySet<AlignmentItemStatus> = new Set([
  'open', 'waiting_on_homeowner', 'waiting_on_contractor',
  'needs_pricing', 'needs_decision',
])

// ---------------------------------------------------------------------------
// Public (share link) shapes — whitelist of fields safe for external viewers.
// ---------------------------------------------------------------------------

export interface PublicAlignmentItem {
  id: string                // needed for guest response endpoint
  itemNumber: number
  title: string
  type: AlignmentItemType
  status: AlignmentItemStatus
  area_label: string
  current_issue: string
  original_expectation?: string
  proposed_resolution?: string
  current_agreed_answer?: string
  cost_impact_status: CostImpactStatus
  cost_impact_amount_text?: string
  schedule_impact_status: ScheduleImpactStatus
  schedule_impact_text?: string
  waiting_on_role: WaitingOnRole
  photos: { url: string; thumbnailUrl?: string }[]
  guest_responses: AlignmentGuestResponse[]
  created_at: string
  resolved_at?: string
}

/** Whitelist-map a full AlignmentItem to a safe public shape. */
export function toPublicAlignmentItem(
  item: AlignmentItem,
  opts: { includeNotes: boolean; includePhotos: boolean }
): PublicAlignmentItem {
  return {
    id: item.id,
    itemNumber: item.itemNumber,
    title: item.title,
    type: item.type,
    status: item.status,
    area_label: item.area_label,
    current_issue: item.current_issue,
    original_expectation: opts.includeNotes ? item.original_expectation || undefined : undefined,
    proposed_resolution: opts.includeNotes ? item.proposed_resolution || undefined : undefined,
    current_agreed_answer: item.current_agreed_answer || undefined,
    cost_impact_status: item.cost_impact_status,
    cost_impact_amount_text: item.cost_impact_amount_text || undefined,
    schedule_impact_status: item.schedule_impact_status,
    schedule_impact_text: item.schedule_impact_text || undefined,
    waiting_on_role: item.waiting_on_role,
    photos: opts.includePhotos
      ? item.photos.map((p) => ({ url: p.url, thumbnailUrl: p.thumbnailUrl }))
      : [],
    guest_responses: item.guest_responses,
    created_at: item.created_at,
    resolved_at: item.resolved_at,
  }
}
