'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { ShareMetaLine } from './ShareMetaLine'

export function DashboardCardSelections({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6 animate-pulse">
        <div className="h-3 w-24 bg-cream/5 rounded mb-4" />
        <div className="h-8 w-20 bg-cream/5 rounded mb-2" />
        <div className="h-3 w-48 bg-cream/5 rounded" />
      </div>
    )
  }

  const lists = data?.selectionLists ?? []
  const totalNotStarted = lists.reduce((s, l) => s + l.notStartedCount, 0)
  const totalDeciding = lists.reduce((s, l) => s + l.decidingCount, 0)
  const totalDone = lists.reduce((s, l) => s + l.doneCount, 0)
  const totalActive = totalNotStarted + totalDeciding
  const hasItems = lists.length > 0
  const lastUpdated = lists.length > 0 ? lists[0].updatedAt : null

  // Find last comment across all lists
  const lastComment = lists
    .filter((l) => l.lastComment)
    .sort((a, b) => new Date(b.lastComment!.updatedAt).getTime() - new Date(a.lastComment!.updatedAt).getTime())[0]?.lastComment

  // Not started
  if (!hasItems) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Selections</p>
        <p className="text-sm text-cream/40 mb-4">No selection lists yet.</p>
        <Link
          href="/app/tools/finish-decisions"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start Selections
        </Link>
      </div>
    )
  }

  // All caught up
  if (totalActive === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Selections</p>
        <p className="text-lg font-medium text-cream/60 mb-1">All selections made</p>
        <p className="text-xs text-cream/35 mb-1">
          All {totalDone} selection{totalDone !== 1 ? 's' : ''} finalized
        </p>
        {lastUpdated && (
          <p className="text-[11px] text-cream/25 mb-1">Last activity: {relativeTime(lastUpdated)}</p>
        )}
        <ShareMetaLine meta={data?.toolMeta?.finish_decisions} />
        <Link
          href="/app/tools/finish-decisions"
          className="inline-flex items-center px-4 py-2 border border-sandstone/30 text-sandstone text-sm font-medium rounded-button hover:bg-sandstone/10 transition-colors mt-2"
        >
          View Selections
        </Link>
      </div>
    )
  }

  // Has active items
  let heuristic: string
  if (totalNotStarted > 0) {
    heuristic = `${totalNotStarted} selection${totalNotStarted !== 1 ? 's' : ''} haven't been started`
  } else {
    heuristic = `${totalDeciding} selection${totalDeciding !== 1 ? 's' : ''} still in progress`
  }

  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm uppercase tracking-wider text-cream/40">Selections</p>
        <span className="text-[10px] text-cream/30 tabular-nums">{lists.length} list{lists.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-2xl font-semibold text-cream tabular-nums">{totalActive}</span>
        <span className="text-sm text-cream/40">need selections</span>
        {totalDone > 0 && (
          <>
            <span className="text-cream/15">&middot;</span>
            <span className="text-sm text-green-400/60">{totalDone} done</span>
          </>
        )}
      </div>
      <p className="text-xs text-cream/35 mb-2">{heuristic}</p>
      {(() => {
        const urgent = [...lists].sort((a, b) => (b.notStartedCount + b.decidingCount) - (a.notStartedCount + a.decidingCount))[0]
        const reason = urgent.notStartedCount > 0
          ? `${urgent.notStartedCount} not started`
          : `${urgent.decidingCount} deciding`
        return (
          <Link href={`/app/tools/finish-decisions/${urgent.id}`} className="block text-[11px] text-cream/35 hover:text-cream/50 transition-colors mb-1 truncate">
            Needs review: <span className="text-cream/50">{urgent.title}</span> <span className="text-cream/25">({reason})</span>
          </Link>
        )
      })()}
      <ShareMetaLine meta={data?.toolMeta?.finish_decisions} />
      {data?.recentActivity?.finish_decisions && data.recentActivity.finish_decisions.length > 0 ? (
        <div className="mb-4 space-y-1">
          {data.recentActivity.finish_decisions.slice(0, 2).map((evt, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              {evt.actorName && (
                <span className="shrink-0 w-4 h-4 rounded-full bg-sandstone/15 text-sandstone/70 flex items-center justify-center text-[8px] font-semibold" title={evt.actorName}>
                  {evt.actorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="text-cream/30 truncate">{evt.summaryText}</span>
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
        href="/app/tools/finish-decisions"
        className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
      >
        Review Selections
      </Link>
    </div>
  )
}
