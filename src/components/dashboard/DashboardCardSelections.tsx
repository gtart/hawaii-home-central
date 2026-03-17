'use client'

import Link from 'next/link'
import type { DashboardResponse, ToolPreviewItem } from '@/server/dashboard'
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
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6 animate-pulse">
        <div className="h-4 w-24 bg-stone-200 rounded mb-4" />
        <div className="h-6 w-16 bg-stone-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-stone-200 rounded" />
          <div className="h-10 bg-stone-200 rounded" />
        </div>
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
  const previews = data?.toolPreviews?.selections ?? []

  // Not started — empty state
  if (!hasItems || totalAll === 0) {
    return (
      <Link href="/app/tools/finish-decisions" className="block bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
        <p className="text-sm font-medium text-cream/80 mb-2 group-hover:text-sandstone transition-colors">Selections</p>
        <p className="text-sm text-cream/45 mb-3 leading-relaxed">
          Create a board for each finish or fixture you need to pick — save options, compare, and choose.
        </p>
        <span className="inline-flex items-center text-sm text-sandstone/70 group-hover:text-sandstone transition-colors">
          Add your first board
          <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    )
  }

  return (
    <Link href="/app/tools/finish-decisions" className="block bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-cream/80 group-hover:text-sandstone transition-colors">Selections</p>
        {totalActive > 0 ? (
          <span className="text-xs text-cream/40">{totalActive} to decide{totalDone > 0 ? ` · ${totalDone} done` : ''}</span>
        ) : (
          <span className="text-xs text-emerald-400/60">All {totalDone} decided</span>
        )}
      </div>

      {/* Story previews */}
      {previews.length > 0 ? (
        <div className="space-y-2">
          {previews.map((p) => (
            <PreviewRow key={p.id} item={p} />
          ))}
        </div>
      ) : totalActive === 0 ? (
        <p className="text-xs text-cream/35">All selections finalized.</p>
      ) : (
        <p className="text-xs text-cream/35">Boards waiting for your picks.</p>
      )}
    </Link>
  )
}

function PreviewRow({ item }: { item: ToolPreviewItem }) {
  return (
    <div className="flex items-center gap-3">
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-stone-200 shrink-0 flex items-center justify-center">
          <svg className="w-4 h-4 text-cream/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-cream/70 truncate">{item.title}</p>
        <p className="text-[10px] text-cream/35">{item.event} · {relativeTime(item.timestamp)}</p>
      </div>
    </div>
  )
}
