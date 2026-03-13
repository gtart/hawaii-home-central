'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { ShareMetaLine } from './ShareMetaLine'

export function DashboardCardPlanAndChanges({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6 animate-pulse">
        <div className="h-3 w-16 bg-cream/5 rounded mb-4" />
        <div className="h-8 w-20 bg-cream/5 rounded mb-2" />
        <div className="h-3 w-48 bg-cream/5 rounded" />
      </div>
    )
  }

  const summaries = data?.projectSummaries ?? []
  const hasItems = summaries.length > 0

  // Not started
  if (!hasItems) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Track Plan & Changes</p>
        <p className="text-sm text-cream/40 mb-4">No plan yet.</p>
        <Link
          href="/app/tools/project-summary"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start Plan & Changes
        </Link>
      </div>
    )
  }

  const primarySummary = summaries[0]
  const totalActiveChanges = summaries.reduce((s, l) => s + l.activeChangeCount, 0)
  const totalChanges = summaries.reduce((s, l) => s + l.changeCount, 0)
  const totalPlanItems = summaries.reduce((s, l) => s + l.planItemCount, 0)

  // All caught up — no plan items and no changes
  if (totalPlanItems === 0 && totalChanges === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Track Plan & Changes</p>
        <p className="text-lg font-medium text-cream/60 mb-1">All caught up</p>
        <p className="text-[11px] text-cream/25 mb-3">
          {summaries.length} plan{summaries.length !== 1 ? 's' : ''} · last updated {relativeTime(primarySummary.updatedAt)}
        </p>
        <ShareMetaLine meta={data?.toolMeta?.project_summary} />
        <Link
          href="/app/tools/project-summary"
          className="inline-flex items-center px-4 py-2 border border-sandstone/30 text-sandstone text-sm font-medium rounded-button hover:bg-sandstone/10 transition-colors mt-2"
        >
          View Plan
        </Link>
      </div>
    )
  }

  // Active state — compact like other cards
  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Track Plan & Changes</p>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-2xl font-semibold text-cream tabular-nums">{summaries.length}</span>
        <span className="text-sm text-cream/40">plan{summaries.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-xs text-cream/35 mb-3">
        {totalPlanItems} plan item{totalPlanItems !== 1 ? 's' : ''}
        {totalActiveChanges > 0 && (
          <span className="text-amber-400/60"> · {totalActiveChanges} active change{totalActiveChanges !== 1 ? 's' : ''}</span>
        )}
      </p>
      <ShareMetaLine meta={data?.toolMeta?.project_summary} />
      <p className="text-[11px] text-cream/25 mb-3">
        Updated {relativeTime(primarySummary.updatedAt)}{primarySummary.updatedByName ? ` by ${primarySummary.updatedByName.split(' ')[0]}` : ''}
      </p>
      <Link
        href="/app/tools/project-summary"
        className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
      >
        Review Plan
      </Link>
    </div>
  )
}
