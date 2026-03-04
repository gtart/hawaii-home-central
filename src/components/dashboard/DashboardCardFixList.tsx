'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { ShareMetaLine } from './ShareMetaLine'

export function DashboardCardFixList({
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

  const lists = data?.fixLists ?? []
  const totalOpen = lists.reduce((s, l) => s + l.openCount, 0)
  const totalStale = lists.reduce((s, l) => s + l.staleCount, 0)
  const totalHigh = lists.reduce((s, l) => s + l.highPriorityCount, 0)
  const hasItems = lists.length > 0
  const lastUpdated = lists.length > 0 ? lists[0].updatedAt : null

  // Not started
  if (!hasItems) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Fix List</p>
        <p className="text-sm text-cream/40 mb-4">No fix list yet.</p>
        <Link
          href="/app/tools/punchlist"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start Fix List
        </Link>
      </div>
    )
  }

  // All caught up
  if (totalOpen === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Fix List</p>
        <p className="text-lg font-medium text-cream/60 mb-1">All caught up</p>
        {lastUpdated && (
          <p className="text-[11px] text-cream/25 mb-1">Last activity: {relativeTime(lastUpdated)}</p>
        )}
        <ShareMetaLine meta={data?.toolMeta?.punchlist} />
        <Link
          href="/app/tools/punchlist"
          className="inline-flex items-center px-4 py-2 border border-sandstone/30 text-sandstone text-sm font-medium rounded-button hover:bg-sandstone/10 transition-colors mt-2"
        >
          View Fix List
        </Link>
      </div>
    )
  }

  // Has open items
  let heuristic: string
  if (totalStale > 0) {
    heuristic = `${totalStale} stale issue${totalStale !== 1 ? 's' : ''} need${totalStale === 1 ? 's' : ''} attention`
  } else if (totalHigh > 0) {
    heuristic = `${totalHigh} high-priority issue${totalHigh !== 1 ? 's' : ''} to review`
  } else {
    heuristic = `${totalOpen} open issue${totalOpen !== 1 ? 's' : ''} to work through`
  }

  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Fix List</p>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-2xl font-semibold text-cream tabular-nums">{totalOpen}</span>
        <span className="text-sm text-cream/40">open</span>
        {totalStale > 0 && (
          <>
            <span className="text-cream/15">&middot;</span>
            <span className="text-sm text-amber-400/70">{totalStale} stale</span>
          </>
        )}
        {totalHigh > 0 && (
          <>
            <span className="text-cream/15">&middot;</span>
            <span className="text-sm text-red-400/70">{totalHigh} high</span>
          </>
        )}
      </div>
      <p className="text-xs text-cream/35 mb-2">{heuristic}</p>
      <ShareMetaLine meta={data?.toolMeta?.punchlist} />
      <p className="text-[11px] text-cream/25 mb-4 truncate">Most active: {lists[0].title}</p>
      <Link
        href="/app/tools/punchlist"
        className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
      >
        Review Fixes
      </Link>
    </div>
  )
}
