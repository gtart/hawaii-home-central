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

function getEmptyLabel(toolKey: string): string {
  if (toolKey === 'mood_boards') return 'Save your first idea'
  if (toolKey === 'finish_decisions') return 'Add your first room'
  if (toolKey === 'before_you_sign') return 'Start your checklist'
  if (toolKey === 'punchlist') return 'Track your first fix'
  return 'Get started'
}

function ToolMeta({ summary }: { summary: ToolSummary | undefined }) {
  if (!summary) return null

  const user = summary.updatedBy
  return (
    <div className="flex items-center gap-2 text-xs text-cream/40">
      {user && (
        <span className="inline-flex items-center gap-1.5">
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
          <span className="leading-none">{user.name || 'Someone'}</span>
        </span>
      )}
      <span>{relativeTime(summary.updatedAt)}</span>
    </div>
  )
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

  // Members: filter by explicit tool access. Owners: filter by activeToolKeys.
  const activeKeys = currentProject?.activeToolKeys ?? []
  const visibleTools = currentProject?.role === 'MEMBER' && currentProject.toolAccess
    ? TOOL_REGISTRY.filter((t) =>
        currentProject.toolAccess!.some((a) => a.toolKey === t.toolKey)
      )
    : activeKeys.length > 0
      ? TOOL_REGISTRY.filter((t) => activeKeys.includes(t.toolKey))
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visibleTools.map((tool) => {
        const summary = summaryMap.get(tool.toolKey)
        const dashStats = getDashboardStats(tool.toolKey, summary?.stats)
        const empty = isToolEmpty(tool.toolKey, summary?.stats)

        return (
          <Link
            key={tool.toolKey}
            href={tool.href}
            className="group block p-5 bg-basalt-50 rounded-card border border-cream/5 hover:border-sandstone/20 transition-colors"
          >
            {/* Header: title + stage */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-serif text-lg text-sandstone group-hover:text-sandstone-light transition-colors">
                {tool.title}
              </h3>
              <span className="text-[10px] uppercase tracking-wider text-cream/30 shrink-0 mt-1">
                {tool.stage}
              </span>
            </div>

            {/* Stats or empty state */}
            {empty ? (
              <p className="text-cream/40 text-sm mb-3">
                {getEmptyLabel(tool.toolKey)}
              </p>
            ) : (
              <div className="flex gap-5 mb-3">
                {dashStats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-semibold text-cream tabular-nums">{s.value}</p>
                    <p className="text-[11px] text-cream/40 uppercase tracking-wide">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Last activity */}
            <div className="pt-2 border-t border-cream/5">
              {summary ? (
                <ToolMeta summary={summary} />
              ) : (
                <span className="text-cream/25 text-xs">Not started</span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
