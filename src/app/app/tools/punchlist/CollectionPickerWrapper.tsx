'use client'

import { useState } from 'react'
import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'

export function CollectionPickerWrapper() {
  const [activityOpen, setActivityOpen] = useState(false)
  const { count: unseenActivity, markSeen: markActivitySeen } = useUnseenActivityCount({ toolKey: 'punchlist' })

  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto overflow-x-clip">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => { setActivityOpen(true); markActivitySeen() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activity
            {unseenActivity > 0 && (
              <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {unseenActivity > 98 ? '99+' : unseenActivity}
              </span>
            )}
          </button>
        </div>
        {activityOpen && (
          <ActivityPanel
            onClose={() => setActivityOpen(false)}
            toolKey="punchlist"
          />
        )}
        <CollectionsPickerView toolKey="punchlist" itemNoun="fix list" previewMode="statuses" />
      </div>
    </div>
  )
}
