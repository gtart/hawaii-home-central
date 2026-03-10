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

  const collUrl = `${base}/${event.collectionId}`

  // Decision-level deep link (workspace-first: no collectionId in URL)
  if (event.toolKey === 'finish_decisions' && event.entityType === 'decision' && event.entityId) {
    const params = new URLSearchParams()
    if (event.action === 'commented') {
      params.set('comments', '1')
      // Use structured metadata for option + comment deep linking
      const meta = event.metadata
      if (meta) {
        if (typeof meta.refEntityId === 'string') params.set('optionId', meta.refEntityId)
        if (typeof meta.commentId === 'string') params.set('commentId', meta.commentId)
      }
    }
    const qs = params.toString()
    return qs ? `${base}/decision/${event.entityId}?${qs}` : `${base}/decision/${event.entityId}`
  }

  // Punchlist item deep link — scroll to item
  if (event.toolKey === 'punchlist' && event.entityType === 'item' && event.entityId) {
    return `${collUrl}?highlight=${event.entityId}`
  }

  // Share token actions — open share modal
  if (event.entityType === 'share_token') {
    return `${collUrl}?openShare=1`
  }

  return collUrl
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
