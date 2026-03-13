'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'

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
  const totalAll = totalNotStarted + totalDeciding + totalDone
  const hasItems = lists.length > 0
  const lastUpdated = lists.length > 0 ? lists[0].updatedAt : null

  // Not started
  if (!hasItems || totalAll === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm font-medium text-cream/60 mb-2">Selections</p>
        <p className="text-sm text-cream/35 mb-4">Track finishes, fixtures, and materials you need to pick.</p>
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
        <p className="text-sm font-medium text-cream/60 mb-2">Selections</p>
        <p className="text-sm text-cream/50 mb-1">All {totalDone} decided</p>
        {lastUpdated && (
          <p className="text-[11px] text-cream/25 mb-3">Updated {relativeTime(lastUpdated)}</p>
        )}
        <Link
          href="/app/tools/finish-decisions"
          className="inline-flex items-center px-4 py-2 border border-cream/10 text-cream/50 text-sm font-medium rounded-button hover:bg-cream/5 transition-colors"
        >
          View Selections
        </Link>
      </div>
    )
  }

  // Active — has undecided items
  let statusLine: string
  if (totalNotStarted > 0 && totalDeciding > 0) {
    statusLine = `${totalNotStarted} need options, ${totalDeciding} in progress`
  } else if (totalNotStarted > 0) {
    statusLine = `${totalNotStarted} still need${totalNotStarted === 1 ? 's' : ''} options`
  } else {
    statusLine = `${totalDeciding} in progress`
  }

  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <p className="text-sm font-medium text-cream/60 mb-3">Selections</p>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-2xl font-semibold text-cream tabular-nums">{totalActive}</span>
        <span className="text-sm text-cream/40">to decide</span>
        {totalDone > 0 && (
          <>
            <span className="text-cream/15">&middot;</span>
            <span className="text-sm text-green-400/60">{totalDone} done</span>
          </>
        )}
      </div>
      <p className="text-xs text-cream/35 mb-2">{statusLine}</p>
      {lastUpdated && (
        <p className="text-[11px] text-cream/25 mb-4">
          Updated {relativeTime(lastUpdated)}{lists[0].updatedByName ? ` by ${lists[0].updatedByName.split(' ')[0]}` : ''}
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
