'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'

export function DashboardCardMoodBoards({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-4 md:p-5 animate-pulse">
        <div className="h-3 w-20 bg-cream/5 rounded mb-3" />
        <div className="h-3 w-48 bg-cream/5 rounded" />
      </div>
    )
  }

  const boards = data?.moodBoards ?? []
  const totalItems = boards.reduce((s, b) => s + b.itemCount, 0)

  // Not started — don't show in secondary section (grid hides this)
  if (boards.length === 0) return null

  // Compact secondary card
  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cream/50 mb-0.5">Mood Boards</p>
          <p className="text-xs text-cream/30">
            {boards.length} board{boards.length !== 1 ? 's' : ''}
            {totalItems > 0 && <> &middot; {totalItems} idea{totalItems !== 1 ? 's' : ''}</>}
            {boards[0]?.updatedAt && <> &middot; {relativeTime(boards[0].updatedAt)}</>}
          </p>
        </div>
        <Link
          href="/app/tools/mood-boards"
          className="inline-flex items-center px-3 py-1.5 border border-cream/10 text-cream/50 text-xs font-medium rounded-button hover:bg-cream/5 transition-colors shrink-0"
        >
          Open
        </Link>
      </div>
    </div>
  )
}
