'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'

export function DashboardCardPlanAndChanges({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6 animate-pulse">
        <div className="h-3 w-16 bg-stone-200 rounded mb-4" />
        <div className="h-8 w-20 bg-stone-200 rounded mb-2" />
        <div className="h-3 w-48 bg-stone-200 rounded" />
      </div>
    )
  }

  const summaries = data?.projectSummaries ?? []
  const hasItems = summaries.length > 0

  // Not started
  if (!hasItems) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6">
        <p className="text-sm font-medium text-cream/70 mb-2">Track Plans</p>
        <p className="text-sm text-cream/50 mb-4">Track your project plan and any changes along the way.</p>
        <Link
          href="/app/tools/project-summary"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start a Plan
        </Link>
      </div>
    )
  }

  const totalActiveChanges = summaries.reduce((s, l) => s + l.activeChangeCount, 0)
  const totalChanges = summaries.reduce((s, l) => s + l.changeCount, 0)
  const primarySummary = summaries[0]
  const planCount = summaries.length

  // Meta line: "2 plans · 3 changes pending review"
  const metaParts: string[] = []
  metaParts.push(`${planCount} plan${planCount !== 1 ? 's' : ''}`)
  if (totalActiveChanges > 0) {
    metaParts.push(`${totalActiveChanges} change${totalActiveChanges !== 1 ? 's' : ''} pending review`)
  }

  // Plan exists but no changes yet — show plan signal
  const planSignals: string[] = []
  if (primarySummary.planItemCount > 0) planSignals.push(`${primarySummary.planItemCount} plan item${primarySummary.planItemCount !== 1 ? 's' : ''}`)
  if (primarySummary.hasBudget) planSignals.push('budget set')

  if (totalActiveChanges === 0 && totalChanges === 0) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6">
        <p className="text-sm font-medium text-cream/70 mb-2">Track Plans</p>
        <p className="text-[11px] text-cream/45 mb-2">{metaParts.join(' · ')}</p>
        {planSignals.length > 0 ? (
          <p className="text-sm text-cream/65 mb-1">Plan documented · {planSignals.join(', ')}. No changes yet.</p>
        ) : (
          <p className="text-sm text-cream/65 mb-1">No changes recorded yet.</p>
        )}
        <p className="text-[11px] text-cream/40 mb-3">
          Updated {relativeTime(primarySummary.updatedAt)}
        </p>
        <Link
          href="/app/tools/project-summary"
          className="inline-flex items-center px-4 py-2 border border-cream/15 text-cream/65 text-sm font-medium rounded-button hover:bg-stone-200 transition-colors"
        >
          View Plan
        </Link>
      </div>
    )
  }

  // Active state
  return (
    <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6">
      <p className="text-sm font-medium text-cream/70 mb-1">Track Plans</p>
      <p className="text-[11px] text-cream/45 mb-3">{metaParts.join(' · ')}</p>
      <div className="flex items-baseline gap-3 mb-1">
        {totalActiveChanges > 0 ? (
          <>
            <span className="text-2xl font-semibold text-cream tabular-nums">{totalActiveChanges}</span>
            <span className="text-sm text-cream/55">active change{totalActiveChanges !== 1 ? 's' : ''}</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-semibold text-cream tabular-nums">{totalChanges}</span>
            <span className="text-sm text-cream/55">change{totalChanges !== 1 ? 's' : ''} recorded</span>
          </>
        )}
      </div>
      <p className="text-[11px] text-cream/40 mb-4">
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
