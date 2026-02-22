'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { useProject } from '@/contexts/ProjectContext'
import { ProjectSwitcher } from './ProjectSwitcher'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

interface ToolSummary {
  toolKey: string
  updatedAt: string
  updatedBy: { name: string | null; image: string | null } | null
}

interface Stage {
  number: number
  title: string
  subtitle: string
  toolKey: string | null
}

const STAGES: Stage[] = [
  { number: 1, title: 'Plan', subtitle: 'Define scope, budget, and funding.', toolKey: null },
  { number: 2, title: 'Hire & Contract', subtitle: 'Compare bids and lock expectations.', toolKey: 'before_you_sign' },
  { number: 3, title: 'Permits & Schedule', subtitle: 'Get approvals and set a realistic start plan.', toolKey: null },
  { number: 4, title: 'Decide & Order', subtitle: 'Finalize selections and confirm lead times.', toolKey: 'finish_decisions' },
  { number: 5, title: 'Build & Closeout', subtitle: 'Track issues as you go, then finish strong.', toolKey: 'punchlist' },
]

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
  const accessibleToolKeys = currentProject?.role === 'MEMBER' && currentProject.toolAccess
    ? new Set(currentProject.toolAccess.map((a) => a.toolKey))
    : null

  const summaryMap = new Map(summaries.map((s) => [s.toolKey, s]))

  const toolMap = new Map(TOOL_REGISTRY.map((t) => [t.toolKey, t]))

  return (
    <>
      {/* Currently viewing bar */}
      {currentProject && (
        <div className="flex items-center gap-3 mb-8 px-4 py-2.5 rounded-lg bg-sandstone/10 border border-sandstone/15">
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

      <div className="space-y-2">
        {STAGES.map((stage, index) => {
          const tool = stage.toolKey ? toolMap.get(stage.toolKey) : null
          const isAccessible = !accessibleToolKeys || (stage.toolKey ? accessibleToolKeys.has(stage.toolKey) : false)
          const hasTool = !!tool && isAccessible

          return (
            <div key={stage.number} className="flex gap-4">
              {/* Stage marker */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                    hasTool
                      ? 'bg-sandstone text-basalt'
                      : 'border border-cream/20 text-cream/40'
                  )}
                >
                  {stage.number}
                </div>
                {index < STAGES.length - 1 && (
                  <div className="w-px flex-1 bg-cream/10 mt-1.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="mb-1">
                  <span className="text-sm font-medium text-cream/60">{stage.title}</span>
                  <span className="text-cream/20 mx-2">&middot;</span>
                  <span className="text-xs text-cream/30">{stage.subtitle}</span>
                </div>

                {hasTool ? (
                  <Link
                    href={tool!.href}
                    className="block p-5 bg-basalt-50 rounded-card card-hover"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-serif text-lg text-sandstone">{tool!.title}</h3>
                      <Badge>Live</Badge>
                    </div>
                    <p className="text-cream/70 text-sm leading-relaxed mb-3">{tool!.description}</p>
                    <div className="pt-2 border-t border-cream/5">
                      <ToolMeta summary={summaryMap.get(stage.toolKey!)} />
                    </div>
                  </Link>
                ) : (
                  <div className="py-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-cream/5 text-cream/30">
                      Coming soon
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
