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
    actions.push({
      label: `Review ${totalHigh} high-priority fix${totalHigh !== 1 ? 'es' : ''}`,
      href: urgentList ? `/app/tools/punchlist/${urgentList.id}` : '/app/tools/punchlist',
    })
  } else if (totalStale > 0) {
    const staleList = fixLists.find((l) => l.staleCount > 0)
    actions.push({
      label: `${totalStale} stale fix${totalStale !== 1 ? 'es' : ''} need attention`,
      href: staleList ? `/app/tools/punchlist/${staleList.id}` : '/app/tools/punchlist',
    })
  } else if (totalOpen > 0) {
    actions.push({
      label: `${totalOpen} open fix${totalOpen !== 1 ? 'es' : ''} to work through`,
      href: '/app/tools/punchlist',
    })
  }

  // Selections: not-started decisions
  const selLists = data.selectionLists ?? []
  const totalNotStarted = selLists.reduce((s, l) => s + l.notStartedCount, 0)
  const totalDeciding = selLists.reduce((s, l) => s + l.decidingCount, 0)
  if (totalNotStarted > 0) {
    const urgentList = selLists.find((l) => l.notStartedCount > 0)
    actions.push({
      label: `Start ${totalNotStarted} decision${totalNotStarted !== 1 ? 's' : ''} (no options yet)`,
      href: urgentList ? `/app/tools/finish-decisions/${urgentList.id}` : '/app/tools/finish-decisions',
    })
  } else if (totalDeciding > 0) {
    actions.push({
      label: `${totalDeciding} decision${totalDeciding !== 1 ? 's' : ''} still deciding`,
      href: '/app/tools/finish-decisions',
    })
  }

  // Contract Checklist: contractors to compare
  const bys = data.beforeYouSign ?? []
  const totalContractors = bys.reduce((s, c) => s + c.contractorCount, 0)
  const totalSelected = bys.reduce((s, c) => s + c.selectedContractorCount, 0)
  if (totalContractors > 0 && totalSelected < totalContractors) {
    const remaining = totalContractors - totalSelected
    actions.push({
      label: `Compare ${remaining} contractor${remaining !== 1 ? 's' : ''} to select`,
      href: '/app/tools/before-you-sign',
    })
  }

  // Shared links
  const meta = data.toolMeta
  const totalLinks = (meta?.punchlist?.linkEnabledCount ?? 0)
    + (meta?.finish_decisions?.linkEnabledCount ?? 0)
    + (meta?.mood_boards?.linkEnabledCount ?? 0)
    + (meta?.before_you_sign?.linkEnabledCount ?? 0)
  if (totalLinks > 0 && actions.length < 3) {
    actions.push({
      label: `${totalLinks} list${totalLinks !== 1 ? 's' : ''} shared by link`,
      href: '/app',
    })
  }

  return actions.slice(0, 4)
}

export function DashboardNextActions({ data }: { data: DashboardResponse | null }) {
  if (!data) return null

  const actions = deriveActions(data)
  if (actions.length === 0) return null

  // Determine quick-add destinations
  const lastFixList = data.fixLists?.[0]
  const lastSelList = data.selectionLists?.[0]
  const addFixHref = lastFixList ? `/app/tools/punchlist/${lastFixList.id}` : '/app/tools/punchlist'
  const addDecisionHref = lastSelList ? `/app/tools/finish-decisions/${lastSelList.id}` : '/app/tools/finish-decisions'

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs uppercase tracking-wider text-cream/30">Next up</h2>
        <div className="flex items-center gap-2">
          <Link
            href={addFixHref}
            className="inline-flex items-center gap-1 text-[11px] text-cream/40 hover:text-sandstone transition-colors px-2 py-1 rounded border border-cream/10 hover:border-sandstone/30"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Fix
          </Link>
          <Link
            href={addDecisionHref}
            className="inline-flex items-center gap-1 text-[11px] text-cream/40 hover:text-sandstone transition-colors px-2 py-1 rounded border border-cream/10 hover:border-sandstone/30"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Decision
          </Link>
        </div>
      </div>
      <ul className="space-y-1">
        {actions.map((a, i) => (
          <li key={i}>
            <Link
              href={a.href}
              className="group flex items-center gap-2 text-sm text-cream/50 hover:text-cream transition-colors py-0.5"
            >
              <span className="w-1 h-1 rounded-full bg-sandstone/50 group-hover:bg-sandstone shrink-0" />
              {a.label}
              <svg className="w-3 h-3 text-cream/20 group-hover:text-cream/40 transition-colors ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
