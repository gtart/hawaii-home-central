'use client'

import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { DashboardToolGrid } from './DashboardToolGrid'
import { DashboardFeed } from './DashboardFeed'
import { QuietBanner } from './QuietBanner'

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

        {/* Quiet state */}
        {data?.noNews.isQuiet && (
          <QuietBanner lastActivityAt={data.noNews.lastActivityAt} />
        )}

        {/* Tool grid — active tools first, then other tools */}
        <DashboardToolGrid data={data} isLoading={isLoading} />

        {/* Activity feed */}
        <div className="mb-8">
          <DashboardFeed />
        </div>
      </div>
    </div>
  )
}
