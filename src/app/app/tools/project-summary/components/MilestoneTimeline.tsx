'use client'

import { useState } from 'react'
import type { Milestone } from '@/data/project-summary'

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

const EVENT_ICONS: Record<string, string> = {
  plan_draft: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  plan_shared: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  plan_confirmed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  plan_acknowledged: 'M20 6L9 17l-5-5',
  change_incorporated: 'M12 5v14M5 12h14',
  change_approved: 'M9 12l2 2 4-4',
}

function getEventIcon(event: string): string {
  return EVENT_ICONS[event] || 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (milestones.length === 0) return null

  // Show most recent first
  const sorted = [...milestones].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-5 py-4 text-left"
      >
        <svg
          className={`w-4 h-4 text-cream/30 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-sm font-semibold text-cream/80 flex-1">Milestones</h2>
        <span className="text-[11px] text-cream/30 tabular-nums">{milestones.length}</span>
      </button>

      {isOpen && (
        <div className="px-5 pb-5">
          <div className="relative ml-3 border-l border-cream/[0.08]">
            {sorted.map((milestone) => (
              <div key={milestone.id} className="relative pl-6 pb-4 last:pb-0">
                {/* Dot on timeline */}
                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-cream/10 border border-cream/20" />

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={getEventIcon(milestone.event)} />
                    </svg>
                    <span className="text-xs text-cream/60">{milestone.label}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-cream/25">
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
                    <p className="text-[10px] text-cream/30 mt-0.5">{milestone.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
