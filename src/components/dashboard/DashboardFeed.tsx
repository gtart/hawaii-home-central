'use client'

import { useState } from 'react'
import { useActivityFeed } from '@/hooks/useActivityFeed'

const TOOL_LABEL: Record<string, string> = {
  punchlist: 'Fix List',
  finish_decisions: 'Selections',
  mood_boards: 'Mood Boards',
}

const FILTER_CHIPS: { key: string | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: 'punchlist', label: 'Fix List' },
  { key: 'finish_decisions', label: 'Selections' },
  { key: 'mood_boards', label: 'Mood Boards' },
]

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function DashboardFeed() {
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined)
  const { events, isLoading, hasMore, loadMore } = useActivityFeed(activeFilter)

  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-cream/30 mb-3">Recent Activity</h2>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setActiveFilter(chip.key)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              activeFilter === chip.key
                ? 'bg-sandstone/20 text-sandstone'
                : 'bg-cream/5 text-cream/40 hover:bg-cream/10 hover:text-cream/60'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-cream/5 rounded w-3/4" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-cream/20">No recent activity.</p>
      ) : (
        <div>
          {events.map((event) => (
            <div
              key={event.id}
              className="py-2.5 border-b border-cream/5 last:border-0 -mx-2 px-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-cream/60 flex-1 min-w-0 truncate">
                  {event.summaryText}
                </span>
                <span className="text-[11px] text-cream/25 shrink-0">
                  {TOOL_LABEL[event.toolKey] || event.toolKey}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {event.actorName && (
                  <span className="text-[11px] text-cream/30">{event.actorName}</span>
                )}
                <span className="text-[11px] text-cream/20">
                  {relativeTime(event.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              className="mt-3 text-xs text-cream/30 hover:text-cream/50 transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  )
}
