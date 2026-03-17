'use client'

import Link from 'next/link'
import type { DashboardResponse, ToolPreviewItem } from '@/server/dashboard'
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
        <div className="h-4 w-28 bg-stone-200 rounded mb-4" />
        <div className="h-6 w-16 bg-stone-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-stone-200 rounded" />
          <div className="h-10 bg-stone-200 rounded" />
        </div>
      </div>
    )
  }

  const summaries = data?.projectSummaries ?? []
  const hasItems = summaries.length > 0
  const totalActiveChanges = summaries.reduce((s, l) => s + l.activeChangeCount, 0)
  const totalChanges = summaries.reduce((s, l) => s + l.changeCount, 0)
  const previews = data?.toolPreviews?.planChanges ?? []

  // Not started — empty state
  if (!hasItems) {
    return (
      <Link href="/app/tools/project-summary" className="block bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
        <p className="text-sm font-medium text-cream/80 mb-2 group-hover:text-sandstone transition-colors">Plan &amp; Changes</p>
        <p className="text-sm text-cream/45 mb-3 leading-relaxed">
          Track your scope of work, log changes as they come up, and keep plan documents in one place.
        </p>
        <span className="inline-flex items-center text-sm text-sandstone/70 group-hover:text-sandstone transition-colors">
          Start logging
          <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    )
  }

  return (
    <Link href="/app/tools/project-summary" className="block bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-cream/80 group-hover:text-sandstone transition-colors">Plan &amp; Changes</p>
        {totalActiveChanges > 0 ? (
          <span className="text-xs text-cream/40">{totalActiveChanges} active change{totalActiveChanges !== 1 ? 's' : ''}</span>
        ) : totalChanges > 0 ? (
          <span className="text-xs text-cream/40">{totalChanges} change{totalChanges !== 1 ? 's' : ''} logged</span>
        ) : (
          <span className="text-xs text-cream/40">No changes yet</span>
        )}
      </div>

      {/* Story previews */}
      {previews.length > 0 ? (
        <div className="space-y-2">
          {previews.map((p) => (
            <PreviewRow key={p.id} item={p} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-cream/35">Add scope items and log changes as they come up.</p>
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
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
            <path d="M14 2v6h6" strokeLinecap="round" />
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
