import type { ActivityFeedEvent } from '@/hooks/useActivityFeed'
import { TOOL_LABELS, TOOL_PATHS } from '@/lib/tool-registry'

/** Tool label lookup — delegates to TOOL_LABELS from tool-registry */
export const TOOL_LABEL: Record<string, string> = TOOL_LABELS

/** Tool base path lookup — delegates to TOOL_PATHS from tool-registry */
export const TOOL_BASE: Record<string, string> = TOOL_PATHS

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
        const optId = typeof meta.optionId === 'string' ? meta.optionId : (typeof meta.refEntityId === 'string' ? meta.refEntityId : null)
        if (optId) params.set('optionId', optId)
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

  // Historical PAT events → redirect to Project Summary (PAT routes deleted in Phase E)
  if (event.toolKey === 'project_alignment') {
    return '/app/tools/project-summary'
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
  { key: 'before_you_sign', label: 'Bid Checklist' },
  { key: 'project_summary', label: 'Change Log' },
  { key: 'project_alignment', label: 'Change Log' },
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
