'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { relativeTime } from '@/lib/relativeTime'
import { TOOL_LABEL, eventHref } from '@/lib/activityHelpers'
import { ActivityPanel } from '@/components/app/ActivityPanel'

const EXCERPT_LIMIT = 5

export function DashboardFeed() {
  const { events, isLoading } = useActivityFeed()
  const [showPanel, setShowPanel] = useState(false)

  const excerptEvents = events.slice(0, EXCERPT_LIMIT)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wider text-cream/30">Recent Activity</h2>
        <button
          type="button"
          onClick={() => setShowPanel(true)}
          className="flex items-center gap-1.5 text-xs text-cream/30 hover:text-cream/50 transition-colors"
          title="View all activity"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View all
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-cream/5 rounded w-3/4" />
          ))}
        </div>
      ) : excerptEvents.length === 0 ? (
        <p className="text-xs text-cream/20">No recent activity.</p>
      ) : (
        <div>
          {excerptEvents.map((event) => (
            <Link
              key={event.id}
              href={eventHref(event)}
              className="block py-2.5 border-b border-cream/5 last:border-0 -mx-2 px-2 hover:bg-cream/5 rounded transition-colors"
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
            </Link>
          ))}
        </div>
      )}

      {showPanel && <ActivityPanel onClose={() => setShowPanel(false)} />}
    </div>
  )
}
