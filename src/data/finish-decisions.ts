export const CATEGORY_OPTIONS = [
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

export const STATUS_CONFIG = {
  deciding: { label: 'Deciding', variant: 'default' as const },
  awaiting_approval: { label: 'Awaiting Approval', variant: 'default' as const },
  final: { label: 'Final', variant: 'accent' as const },
  complete: { label: 'Complete', variant: 'accent' as const },
} as const

export const NEEDED_BY_OPTIONS = [
  { value: 'planning_design', label: 'Planning & Design' },
  { value: 'order_long_lead', label: 'Order Long-Lead Items' },
  { value: 'before_rough_in', label: 'Before Rough-In' },
  { value: 'before_close_walls', label: 'Before Close Walls' },
  { value: 'before_tile_cabs', label: 'Before Tile/Cabinets' },
  { value: 'closeout', label: 'Closeout' },
] as const

export type DecisionStatus = keyof typeof STATUS_CONFIG
export type NeededByStage = (typeof NEEDED_BY_OPTIONS)[number]['value']

export interface DecisionLink {
  id: string
  label: string
  url: string
}

export interface DecisionItem {
  id: string
  room: string
  category: string
  name: string
  specs: string
  where: string
  status: DecisionStatus
  neededBy: NeededByStage | null
  links: DecisionLink[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface FinishDecisionsPayload {
  version: 1
  items: DecisionItem[]
}
