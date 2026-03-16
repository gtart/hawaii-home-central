'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'

interface ActionItem {
  label: string
  href: string
  tool: string
}

function deriveActions(data: DashboardResponse): ActionItem[] {
  const actions: ActionItem[] = []

  // Fix List: high-priority or stale or open
  const fixLists = data.fixLists ?? []
  const totalHigh = fixLists.reduce((s, l) => s + l.highPriorityCount, 0)
  const totalStale = fixLists.reduce((s, l) => s + l.staleCount, 0)
  const totalOpen = fixLists.reduce((s, l) => s + l.openCount, 0)
  if (totalHigh > 0) {
    const urgentList = fixLists.find((l) => l.highPriorityCount > 0)
    const base = urgentList ? `/app/tools/punchlist/${urgentList.id}` : '/app/tools/punchlist'
    actions.push({
      label: `${totalHigh} urgent fix${totalHigh !== 1 ? 'es' : ''} to review`,
      href: `${base}?priority=HIGH`,
      tool: 'Fix List',
    })
  } else if (totalStale > 0) {
    const staleList = fixLists.find((l) => l.staleCount > 0)
    const base = staleList ? `/app/tools/punchlist/${staleList.id}` : '/app/tools/punchlist'
    actions.push({
      label: `${totalStale} fix${totalStale !== 1 ? 'es' : ''} haven\u2019t been touched in 2+ weeks`,
      href: `${base}?status=OPEN`,
      tool: 'Fix List',
    })
  } else if (totalOpen > 0) {
    actions.push({
      label: `${totalOpen} open fix${totalOpen !== 1 ? 'es' : ''} to work through`,
      href: '/app/tools/punchlist',
      tool: 'Fix List',
    })
  }

  // Selections: not-started or deciding
  const selLists = data.selectionLists ?? []
  const totalNotStarted = selLists.reduce((s, l) => s + l.notStartedCount, 0)
  const totalDeciding = selLists.reduce((s, l) => s + l.decidingCount, 0)
  if (totalNotStarted > 0) {
    const targetList = selLists.find((l) => l.notStartedCount > 0)
    const base = targetList ? `/app/tools/finish-decisions/${targetList.id}` : '/app/tools/finish-decisions'
    actions.push({
      label: `${totalNotStarted} selection${totalNotStarted !== 1 ? 's' : ''} still need${totalNotStarted === 1 ? 's' : ''} options`,
      href: base,
      tool: 'Selections',
    })
  } else if (totalDeciding > 0) {
    const targetList = selLists.find((l) => l.decidingCount > 0)
    const base = targetList ? `/app/tools/finish-decisions/${targetList.id}` : '/app/tools/finish-decisions'
    actions.push({
      label: `${totalDeciding} selection${totalDeciding !== 1 ? 's' : ''} ready to finalize`,
      href: base,
      tool: 'Selections',
    })
  }

  // Plan & Changes: active changes
  const summaries = data.projectSummaries ?? []
  const totalActiveChanges = summaries.reduce((s, l) => s + l.activeChangeCount, 0)
  if (totalActiveChanges > 0) {
    const targetSummary = summaries.find((l) => l.activeChangeCount > 0)
    const base = targetSummary ? `/app/tools/project-summary/${targetSummary.id}` : '/app/tools/project-summary'
    actions.push({
      label: `${totalActiveChanges} plan change${totalActiveChanges !== 1 ? 's' : ''} to follow up on`,
      href: base,
      tool: 'Plan & Changes',
    })
  }

  return actions.slice(0, 4)
}

export function DashboardNextActions({ data }: { data: DashboardResponse | null }) {
  if (!data) return null

  const actions = deriveActions(data)
  if (actions.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-[11px] uppercase tracking-wider text-cream/35 mb-2.5">Pick up where you left off</h2>
      <div className="space-y-1.5">
        {actions.map((a, i) => (
          <Link
            key={i}
            href={a.href}
            className="group flex items-center gap-3 px-3 py-2.5 -mx-3 rounded-lg hover:bg-cream/5 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sandstone/50 group-hover:bg-sandstone shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="text-sm text-cream/70 group-hover:text-cream transition-colors">{a.label}</span>
            </span>
            <span className="text-[10px] text-cream/25 shrink-0 hidden sm:inline">{a.tool}</span>
            <svg className="w-3.5 h-3.5 text-cream/25 group-hover:text-cream/50 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
