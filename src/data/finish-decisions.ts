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
  neededBy: NeededByStage | null
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
// V2 TYPES (CURRENT)
// ============================================================================

// Needed-by stages (unchanged from v1)
export const NEEDED_BY_OPTIONS = [
  { value: 'planning_design', label: 'Planning & Design' },
  { value: 'order_long_lead', label: 'Order Long-Lead Items' },
  { value: 'before_rough_in', label: 'Before Rough-In' },
  { value: 'before_close_walls', label: 'Before Close Walls' },
  { value: 'before_tile_cabs', label: 'Before Tile/Cabinets' },
  { value: 'closeout', label: 'Closeout' },
] as const

export type NeededByStage = (typeof NEEDED_BY_OPTIONS)[number]['value']

// Room Types
export const ROOM_TYPES = [
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'whole_house', label: 'Whole House' },
  { id: 'other', label: 'Other' },
] as const

export type RoomTypeId = (typeof ROOM_TYPES)[number]['id']

// Room instance
export interface Room {
  id: string
  name: string // "Main Kitchen", "Guest Bath 2"
  type: RoomTypeId
  createdAt: string
}

// Decision statuses (updated for v2)
export const STATUS_CONFIG = {
  exploring: { label: 'Exploring', variant: 'default' as const },
  comparing: { label: 'Comparing Options', variant: 'default' as const },
  decided: { label: 'Decided', variant: 'accent' as const },
  ordered: { label: 'Ordered', variant: 'accent' as const },
  complete: { label: 'Complete', variant: 'accent' as const },
} as const

export type DecisionStatus = keyof typeof STATUS_CONFIG

// Decision = a category that needs to be decided
export interface Decision {
  id: string
  roomId: string
  category: string // "Countertop", "Flooring", "Appliance - Range"
  neededBy: NeededByStage | null
  status: DecisionStatus
  selectedOptionId: string | null // Which option user picked
  notes: string
  isFromStarterPack: boolean // Flag for cleanup later
  createdAt: string
  updatedAt: string
}

// Link within an option
export interface DecisionLink {
  id: string
  url: string // Primary (required)
  label: string // Optional description
}

// Option = one choice within a decision (for comparing)
export interface DecisionOption {
  id: string
  decisionId: string
  name: string // "Quartz Calacatta Gold", "Wolf 36\" Gas Range"
  specs: string
  where: string
  estimatedCost: string // Price tracking
  links: DecisionLink[]
  notes: string
  createdAt: string
  updatedAt: string
}

// V2 Payload
export interface FinishDecisionsPayload {
  version: 2
  rooms: Room[]
  decisions: Decision[]
  options: DecisionOption[]
}

// ============================================================================
// STARTER PACKS SYSTEM
// ============================================================================

export interface PrefilledOption {
  name: string
  specs: string
  where: string
  estimatedCost: string
  links: { url: string; label: string }[]
}

export interface StarterPackCategory {
  name: string
  neededBy: NeededByStage | null
  prefilledOptions?: PrefilledOption[] // Empty for "Default", populated for premium
}

export interface StarterPack {
  id: string
  name: string // "Default", "Hawaii Modern Kitchen", "Luxury Bath"
  roomType: RoomTypeId
  isPremium: boolean // false = free, true = requires purchase
  price?: number // For premium packs
  description: string
  categories: StarterPackCategory[]
}

// Default Starter Packs (free, hardcoded for MVP)
export const DEFAULT_STARTER_PACKS: StarterPack[] = [
  {
    id: 'default_kitchen',
    name: 'Default',
    roomType: 'kitchen',
    isPremium: false,
    description: 'Standard kitchen decision categories',
    categories: [
      { name: 'Countertop', neededBy: 'before_tile_cabs' },
      { name: 'Cabinetry', neededBy: 'order_long_lead' },
      { name: 'Appliance - Range', neededBy: 'order_long_lead' },
      { name: 'Appliance - Refrigerator', neededBy: 'order_long_lead' },
      { name: 'Appliance - Dishwasher', neededBy: 'order_long_lead' },
      { name: 'Sink & Faucet', neededBy: 'before_tile_cabs' },
      { name: 'Flooring', neededBy: 'closeout' },
      { name: 'Backsplash Tile', neededBy: 'before_tile_cabs' },
      { name: 'Hardware (Handles/Knobs)', neededBy: 'closeout' },
      { name: 'Lighting - Pendants', neededBy: 'before_close_walls' },
      { name: 'Paint', neededBy: 'closeout' },
    ],
  },
  {
    id: 'default_bathroom',
    name: 'Default',
    roomType: 'bathroom',
    isPremium: false,
    description: 'Standard bathroom decision categories',
    categories: [
      { name: 'Vanity', neededBy: 'order_long_lead' },
      { name: 'Countertop', neededBy: 'before_tile_cabs' },
      { name: 'Toilet', neededBy: 'before_close_walls' },
      { name: 'Shower/Tub', neededBy: 'before_rough_in' },
      { name: 'Shower Valve & Trim', neededBy: 'before_close_walls' },
      { name: 'Floor Tile', neededBy: 'before_tile_cabs' },
      { name: 'Shower Wall Tile', neededBy: 'before_tile_cabs' },
      { name: 'Sink & Faucet', neededBy: 'before_tile_cabs' },
      { name: 'Mirror/Medicine Cabinet', neededBy: 'closeout' },
      { name: 'Lighting', neededBy: 'before_close_walls' },
      { name: 'Paint', neededBy: 'closeout' },
    ],
  },
  {
    id: 'default_exterior',
    name: 'Default',
    roomType: 'exterior',
    isPremium: false,
    description: 'Standard exterior decision categories',
    categories: [
      { name: 'Siding Material', neededBy: 'order_long_lead' },
      { name: 'Roofing Material', neededBy: 'order_long_lead' },
      { name: 'Windows', neededBy: 'order_long_lead' },
      { name: 'Doors', neededBy: 'order_long_lead' },
      { name: 'Exterior Paint/Stain', neededBy: 'closeout' },
      { name: 'Gutters & Downspouts', neededBy: 'closeout' },
      { name: 'Outdoor Lighting', neededBy: 'before_close_walls' },
      { name: 'Landscaping', neededBy: 'closeout' },
    ],
  },
  {
    id: 'default_whole_house',
    name: 'Default',
    roomType: 'whole_house',
    isPremium: false,
    description: 'Whole-house decision categories',
    categories: [
      { name: 'HVAC System', neededBy: 'before_rough_in' },
      { name: 'Electrical Panel', neededBy: 'before_rough_in' },
      { name: 'Water Heater', neededBy: 'before_rough_in' },
      { name: 'Insulation', neededBy: 'before_close_walls' },
      { name: 'Drywall Finish Level', neededBy: 'before_close_walls' },
      { name: 'Baseboards & Trim', neededBy: 'closeout' },
      { name: 'Interior Door Style', neededBy: 'order_long_lead' },
      { name: 'Paint Color Scheme', neededBy: 'closeout' },
    ],
  },
  {
    id: 'default_other',
    name: 'Default',
    roomType: 'other',
    isPremium: false,
    description: 'Custom room decision categories',
    categories: [
      { name: 'Flooring', neededBy: 'closeout' },
      { name: 'Lighting', neededBy: 'before_close_walls' },
      { name: 'Paint', neededBy: 'closeout' },
    ],
  },
]
