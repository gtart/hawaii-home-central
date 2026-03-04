'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { ShareMetaLine } from './ShareMetaLine'

export function DashboardCardMoodBoards({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6 animate-pulse">
        <div className="h-3 w-20 bg-cream/5 rounded mb-4" />
        <div className="h-8 w-20 bg-cream/5 rounded mb-2" />
        <div className="h-3 w-48 bg-cream/5 rounded" />
      </div>
    )
  }

  const boards = data?.moodBoards ?? []
  const totalItems = boards.reduce((s, b) => s + b.itemCount, 0)
  const thumbnail = boards.find((b) => b.thumbnailUrl)?.thumbnailUrl

  // Not started
  if (boards.length === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Mood Boards</p>
        <p className="text-sm text-cream/40 mb-4">No mood boards yet.</p>
        <Link
          href="/app/tools/mood-boards"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start Mood Board
        </Link>
      </div>
    )
  }

  // Empty boards (exist but no items)
  if (totalItems === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Mood Boards</p>
        <p className="text-sm text-cream/40 mb-1">Start collecting inspiration</p>
        <ShareMetaLine meta={data?.toolMeta?.mood_boards} />
        <Link
          href="/app/tools/mood-boards"
          className="inline-flex items-center px-4 py-2 border border-sandstone/30 text-sandstone text-sm font-medium rounded-button hover:bg-sandstone/10 transition-colors mt-3"
        >
          Open Mood Boards
        </Link>
      </div>
    )
  }

  // Active
  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <div className="flex">
        <div className="flex-1 min-w-0">
          <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Mood Boards</p>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-2xl font-semibold text-cream tabular-nums">{totalItems}</span>
            <span className="text-sm text-cream/40">ideas saved</span>
            <span className="text-cream/15">&middot;</span>
            <span className="text-sm text-cream/40">{boards.length} board{boards.length !== 1 ? 's' : ''}</span>
          </div>
          <ShareMetaLine meta={data?.toolMeta?.mood_boards} />
          <p className="text-[11px] text-cream/25 mb-4 truncate">Most active: {boards[0].title}</p>
          <Link
            href="/app/tools/mood-boards"
            className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
          >
            Explore Boards
          </Link>
        </div>
        {thumbnail && (
          <div className="ml-4 shrink-0">
            <img src={thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}
