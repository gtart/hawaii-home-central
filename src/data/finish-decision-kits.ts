import type { KitAuthorType, RoomTypeV3 } from './finish-decisions'

// ============================================================================
// Ideas Pack (Kit) Catalog
// ============================================================================

export interface KitOption {
  name: string
  notes: string
}

export interface KitDecision {
  /** Must match a decision title exactly (case-insensitive) to merge options */
  title: string
  options: KitOption[]
}

export interface FinishDecisionKit {
  id: string
  label: string
  description: string
  author: KitAuthorType
  /** Room types this kit applies to (empty = universal) */
  roomTypes: RoomTypeV3[]
  /** Decision titles this kit can enhance (used for decision-level matching) */
  decisionTitles: string[]
  decisions: KitDecision[]
}

// ============================================================================
// Kit Catalog — loaded from editable JSON
// Edit src/data/idea-packs.json to add/remove/modify idea packs
// ============================================================================

import ideaPacksJson from './idea-packs.json'

export const KITS: FinishDecisionKit[] = ideaPacksJson as FinishDecisionKit[]
