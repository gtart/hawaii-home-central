'use client'

import { useState } from 'react'
import type { Milestone } from '@/data/project-summary'

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

const EVENT_ICONS: Record<string, string> = {
  // Current events
  plan_working: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  plan_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  plan_unlocked: 'M7 11V7a5 5 0 019.9-1M3 11h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V11z',
  open_item_resolved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  change_incorporated: 'M12 5v14M5 12h14',
  change_approved: 'M9 12l2 2 4-4',
  // Legacy events (from pre-migration data)
  plan_draft: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  plan_shared: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  plan_confirmed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  plan_acknowledged: 'M20 6L9 17l-5-5',
}

function getEventIcon(event: string): string {
  return EVENT_ICONS[event] || 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
}

/** Number of recent events to show in the collapsed preview */
const PREVIEW_COUNT = 3

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Filter to major milestones only — exclude noise events like sharing
  const NOISE_EVENTS = new Set(['plan_shared'])
  const majorMilestones = milestones.filter((m) => !NOISE_EVENTS.has(m.event))

  if (majorMilestones.length === 0) return null

  // Show most recent first
  const sorted = [...majorMilestones].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const previewItems = sorted.slice(0, PREVIEW_COUNT)
  const hasMore = sorted.length > PREVIEW_COUNT

  function renderEvent(milestone: (typeof sorted)[0]) {
    return (
      <div key={milestone.id} className="relative pl-6 pb-4 last:pb-0">
        {/* Dot on timeline */}
        <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-cream/15 border border-cream/35" />

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-cream/45 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={getEventIcon(milestone.event)} />
            </svg>
            <span className="text-xs text-cream/70">{milestone.label}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-cream/50">
            <span>{new Date(milestone.timestamp).toLocaleDateString()}</span>
            <span>{new Date(milestone.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {milestone.actor && (
              <>
                <span>•</span>
                <span>{milestone.actor}</span>
              </>
            )}
          </div>

          {milestone.note && (
            <p className="text-[10px] text-cream/55 mt-0.5">{milestone.note}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cream/14 bg-stone-50">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 px-5 py-4 w-full text-left"
      >
        <svg
          className={`w-3 h-3 text-cream/45 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-sm font-semibold text-cream/90 flex-1">Activity</h2>
        <span className="text-[11px] text-cream/50 tabular-nums">{majorMilestones.length} event{majorMilestones.length !== 1 ? 's' : ''}</span>
      </button>

      {/* Show content when expanded */}
      {isExpanded && (
        <div className="px-5 pb-4">
          <div className="relative ml-3 border-l border-cream/14">
            {(showAll ? sorted : previewItems).map(renderEvent)}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-2 ml-3 text-[11px] text-sandstone/50 hover:text-sandstone transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${sorted.length} events`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
