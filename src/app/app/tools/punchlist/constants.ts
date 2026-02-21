import type { PunchlistStatus } from './types'

export const STATUS_CONFIG: Record<PunchlistStatus, { label: string; dot: string; bg: string; text: string }> = {
  OPEN: { label: 'Open', dot: 'bg-red-400', bg: 'bg-red-400/10', text: 'text-red-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400' },
  DONE: { label: 'Done', dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
}

export const STATUS_CYCLE: PunchlistStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE']

export const PRIORITY_CONFIG = {
  HIGH: { label: 'High', className: 'bg-red-400/15 text-red-400' },
  MED: { label: 'Med', className: 'bg-amber-400/15 text-amber-400' },
  LOW: { label: 'Low', className: 'bg-cream/10 text-cream/40' },
} as const
