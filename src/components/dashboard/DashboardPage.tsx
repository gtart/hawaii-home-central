'use client'

import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { DashboardCardFixList } from './DashboardCardFixList'
import { DashboardCardSelections } from './DashboardCardSelections'
import { DashboardFeed } from './DashboardFeed'
import { DashboardSecondary } from './DashboardSecondary'

export function DashboardPage() {
  const { currentProject } = useProject()
  const { data, isLoading } = useDashboard()

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-cream mb-1">
            {currentProject?.name ?? 'Dashboard'}
          </h1>
          <p className="text-sm text-cream/40">Your renovation at a glance.</p>
        </div>

        {/* Hero attention cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <DashboardCardFixList data={data} isLoading={isLoading} />
          <DashboardCardSelections data={data} isLoading={isLoading} />
        </div>

        {/* TODO: Pinned collections section (1–3 pinned items)
         * Requires: DashboardPin model, POST/DELETE /api/dashboard/pins,
         * pinnedCollections[] in DashboardResponse, pin/unpin in collection ⋯ menus
         */}

        {/* Activity feed */}
        <div className="mb-8">
          <DashboardFeed />
        </div>

        {/* Secondary widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardSecondary
            title="Mood Boards"
            href="/app/tools/mood-boards"
            toolKey="mood_boards"
            data={data}
          />
          <DashboardSecondary
            title="Contract Checklist"
            href="/app/tools/before-you-sign"
            toolKey="before_you_sign"
            data={data}
          />
        </div>
      </div>
    </div>
  )
}
