// ============================================================================
// V1 TYPES (DEPRECATED - kept for migration only)
// ============================================================================

export const V1_CATEGORY_OPTIONS = [
  'Appliance',
  'Cabinetry',
  'Countertop',
  'Fixture',
  'Flooring',
  'Hardware',
  'Lighting',
  'Paint',
  'Tile',
  'Window/Door',
  'Other',
] as const

export const V1_STATUS_CONFIG = {
  deciding: { label: 'Deciding', variant: 'default' as const },
  awaiting_approval: { label: 'Awaiting Approval', variant: 'default' as const },
  final: { label: 'Final', variant: 'accent' as const },
  complete: { label: 'Complete', variant: 'accent' as const },
} as const

export type V1DecisionStatus = keyof typeof V1_STATUS_CONFIG
export type V1NeededByStage =
  | 'planning_design'
  | 'order_long_lead'
  | 'before_rough_in'
  | 'before_close_walls'
  | 'before_tile_cabs'
  | 'closeout'

export interface V1DecisionLink {
  id: string
  label: string
  url: string
}

export interface V1DecisionItem {
  id: string
  room: string
  category: string
  name: string
  specs: string
  where: string
  status: V1DecisionStatus
  neededBy: V1NeededByStage | null
  links: V1DecisionLink[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface V1FinishDecisionsPayload {
  version: 1
  items: V1DecisionItem[]
}

// ============================================================================
// V2 TYPES (DEPRECATED - kept for migration only)
// ============================================================================

export type V2NeededByStage =
  | 'planning_design'
  | 'order_long_lead'
  | 'before_rough_in'
  | 'before_close_walls'
  | 'before_tile_cabs'
  | 'closeout'

export type V2RoomTypeId = 'kitchen' | 'bathroom' | 'exterior' | 'whole_house' | 'other'

export interface V2Room {
  id: string
  name: string
  type: V2RoomTypeId
  createdAt: string
}

export type V2DecisionStatus = 'exploring' | 'comparing' | 'decided' | 'ordered' | 'complete'

export interface V2Decision {
  id: string
  roomId: string
  category: string
  neededBy: V2NeededByStage | null
  status: V2DecisionStatus
  selectedOptionId: string | null
  notes: string
  isFromStarterPack: boolean
  createdAt: string
  updatedAt: string
}

export interface V2DecisionLink {
  id: string
  url: string
  label: string
}

export interface V2DecisionOption {
  id: string
  decisionId: string
  name: string
  specs: string
  where: string
  estimatedCost: string
  links: V2DecisionLink[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface V2FinishDecisionsPayload {
  version: 2
  rooms: V2Room[]
  decisions: V2Decision[]
  options: V2DecisionOption[]
}

// ============================================================================
// V3 TYPES (CURRENT)
// ============================================================================

// Room Types (expanded from V2)
export const ROOM_TYPE_OPTIONS_V3 = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'laundry_room', label: 'Laundry Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'doors', label: 'Doors' },
  { value: 'windows', label: 'Windows' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'other', label: 'Custom Area' },
] as const

export type RoomTypeV3 = (typeof ROOM_TYPE_OPTIONS_V3)[number]['value']

// Room type emoji icons
export const ROOM_EMOJI_MAP: Record<RoomTypeV3, string> = {
  kitchen: '🍳',
  bathroom: '🚿',
  living_room: '🛋️',
  laundry_room: '🧺',
  bedroom: '🛏️',
  hallway: '🏠',
  stairs: '🪜',
  doors: '🚪',
  windows: '🪟',
  flooring: '🪵',
  landscaping: '🌿',
  other: '✏️',
}

// Decision Statuses (simplified from V2)
export const STATUS_CONFIG_V3 = {
  deciding: { label: 'Deciding', variant: 'deciding' as const },
  selected: { label: 'Selected', variant: 'selected' as const },
  ordered: { label: 'Ordered', variant: 'ordered' as const },
  done: { label: 'Done', variant: 'done' as const },
} as const

export type StatusV3 = keyof typeof STATUS_CONFIG_V3

// Link (simplified - just URL, no label)
export interface LinkV3 {
  id: string
  url: string
  // Fetched OG/page metadata (optional, populated async after adding)
  linkTitle?: string
  linkDescription?: string
  linkImage?: string
}

// Kit author type (who curated an ideas pack)
export type KitAuthorType = 'hhc' | 'designer' | 'vendor'

// Tracks where an option came from (null/absent = user-created)
export interface OptionOriginV3 {
  kitId: string
  kitLabel: string
  author: KitAuthorType
}

// Single image attached to an option
export interface OptionImageV3 {
  id: string
  url: string
  thumbnailUrl?: string
  label?: string       // alt text, filename, or user label
  sourceUrl?: string   // webpage the image was imported from
}

// Option (nested in decision)
export interface OptionV3 {
  id: string
  name: string
  notes: string // Combined specs + notes
  urls: LinkV3[]
  isSelected?: boolean // Marks the chosen option
  kind?: 'image' | 'text'           // defaults to 'text' if absent
  imageUrl?: string                  // legacy full-size URL (use images[] for new code)
  thumbnailUrl?: string              // legacy ~400px thumbnail (use images[] for new code)
  images?: OptionImageV3[]           // multi-image gallery
  heroImageId?: string | null        // id of the primary image (null = first in images[])
  votes?: Record<string, 'up' | 'down'>  // keyed by user email
  origin?: OptionOriginV3            // set when added by an ideas pack
  createdAt: string
  updatedAt: string
}

// Selection Comment (stored in decision payload)
export interface SelectionComment {
  id: string
  text: string
  authorName: string
  authorEmail: string
  createdAt: string
  refOptionId?: string    // if this comment references a specific idea card
  refOptionLabel?: string // display name of the referenced card
}

// System selection keys (e.g. "Uncategorized" — cannot be finalized)
export type SystemSelectionKey = 'uncategorized'

// Decision (nested in room)
export interface DecisionV3 {
  id: string
  title: string // "Countertop" (was "category" in V2)
  status: StatusV3
  notes: string // Combined specs + notes
  options: OptionV3[] // Nested
  dueDate?: string | null // ISO date string or null for TBD
  dismissedSuggestionKeys?: string[] // Heuristic guidance dismissed by user
  comments?: SelectionComment[] // Selection-level comment thread
  picksByUser?: Record<string, string | null>  // email → optionId (user's "My pick")
  originKitId?: string // set when entire decision was added by a kit
  systemKey?: SystemSelectionKey // system-managed selection (e.g. 'uncategorized')
  createdAt: string
  updatedAt: string
}

// Cover image for room cards (boards view)
export interface RoomCoverImage {
  type: 'upload' | 'idea'
  url: string
  ideaId?: string // set when type === 'idea'
}

// Room (top-level, contains decisions)
export interface RoomV3 {
  id: string
  type: RoomTypeV3
  name: string
  decisions: DecisionV3[] // Nested
  appliedKitIds?: string[] // tracks which ideas packs have been applied
  coverImage?: RoomCoverImage // optional cover for boards view
  systemKey?: string // 'global_uncategorized' for global unsorted room
  createdAt: string
  updatedAt: string
}

// V3 Payload (nested structure)
export interface FinishDecisionsPayloadV3 {
  version: 3
  rooms: RoomV3[]
}

// ============================================================================
// DEFAULT DECISIONS BY ROOM TYPE
// ============================================================================

// Used by the onboarding flow for batch room creation
export interface RoomSelection {
  type: RoomTypeV3
  name: string
  template: 'standard' | 'none'
}

// Loaded from editable JSON — edit src/data/default-selections.json to change
import defaultSelectionsJson from './default-selections.json'

export const DEFAULT_DECISIONS_BY_ROOM_TYPE: Record<RoomTypeV3, string[]> =
  defaultSelectionsJson.decisionsByRoomType as Record<RoomTypeV3, string[]>

export const SELECTION_EMOJI_MAP: Record<string, string> =
  defaultSelectionsJson.selectionEmojis
