'use client'

import type { DashboardResponse } from '@/server/dashboard'
import { DashboardCardFixList } from './DashboardCardFixList'
import { DashboardCardSelections } from './DashboardCardSelections'
import { DashboardCardMoodBoards } from './DashboardCardMoodBoards'
import { DashboardCardContractChecklist } from './DashboardCardContractChecklist'
import { DashboardCardPlanAndChanges } from './DashboardCardPlanAndChanges'

export function DashboardToolGrid({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-stone rounded-card border border-cream/15 p-5 md:p-6 animate-pulse">
              <div className="h-3 w-16 bg-stone-200 rounded mb-4" />
              <div className="h-8 w-20 bg-stone-200 rounded mb-2" />
              <div className="h-3 w-48 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </>
    )
  }

  // Check if secondary tools have meaningful content
  const hasMoodBoards = (data.moodBoards ?? []).length > 0
  const hasChecklists = (data.beforeYouSign ?? []).length > 0
  const showSecondary = hasMoodBoards || hasChecklists

  return (
    <>
      {/* Primary — your active renovation areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DashboardCardFixList data={data} isLoading={false} />
        <DashboardCardSelections data={data} isLoading={false} />
        <DashboardCardPlanAndChanges data={data} isLoading={false} />
      </div>

      {/* Secondary — preparation tools, shown smaller and less prominent */}
      {showSecondary && (
        <>
          <h2 className="text-[11px] uppercase tracking-wider text-cream/45 mb-3">
            Planning &amp; Prep
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <DashboardCardMoodBoards data={data} isLoading={false} />
            <DashboardCardContractChecklist data={data} isLoading={false} />
          </div>
        </>
      )}
    </>
  )
}
