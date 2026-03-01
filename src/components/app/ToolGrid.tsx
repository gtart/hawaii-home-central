'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_REGISTRY } from '@/lib/tool-registry'
import { getDashboardStats, isToolEmpty } from '@/lib/tool-stats'

interface ToolSummary {
  toolKey: string
  updatedAt: string
  updatedBy: { name: string | null; image: string | null } | null
  stats?: Record<string, unknown>
}

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

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

export function ToolGrid() {
  const { currentProject } = useProject()
  const [summaries, setSummaries] = useState<ToolSummary[]>([])

  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    fetch('/api/tool-summaries')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.summaries) setSummaries(data.summaries)
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

  const summaryMap = new Map(summaries.map((s) => [s.toolKey, s]))

  if (visibleTools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-cream/40 text-sm">
          No tools have been shared with you for this project yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleTools.map((tool) => {
        const summary = summaryMap.get(tool.toolKey)
        const dashStats = getDashboardStats(tool.toolKey, summary?.stats)
        const empty = isToolEmpty(tool.toolKey, summary?.stats)
        const helperLine = HELPER_COPY[tool.toolKey]
        const user = summary?.updatedBy

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
                {summary ? (
                  <>
                    {user && (
                      <span className="inline-flex items-center gap-1">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt=""
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-cream/10 flex items-center justify-center text-[8px] font-semibold text-cream/40">
                            {getInitials(user.name)}
                          </span>
                        )}
                        <span>{user.name || 'Someone'}</span>
                      </span>
                    )}
                    <span>{relativeTime(summary.updatedAt)}</span>
                  </>
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
