import type { ActivityFeedEvent } from '@/hooks/useActivityFeed'

// ── Verb map ──

const VERB: Record<string, string> = {
  commented: '',
  created: 'Added',
  added: 'Added',
  added_item: 'Added',
  selected: 'Selected',
  status_changed: '',
  done: 'Done',
  reopened: 'Reopened',
  shared: 'Shared link',
  moved_out: 'Moved',
  moved_in: 'Moved',
  copied: 'Copied',
  copied_in: 'Copied',
  archived: 'Archived',
  captured: 'Captured',
  sorted: 'Sorted',
  removed: 'Removed',
  removed_item: 'Removed',
  updated: 'Updated',
}

// ── Legacy parser ──

function parseLegacy(text: string, action: string): { verb: string; entityLabel: string | null; detailText: string | null } {
  const verb = VERB[action] || action

  // Try to extract quoted entity name
  const match = text.match(/"([^"]+)"/)
  if (match) {
    const entityLabel = match[1]
    // For comments, the quoted text IS the detail, not the entity
    if (action === 'commented') {
      return { verb: '', entityLabel: null, detailText: entityLabel }
    }
    // For status_changed: Changed "title" → Status
    const arrowMatch = text.match(/→\s*(.+)$/)
    if (arrowMatch) {
      return { verb, entityLabel, detailText: arrowMatch[1].trim() }
    }
    return { verb, entityLabel, detailText: null }
  }

  return { verb, entityLabel: null, detailText: null }
}

// ── Decompose event into structured parts ──

function decompose(evt: { action: string; summaryText: string; entityLabel?: string | null; detailText?: string | null }) {
  if (evt.entityLabel != null || evt.detailText != null) {
    const verb = evt.action === 'status_changed' ? '' : (VERB[evt.action] || evt.action)
    return {
      verb,
      entityLabel: evt.entityLabel ?? null,
      detailText: evt.detailText ?? null,
      isComment: evt.action === 'commented',
      isStatusChange: evt.action === 'status_changed',
    }
  }
  const parsed = parseLegacy(evt.summaryText, evt.action)
  return {
    ...parsed,
    isComment: evt.action === 'commented',
    isStatusChange: evt.action === 'status_changed',
  }
}

// ── Entity pill ──

function EntityPill({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-block bg-cream/8 text-cream/55 px-2 py-0.5 rounded-md truncate ${className}`}
      title={label}
    >
      {label}
    </span>
  )
}

// ── Full variant (ActivityPanel, DashboardFeed) ──

function FullRow({ evt }: { evt: ActivityFeedEvent }) {
  const { verb, entityLabel, detailText, isComment, isStatusChange } = decompose(evt)

  // Fallback: render raw summaryText if nothing structured
  if (!entityLabel && !detailText && !verb) {
    return <span className="text-sm text-cream/60 leading-snug">{evt.summaryText}</span>
  }

  return (
    <span className="flex flex-wrap items-center gap-1 text-sm leading-snug min-w-0">
      {/* Action verb */}
      {verb && <span className="text-cream/40 shrink-0">{verb}</span>}

      {/* Entity pill */}
      {entityLabel && (
        <EntityPill label={entityLabel} className="text-xs max-w-[140px] md:max-w-[200px]" />
      )}

      {/* Status change arrow */}
      {isStatusChange && detailText && (
        <span className="text-cream/50">→ {detailText}</span>
      )}

      {/* Comment body */}
      {isComment && detailText && (
        <span className="text-cream/40 italic truncate min-w-0">
          &ldquo;{detailText}&rdquo;
        </span>
      )}

      {/* Detail text for moves/copies (not comment, not status) */}
      {!isComment && !isStatusChange && detailText && (
        <span className="text-cream/30 text-xs truncate">{detailText}</span>
      )}

      {/* No entity or detail — just show raw text */}
      {!entityLabel && !detailText && (
        <span className="text-cream/50">{evt.summaryText}</span>
      )}
    </span>
  )
}

// ── Compact variant (Dashboard cards) ──

function CompactRow({ evt }: { evt: { action: string; summaryText: string; entityLabel?: string | null; detailText?: string | null } }) {
  const { verb, entityLabel, detailText, isComment, isStatusChange } = decompose(evt)

  if (!entityLabel && !detailText && !verb) {
    return <span className="text-cream/30 truncate">{evt.summaryText}</span>
  }

  return (
    <span className="flex items-center gap-1 min-w-0 text-[11px]">
      {verb && <span className="text-cream/35 shrink-0">{verb}</span>}
      {entityLabel && (
        <EntityPill label={entityLabel} className="text-[11px] max-w-[120px]" />
      )}
      {isStatusChange && detailText && (
        <span className="text-cream/40">→ {detailText}</span>
      )}
      {isComment && detailText && (
        <span className="text-cream/30 italic truncate min-w-0">&ldquo;{detailText}&rdquo;</span>
      )}
      {!isComment && !isStatusChange && detailText && (
        <span className="text-cream/25 truncate">{detailText}</span>
      )}
      {!entityLabel && !detailText && (
        <span className="text-cream/30 truncate">{evt.summaryText}</span>
      )}
    </span>
  )
}

// ── Inline variant (CollectionsPickerView) ──

function InlineRow({ evt, actorName }: { evt: { action: string; summaryText: string; entityLabel?: string | null; detailText?: string | null }; actorName?: string | null }) {
  const { verb, entityLabel } = decompose(evt)
  const firstName = actorName?.split(' ')[0]

  if (entityLabel) {
    const parts = [firstName, verb, entityLabel].filter(Boolean).join(' ')
    return <>{parts}</>
  }

  // Fallback
  return <>{firstName ? `${firstName}: ` : ''}{evt.summaryText}</>
}

// ── Main export ──

interface ActivityEventRowProps {
  event: ActivityFeedEvent | { action: string; summaryText: string; entityLabel?: string | null; detailText?: string | null; actorName?: string | null }
  variant: 'full' | 'compact' | 'inline'
}

export function ActivityEventRow({ event, variant }: ActivityEventRowProps) {
  if (variant === 'compact') return <CompactRow evt={event} />
  if (variant === 'inline') return <InlineRow evt={event} actorName={'actorName' in event ? event.actorName : null} />
  return <FullRow evt={event as ActivityFeedEvent} />
}
