'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { ShareMetaLine } from './ShareMetaLine'
import { ActivityEventRow } from '@/components/app/ActivityEventRow'

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
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm uppercase tracking-wider text-cream/40">Fix List</p>
        <span className="text-[10px] text-cream/30 tabular-nums">{lists.length} list{lists.length !== 1 ? 's' : ''}</span>
      </div>
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
      {(() => {
        const urgent = [...lists].sort((a, b) => (b.highPriorityCount + b.staleCount) - (a.highPriorityCount + a.staleCount))[0]
        const reason = urgent.highPriorityCount > 0
          ? `${urgent.highPriorityCount} high · ${urgent.staleCount} stale`
          : urgent.staleCount > 0
            ? `${urgent.staleCount} stale`
            : `${urgent.openCount} open`
        return (
          <Link href={`/app/tools/punchlist/${urgent.id}`} className="block text-[11px] text-cream/35 hover:text-cream/50 transition-colors mb-1 truncate">
            Needs review: <span className="text-cream/50">{urgent.title}</span> <span className="text-cream/25">({reason})</span>
          </Link>
        )
      })()}
      <ShareMetaLine meta={data?.toolMeta?.punchlist} />
      {data?.recentActivity?.punchlist && data.recentActivity.punchlist.length > 0 ? (
        <div className="mb-4 space-y-1">
          {data.recentActivity.punchlist.slice(0, 2).map((evt, i) => (
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
        <p className="text-[11px] text-cream/25 mb-4 truncate">
          Last updated: {lists[0].title} · {relativeTime(lists[0].updatedAt)}{lists[0].updatedByName ? ` by ${lists[0].updatedByName.split(' ')[0]}` : ''}
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
