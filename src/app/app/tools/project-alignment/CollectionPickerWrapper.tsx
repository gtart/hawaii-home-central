'use client'

import { useState } from 'react'
import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'

export function CollectionPickerWrapper() {
  const [activityOpen, setActivityOpen] = useState(false)
  const { count: unseenActivity, markSeen: markActivitySeen } = useUnseenActivityCount({ toolKey: 'project_alignment' })

  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto overflow-x-clip">
        {activityOpen && (
          <ActivityPanel
            onClose={() => setActivityOpen(false)}
            toolKey="project_alignment"
          />
        )}
        <CollectionsPickerView
          toolKey="project_alignment"
          itemNoun="alignment tracker"
          previewMode="statuses"
          titleOverride="Your Alignment Trackers"
          headerActions={
            <button
              type="button"
              onClick={() => { setActivityOpen(true); markActivitySeen() }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Activity
              {unseenActivity > 0 && (
                <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                  {unseenActivity > 98 ? '99+' : unseenActivity}
                </span>
              )}
            </button>
          }
        />
      </div>
    </div>
  )
}
