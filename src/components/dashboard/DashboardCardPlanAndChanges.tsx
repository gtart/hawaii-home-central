'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { ShareMetaLine } from './ShareMetaLine'
import { ActivityEventRow } from '@/components/app/ActivityEventRow'

const PLAN_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  shared: 'Shared',
  confirmed: 'Confirmed',
  acknowledged: 'Acknowledged',
}

const PLAN_STATUS_COLOR: Record<string, string> = {
  draft: 'bg-cream/5 text-cream/30',
  shared: 'bg-blue-500/10 text-blue-400/70',
  confirmed: 'bg-emerald-500/10 text-emerald-400/70',
  acknowledged: 'bg-emerald-500/10 text-emerald-400/70',
}

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
        <p className="text-sm text-cream/40 mb-4">
          Document your renovation scope, track what&rsquo;s included, and manage changes as they come up.
        </p>
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
  const statusLabel = PLAN_STATUS_LABEL[primarySummary.planStatus] ?? primarySummary.planStatus
  const statusColor = PLAN_STATUS_COLOR[primarySummary.planStatus] ?? 'bg-cream/5 text-cream/30'

  const totalPlanItems = summaries.reduce((s, l) => s + l.planItemCount, 0)
  const totalIncluded = summaries.reduce((s, l) => s + l.includedCount, 0)
  const totalStillToDecide = summaries.reduce((s, l) => s + l.stillToDecideCount, 0)
  const totalActiveChanges = summaries.reduce((s, l) => s + l.activeChangeCount, 0)
  const totalChanges = summaries.reduce((s, l) => s + l.changeCount, 0)

  // Truncate scope to ~60 chars for tile preview
  const scope = primarySummary.planScope
  const truncatedScope = scope.length > 60 ? scope.slice(0, 57) + '…' : scope

  // All caught up — no plan items and no changes
  if (totalPlanItems === 0 && totalChanges === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm uppercase tracking-wider text-cream/40">Track Plan & Changes</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor}`}>{statusLabel}</span>
        </div>
        <p className="text-lg font-medium text-cream/60 mb-1">All caught up</p>
        {truncatedScope && (
          <p className="text-xs text-cream/25 mb-2 leading-relaxed">{truncatedScope}</p>
        )}
        <ShareMetaLine meta={data?.toolMeta?.project_summary} />
        <Link
          href="/app/tools/project-summary"
          className="inline-flex items-center px-4 py-2 border border-sandstone/30 text-sandstone text-sm font-medium rounded-button hover:bg-sandstone/10 transition-colors mt-2"
        >
          View Plan
        </Link>
        {summaries.length === 1 && (
          <p className="text-[10px] text-cream/20 mt-3">
            Have a separate project like a landscape or ADU? <Link href="/app/tools/project-summary" className="text-sandstone/40 hover:text-sandstone/60 underline">Add another plan</Link>
          </p>
        )}
      </div>
    )
  }

  // Active state — rich tile
  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm uppercase tracking-wider text-cream/40">Track Plan & Changes</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* Scope preview */}
      {truncatedScope && (
        <p className="text-xs text-cream/35 mb-3 leading-relaxed">{truncatedScope}</p>
      )}

      {/* Plan item breakdown */}
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="text-2xl font-semibold text-cream tabular-nums">{totalPlanItems}</span>
        <span className="text-sm text-cream/40">plan items</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-cream/30 mb-3">
        <span>{totalIncluded} included</span>
        {totalStillToDecide > 0 && (
          <span className="text-amber-400/60">{totalStillToDecide} to decide</span>
        )}
      </div>

      {/* Changes + budget row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3">
        {totalChanges > 0 && (
          <span className="text-cream/35">
            {totalChanges} change{totalChanges !== 1 ? 's' : ''}
            {totalActiveChanges > 0 && (
              <span className="text-amber-400/60 ml-1">({totalActiveChanges} active)</span>
            )}
          </span>
        )}
        {primarySummary.hasBudget && primarySummary.budgetAmount && (
          <span className="text-cream/30">Budget: {primarySummary.budgetAmount}</span>
        )}
        {primarySummary.documentCount > 0 && (
          <span className="text-cream/25">{primarySummary.documentCount} doc{primarySummary.documentCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      <ShareMetaLine meta={data?.toolMeta?.project_summary} />

      {/* Activity */}
      {data?.recentActivity?.project_summary && data.recentActivity.project_summary.length > 0 ? (
        <div className="mb-3 space-y-1">
          {data.recentActivity.project_summary.slice(0, 2).map((evt, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              {evt.actorName && (
                <span className="shrink-0 w-4 h-4 rounded-full bg-sandstone/15 text-sandstone/70 flex items-center justify-center text-[8px] font-semibold" title={evt.actorName}>
                  {evt.actorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
              <ActivityEventRow event={evt} variant="compact" />
              <span className="text-cream/15 shrink-0">{relativeTime(evt.createdAt)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-cream/25 mb-3 truncate">
          Updated {relativeTime(primarySummary.updatedAt)}{primarySummary.updatedByName ? ` by ${primarySummary.updatedByName.split(' ')[0]}` : ''}
        </p>
      )}

      <Link
        href="/app/tools/project-summary"
        className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
      >
        Review Plan
      </Link>

      {summaries.length === 1 && (
        <p className="text-[10px] text-cream/20 mt-3">
          Have a separate project like a landscape or ADU? <Link href="/app/tools/project-summary" className="text-sandstone/40 hover:text-sandstone/60 underline">Add another plan</Link>
        </p>
      )}
      {summaries.length > 1 && (
        <p className="text-[10px] text-cream/20 mt-3">
          {summaries.length} plans · showing {primarySummary.title}
        </p>
      )}
    </div>
  )
}
