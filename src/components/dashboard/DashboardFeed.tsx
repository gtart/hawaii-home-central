'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { relativeTime } from '@/lib/relativeTime'
import { TOOL_LABEL, eventHref } from '@/lib/activityHelpers'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { ActivityEventRow } from '@/components/app/ActivityEventRow'

const EXCERPT_LIMIT = 8

export function DashboardFeed() {
  const { events, isLoading } = useActivityFeed()
  const [showPanel, setShowPanel] = useState(false)

  const excerptEvents = events.slice(0, EXCERPT_LIMIT)
  const hasMore = events.length > EXCERPT_LIMIT

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-wider text-cream/30">What changed</h2>
        {events.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPanel(true)}
            className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
          >
            View all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-cream/5 rounded w-3/4" />
          ))}
        </div>
      ) : excerptEvents.length === 0 ? (
        <div className="bg-basalt-50 rounded-card border border-cream/8 px-4 py-5 text-center">
          <p className="text-sm text-cream/40">No activity yet.</p>
          <p className="text-xs text-cream/25 mt-1">Changes you make to your tools will show up here.</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {excerptEvents.map((event) => (
            <Link
              key={event.id}
              href={eventHref(event)}
              className="group flex items-start gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-cream/5 transition-colors"
            >
              <span className="flex-1 min-w-0">
                <span className="block">
                  <ActivityEventRow event={event} variant="full" />
                </span>
                <span className="flex items-center gap-2 mt-0.5">
                  {event.actorName && (
                    <span className="text-[11px] text-cream/30">{event.actorName.split(' ')[0]}</span>
                  )}
                  <span className="text-[11px] text-cream/20">
                    {relativeTime(event.createdAt)}
                  </span>
                </span>
              </span>
              <span className="text-[10px] text-cream/20 shrink-0 mt-1 hidden sm:inline">
                {TOOL_LABEL[event.toolKey] || event.toolKey}
              </span>
            </Link>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowPanel(true)}
              className="block w-full text-center text-xs text-cream/30 hover:text-cream/50 transition-colors py-2 mt-1"
            >
              View older activity
            </button>
          )}
        </div>
      )}

      {showPanel && <ActivityPanel onClose={() => setShowPanel(false)} />}
    </div>
  )
}
