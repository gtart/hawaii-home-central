import type { ActivityFeedEvent } from '@/hooks/useActivityFeed'

export const TOOL_LABEL: Record<string, string> = {
  punchlist: 'Fix List',
  finish_decisions: 'Selections',
  mood_boards: 'Mood Boards',
  before_you_sign: 'Contract Checklist',
}

export const TOOL_BASE: Record<string, string> = {
  punchlist: '/app/tools/punchlist',
  finish_decisions: '/app/tools/finish-decisions',
  mood_boards: '/app/tools/mood-boards',
  before_you_sign: '/app/tools/before-you-sign',
}

export function eventHref(event: ActivityFeedEvent): string {
  const base = TOOL_BASE[event.toolKey] || '/app'
  if (!event.collectionId) return base

  // Decision-level deep link
  if (event.toolKey === 'finish_decisions' && event.entityType === 'decision' && event.entityId) {
    return `${base}/${event.collectionId}/decision/${event.entityId}`
  }

  return `${base}/${event.collectionId}`
}

export const FILTER_CHIPS: { key: string | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: 'punchlist', label: 'Fix List' },
  { key: 'finish_decisions', label: 'Selections' },
  { key: 'mood_boards', label: 'Mood Boards' },
  { key: 'before_you_sign', label: 'Contract Checklist' },
]

/** Group day label for activity list */
export function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (eventDay.getTime() === today.getTime()) return 'Today'
  if (eventDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}
