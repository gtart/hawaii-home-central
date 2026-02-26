'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

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

function ToolStats({ toolKey, stats }: { toolKey: string; stats?: Record<string, unknown> }) {
  if (!stats) return null

  let text: string | null = null

  if (toolKey === 'before_you_sign') {
    const count = (stats.contractorCount as number | undefined) ?? 0
    const names = (stats.contractorNames as string[] | undefined) ?? []
    if (count === 0) {
      text = 'No contractors added'
    } else {
      const shown = names.slice(0, 2).join(', ')
      const extra = names.length > 2 ? ` +${names.length - 2} more` : ''
      text = count === 1
        ? `1 contractor being evaluated${shown ? ` — ${shown}` : ''}`
        : `${count} contractors being evaluated — ${shown}${extra}`
    }
  } else if (toolKey === 'finish_decisions') {
    const total = (stats.total as number | undefined) ?? 0
    const finalized = (stats.finalized as number | undefined) ?? 0
    if (total === 0) {
      text = 'No finish selections added yet'
    } else {
      const pct = Math.round((finalized / total) * 100)
      text = `${total} selection${total !== 1 ? 's' : ''} · ${pct}% finalized`
    }
  } else if (toolKey === 'punchlist') {
    const total = (stats.total as number | undefined) ?? 0
    const done = (stats.done as number | undefined) ?? 0
    if (total === 0) {
      text = 'No issues tracked yet'
    } else {
      const open = total - done
      text = `${total} issue${total !== 1 ? 's' : ''} tracked · ${open} open`
    }
  } else if (toolKey === 'mood_boards') {
    const boardCount = (stats.boardCount as number | undefined) ?? 0
    const ideaCount = (stats.ideaCount as number | undefined) ?? 0
    if (ideaCount === 0) {
      text = 'No ideas saved yet'
    } else {
      text = `${boardCount} board${boardCount !== 1 ? 's' : ''} · ${ideaCount} idea${ideaCount !== 1 ? 's' : ''}`
    }
  }

  if (!text) return null

  return <p className="text-xs text-sandstone/60 mt-1.5">{text}</p>
}

function ToolMeta({ summary }: { summary: ToolSummary | undefined }) {
  if (!summary) {
    return <span className="text-cream/30 text-xs">Not started yet</span>
  }

  const user = summary.updatedBy
  return (
    <div className="flex items-center gap-2 text-xs text-cream/40">
      {user && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cream/5 text-cream/50">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={16}
              height={16}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <span className="w-4 h-4 rounded-full bg-cream/10 flex items-center justify-center text-[9px] font-semibold text-cream/40">
              {getInitials(user.name)}
            </span>
          )}
          <span className="leading-none">{user.name || 'Someone'}</span>
        </span>
      )}
      <span>Updated {relativeTime(summary.updatedAt)}</span>
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

  // Owners see all tools. Members only see tools they have access to.
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
    <div className="space-y-5">
      {visibleTools.map((tool) => {
        const summary = summaryMap.get(tool.toolKey)
        return (
          <div key={tool.toolKey} className="flex flex-col sm:flex-row sm:items-stretch gap-0 sm:gap-0">
            {/* Stage label — above on mobile, left column on desktop */}
            <div className="sm:w-40 sm:shrink-0 sm:flex sm:flex-col sm:justify-center sm:pr-5 sm:border-r sm:border-cream/10 mb-2 sm:mb-0">
              <span className="text-[11px] uppercase tracking-wider text-cream/30 sm:hidden">Stage</span>
              <p className="text-sm font-medium text-cream/50">{tool.stage}</p>
            </div>

            {/* Tool card */}
            <Link
              href={tool.href}
              className="block flex-1 p-5 bg-basalt-50 rounded-card card-hover sm:ml-5"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-serif text-lg text-sandstone">{tool.title}</h3>
                <Badge>Live</Badge>
              </div>
              <p className="text-cream/70 text-sm leading-relaxed">{tool.description}</p>
              <ToolStats toolKey={tool.toolKey} stats={summary?.stats} />
              <div className="pt-2 border-t border-cream/5 mt-3">
                <ToolMeta summary={summary} />
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
