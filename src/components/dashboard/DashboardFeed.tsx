'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

interface FeedItem {
  id: string
  title: string
  toolLabel: string
  href: string
  updatedAt: string
}

const TOOL_META: Record<string, { label: string; href: string }> = {
  finish_decisions: { label: 'Selection Lists', href: '/app/tools/finish-decisions' },
  punchlist: { label: 'Fix List', href: '/app/tools/punchlist' },
  mood_boards: { label: 'Mood Boards', href: '/app/tools/mood-boards' },
}

export function DashboardFeed({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-xs uppercase tracking-wider text-cream/30 mb-3">Recent Activity</h2>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-cream/5 rounded w-3/4" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  // Merge all collections into feed items
  const items: FeedItem[] = [
    ...data.selectionLists.map((l) => ({
      id: l.id,
      title: l.title,
      toolLabel: TOOL_META.finish_decisions.label,
      href: TOOL_META.finish_decisions.href,
      updatedAt: l.updatedAt,
    })),
    ...data.fixLists.map((l) => ({
      id: l.id,
      title: l.title,
      toolLabel: TOOL_META.punchlist.label,
      href: TOOL_META.punchlist.href,
      updatedAt: l.updatedAt,
    })),
    ...data.moodBoards.map((l) => ({
      id: l.id,
      title: l.title,
      toolLabel: TOOL_META.mood_boards.label,
      href: TOOL_META.mood_boards.href,
      updatedAt: l.updatedAt,
    })),
  ]

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const top = items.slice(0, 8)

  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-cream/30 mb-3">Recent Activity</h2>
      {top.length === 0 ? (
        <p className="text-xs text-cream/20">No recent activity.</p>
      ) : (
        <div>
          {top.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 py-2.5 border-b border-cream/5 last:border-0 hover:bg-cream/[0.02] transition-colors -mx-2 px-2 rounded"
            >
              <span className="text-sm text-cream/60 flex-1 min-w-0 truncate">
                Updated &ldquo;{item.title}&rdquo;
              </span>
              <span className="text-[11px] text-cream/25 shrink-0">{item.toolLabel}</span>
              <span className="text-[11px] text-cream/25 shrink-0">{relativeTime(item.updatedAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
