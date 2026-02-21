'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { useProject } from '@/contexts/ProjectContext'
import { ProjectSwitcher } from './ProjectSwitcher'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

interface ToolSummary {
  toolKey: string
  updatedAt: string
  updatedBy: { name: string | null; image: string | null } | null
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

function ToolMeta({ summary }: { summary: ToolSummary | undefined }) {
  if (!summary) {
    return <span className="text-cream/30 text-xs">Not used yet</span>
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
      <span>{relativeTime(summary.updatedAt)}</span>
    </div>
  )
}

export function ToolGrid() {
  const { currentProject, projects } = useProject()
  const [summaries, setSummaries] = useState<ToolSummary[]>([])

  const hasMultipleProjects = projects.filter((p) => p.status === 'ACTIVE').length >= 2

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

  return (
    <>
      {/* Currently viewing bar */}
      {currentProject && (
        <div className="flex items-center gap-3 mb-6 px-4 py-2.5 rounded-lg bg-sandstone/10 border border-sandstone/15">
          <svg className="w-4 h-4 text-sandstone/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-sandstone/50">Currently viewing</span>
            <span className="text-sm font-medium text-sandstone truncate">{currentProject.name}</span>
          </div>
          {hasMultipleProjects && <ProjectSwitcher />}
        </div>
      )}

      {visibleTools.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-cream/40 text-sm">
            No tools have been shared with you for this project yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleTools.map((tool) => (
            <Card
              key={tool.toolKey}
              href={tool.href}
              title={tool.title}
              description={tool.description}
              badge="Live"
              meta={<ToolMeta summary={summaryMap.get(tool.toolKey)} />}
            />
          ))}
        </div>
      )}
    </>
  )
}
