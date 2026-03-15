'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'

interface ActionItem {
  label: string
  href: string
}

function deriveActions(data: DashboardResponse): ActionItem[] {
  const actions: ActionItem[] = []

  // Fix List: high-priority fixes
  const fixLists = data.fixLists ?? []
  const totalHigh = fixLists.reduce((s, l) => s + l.highPriorityCount, 0)
  const totalStale = fixLists.reduce((s, l) => s + l.staleCount, 0)
  const totalOpen = fixLists.reduce((s, l) => s + l.openCount, 0)
  if (totalHigh > 0) {
    const urgentList = fixLists.find((l) => l.highPriorityCount > 0)
    const base = urgentList ? `/app/tools/punchlist/${urgentList.id}` : '/app/tools/punchlist'
    actions.push({
      label: `Review ${totalHigh} urgent fix${totalHigh !== 1 ? 'es' : ''}`,
      href: `${base}?priority=HIGH`,
    })
  } else if (totalStale > 0) {
    const staleList = fixLists.find((l) => l.staleCount > 0)
    const base = staleList ? `/app/tools/punchlist/${staleList.id}` : '/app/tools/punchlist'
    actions.push({
      label: `${totalStale} fix${totalStale !== 1 ? 'es' : ''} haven\u2019t been updated in 2+ weeks`,
      href: `${base}?status=OPEN`,
    })
  } else if (totalOpen > 0) {
    actions.push({
      label: `${totalOpen} open fix${totalOpen !== 1 ? 'es' : ''} to work through`,
      href: '/app/tools/punchlist?status=OPEN',
    })
  }

  // Selections: not-started decisions
  const selLists = data.selectionLists ?? []
  const totalNotStarted = selLists.reduce((s, l) => s + l.notStartedCount, 0)
  const totalDeciding = selLists.reduce((s, l) => s + l.decidingCount, 0)
  if (totalNotStarted > 0) {
    const targetList = selLists.find((l) => l.notStartedCount > 0)
    const base = targetList ? `/app/tools/finish-decisions/${targetList.id}` : '/app/tools/finish-decisions'
    actions.push({
      label: `${totalNotStarted} selection${totalNotStarted !== 1 ? 's' : ''} still need${totalNotStarted === 1 ? 's' : ''} options`,
      href: base,
    })
  } else if (totalDeciding > 0) {
    const targetList = selLists.find((l) => l.decidingCount > 0)
    const base = targetList ? `/app/tools/finish-decisions/${targetList.id}` : '/app/tools/finish-decisions'
    actions.push({
      label: `${totalDeciding} selection${totalDeciding !== 1 ? 's' : ''} ready to finalize`,
      href: base,
    })
  }

  // Plan & Changes: active changes
  const summaries = data.projectSummaries ?? []
  const totalActiveChanges = summaries.reduce((s, l) => s + l.activeChangeCount, 0)
  if (totalActiveChanges > 0) {
    const targetSummary = summaries.find((l) => l.activeChangeCount > 0)
    const base = targetSummary ? `/app/tools/project-summary/${targetSummary.id}` : '/app/tools/project-summary'
    actions.push({
      label: `${totalActiveChanges} change${totalActiveChanges !== 1 ? 's' : ''} to follow up on`,
      href: base,
    })
  }

  // Contract Checklist: contractors to compare
  const bys = data.beforeYouSign ?? []
  const totalContractors = bys.reduce((s, c) => s + c.contractorCount, 0)
  const totalSelected = bys.reduce((s, c) => s + c.selectedContractorCount, 0)
  if (totalContractors > 0 && totalSelected < totalContractors) {
    const remaining = totalContractors - totalSelected
    actions.push({
      label: `Compare ${remaining} contractor${remaining !== 1 ? 's' : ''} before signing`,
      href: '/app/tools/before-you-sign',
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
      <h2 className="text-[11px] uppercase tracking-wider text-cream/45 mb-2">Needs attention</h2>
      <ul className="space-y-1">
        {actions.map((a, i) => (
          <li key={i}>
            <Link
              href={a.href}
              className="group flex items-center gap-2 text-sm text-cream/70 hover:text-cream transition-colors py-0.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sandstone/50 group-hover:bg-sandstone shrink-0" />
              {a.label}
              <svg className="w-3 h-3 text-cream/35 group-hover:text-cream/55 transition-colors ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
