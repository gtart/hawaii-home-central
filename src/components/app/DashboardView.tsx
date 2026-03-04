'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_REGISTRY } from '@/lib/tool-registry'
import type {
  DashboardResponse,
  SelectionListSummary,
  FixListSummary,
  MoodBoardSummary,
} from '@/server/dashboard'

const HELPER_COPY: Record<string, string> = {
  mood_boards: 'Save inspiration and products you might use.',
  finish_decisions: 'Choose finishes by room (tile, paint, fixtures, etc.).',
  before_you_sign: 'Compare bids and avoid gotchas before you sign.',
  punchlist: 'Track issues during the build and final walkthrough.',
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

interface AggregatedStats {
  label: string
  value: string
}

function getSelectionListStats(lists: SelectionListSummary[]): AggregatedStats[] {
  if (lists.length === 0) return []
  const deciding = lists.reduce((s, l) => s + l.notStartedCount + l.decidingCount, 0)
  const done = lists.reduce((s, l) => s + l.doneCount, 0)
  const total = deciding + done
  if (total === 0) return []
  return [{ label: `decision${deciding !== 1 ? 's' : ''} remain`, value: String(deciding) }]
}

function getFixListStats(lists: FixListSummary[]): AggregatedStats[] {
  if (lists.length === 0) return []
  const open = lists.reduce((s, l) => s + l.openCount, 0)
  return [{ label: `open issue${open !== 1 ? 's' : ''}`, value: String(open) }]
}

function getMoodBoardStats(boards: MoodBoardSummary[]): AggregatedStats[] {
  if (boards.length === 0) return []
  const boardCount = boards.length
  const ideaCount = boards.reduce((s, b) => s + b.itemCount, 0)
  return [
    { label: 'Boards', value: String(boardCount) },
    { label: 'Ideas', value: String(ideaCount) },
  ]
}

function getToolStats(toolKey: string, data: DashboardResponse | null): AggregatedStats[] {
  if (!data) return []
  switch (toolKey) {
    case 'finish_decisions': return getSelectionListStats(data.selectionLists)
    case 'punchlist': return getFixListStats(data.fixLists)
    case 'mood_boards': return getMoodBoardStats(data.moodBoards)
    default: return []
  }
}

function isToolEmpty(toolKey: string, data: DashboardResponse | null): boolean {
  if (!data) return true
  switch (toolKey) {
    case 'finish_decisions': return data.selectionLists.length === 0
    case 'punchlist': return data.fixLists.length === 0
    case 'mood_boards': return data.moodBoards.length === 0
    case 'before_you_sign': return true // Not a collection-based tool yet
    default: return true
  }
}

function getLastActivity(toolKey: string, data: DashboardResponse | null): string | null {
  if (!data) return null
  let collections: { updatedAt: string }[] = []
  switch (toolKey) {
    case 'finish_decisions': collections = data.selectionLists; break
    case 'punchlist': collections = data.fixLists; break
    case 'mood_boards': collections = data.moodBoards; break
    default: return null
  }
  if (collections.length === 0) return null
  // Already sorted by updatedAt desc from the API
  return collections[0].updatedAt
}

export function DashboardView() {
  const { currentProject } = useProject()
  const [data, setData] = useState<DashboardResponse | null>(null)

  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [currentProject?.id])

  // Members: filter by explicit tool access. Owners: always see all tools.
  const visibleTools = currentProject?.role === 'MEMBER' && currentProject.toolAccess
    ? TOOL_REGISTRY.filter((t) =>
        currentProject.toolAccess!.some((a) => a.toolKey === t.toolKey)
      )
    : TOOL_REGISTRY

  if (visibleTools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-cream/40 text-sm">
          No tools have been shared with you for this home yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleTools.map((tool) => {
        const dashStats = getToolStats(tool.toolKey, data)
        const empty = isToolEmpty(tool.toolKey, data)
        const helperLine = HELPER_COPY[tool.toolKey]
        const lastActivity = getLastActivity(tool.toolKey, data)

        return (
          <Link
            key={tool.toolKey}
            href={tool.href}
            className="group flex items-center gap-4 p-4 md:p-5 bg-basalt-50 rounded-card border border-cream/5 hover:border-sandstone/20 transition-colors"
          >
            {/* Left: title + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-serif text-lg text-sandstone group-hover:text-sandstone-light transition-colors truncate">
                  {tool.title}
                </h3>
                <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-cream/25 shrink-0">
                  {tool.stage}
                </span>
              </div>
              {helperLine && (
                <p className="text-cream/45 text-xs leading-relaxed line-clamp-1">{helperLine}</p>
              )}

              {/* Last activity line */}
              <div className="flex items-center gap-2 text-[11px] text-cream/30 mt-1.5">
                {lastActivity ? (
                  <span>{relativeTime(lastActivity)}</span>
                ) : (
                  <span className="text-cream/20">Not started</span>
                )}
              </div>
            </div>

            {/* Right: stats or CTA */}
            <div className="flex items-center gap-4 shrink-0">
              {!empty && dashStats.length > 0 && (
                <div className="hidden sm:flex gap-4">
                  {dashStats.map((s) => (
                    <div key={s.label} className="text-right">
                      <p className="text-xl font-semibold text-cream tabular-nums leading-tight">{s.value}</p>
                      <p className="text-[10px] text-cream/35 uppercase tracking-wide">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
              <span className={`inline-flex items-center px-4 py-2 text-xs font-medium rounded-button transition-colors ${
                empty
                  ? 'bg-sandstone text-basalt group-hover:bg-sandstone-light'
                  : 'border border-sandstone/30 text-sandstone group-hover:bg-sandstone/10'
              }`}>
                {empty ? 'Start' : 'Continue'}
              </span>
              <svg className="w-4 h-4 text-cream/20 group-hover:text-cream/40 transition-colors hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
