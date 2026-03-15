'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'

export function DashboardCardFixList({
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

  const lists = data?.fixLists ?? []
  const totalOpen = lists.reduce((s, l) => s + l.openCount, 0)
  const totalStale = lists.reduce((s, l) => s + l.staleCount, 0)
  const totalHigh = lists.reduce((s, l) => s + l.highPriorityCount, 0)
  const hasItems = lists.length > 0
  const lastUpdated = lists.length > 0 ? lists[0].updatedAt : null

  // Not started
  if (!hasItems) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6">
        <p className="text-sm font-medium text-cream/70 mb-2">Fix Issues</p>
        <p className="text-sm text-cream/50 mb-4">Keep a running list of fixes — add items as you spot them, share with your contractor, and check them off as they get done.</p>
        <Link
          href="/app/tools/punchlist"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start Tracking
        </Link>
      </div>
    )
  }

  // All caught up
  if (totalOpen === 0) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6">
        <p className="text-sm font-medium text-cream/70 mb-2">Fix Issues</p>
        <p className="text-sm text-cream/65 mb-1">All issues resolved</p>
        {lastUpdated && (
          <p className="text-[11px] text-cream/40 mb-3">Updated {relativeTime(lastUpdated)}</p>
        )}
        <Link
          href="/app/tools/punchlist"
          className="inline-flex items-center px-4 py-2 border border-cream/15 text-cream/65 text-sm font-medium rounded-button hover:bg-stone-200 transition-colors"
        >
          View Issues
        </Link>
      </div>
    )
  }

  // Active — has open items
  let statusLine: string
  if (totalHigh > 0) {
    statusLine = `${totalHigh} high-priority issue${totalHigh !== 1 ? 's' : ''} to review`
  } else if (totalStale > 0) {
    statusLine = `${totalStale} issue${totalStale !== 1 ? 's' : ''} stale for 2+ weeks`
  } else {
    statusLine = `${totalOpen} open issue${totalOpen !== 1 ? 's' : ''} to work through`
  }

  return (
    <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6">
      <p className="text-sm font-medium text-cream/70 mb-3">Fix Issues</p>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-2xl font-semibold text-cream tabular-nums">{totalOpen}</span>
        <span className="text-sm text-cream/55">open</span>
        {totalStale > 0 && (
          <>
            <span className="text-cream/30">&middot;</span>
            <span className="text-sm text-amber-400/70">{totalStale} stale</span>
          </>
        )}
        {totalHigh > 0 && (
          <>
            <span className="text-cream/30">&middot;</span>
            <span className="text-sm text-red-400/70">{totalHigh} urgent</span>
          </>
        )}
      </div>
      <p className="text-xs text-cream/50 mb-2">{statusLine}</p>
      {lastUpdated && (
        <p className="text-[11px] text-cream/40 mb-4">
          Updated {relativeTime(lastUpdated)}{lists[0].updatedByName ? ` by ${lists[0].updatedByName.split(' ')[0]}` : ''}
        </p>
      )}
      <Link
        href="/app/tools/punchlist"
        className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
      >
        Review Fixes
      </Link>
    </div>
  )
}
