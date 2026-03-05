'use client'

import type { DashboardResponse } from '@/server/dashboard'
import { DashboardCardFixList } from './DashboardCardFixList'
import { DashboardCardSelections } from './DashboardCardSelections'
import { DashboardCardMoodBoards } from './DashboardCardMoodBoards'
import { DashboardCardContractChecklist } from './DashboardCardContractChecklist'
import { DashboardCardProDirectory } from './DashboardCardProDirectory'

export function DashboardToolGrid({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6 animate-pulse">
            <div className="h-3 w-16 bg-cream/5 rounded mb-4" />
            <div className="h-8 w-20 bg-cream/5 rounded mb-2" />
            <div className="h-3 w-48 bg-cream/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Manage your Renovation */}
      <h2 className="text-xs uppercase tracking-wider text-cream/20 mb-3">
        Manage your Renovation
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <DashboardCardMoodBoards data={data} isLoading={false} />
        <DashboardCardSelections data={data} isLoading={false} />
        <DashboardCardFixList data={data} isLoading={false} />
      </div>

      {/* Finding Pros */}
      <h2 className="text-xs uppercase tracking-wider text-cream/20 mb-1">
        Finding Pros
      </h2>
      <p className="text-xs text-cream/30 mb-3">Compare contractors and find the right team.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <DashboardCardContractChecklist data={data} isLoading={false} />
        <DashboardCardProDirectory />
      </div>
    </>
  )
}
