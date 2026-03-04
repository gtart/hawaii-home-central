'use client'

import Link from 'next/link'
import { relativeTime } from '@/lib/relativeTime'
import type { DashboardResponse } from '@/server/dashboard'

function deriveSuggestion(data: DashboardResponse): { label: string; href: string } | null {
  // Suggest the most impactful next step
  const fixLists = data.fixLists ?? []
  const totalHigh = fixLists.reduce((s, l) => s + l.highPriorityCount, 0)
  if (totalHigh > 0) {
    const list = fixLists.find((l) => l.highPriorityCount > 0)
    return {
      label: `Review ${totalHigh} high-priority fix${totalHigh !== 1 ? 'es' : ''}`,
      href: list ? `/app/tools/punchlist/${list.id}` : '/app/tools/punchlist',
    }
  }

  const selLists = data.selectionLists ?? []
  const totalNotStarted = selLists.reduce((s, l) => s + l.notStartedCount, 0)
  if (totalNotStarted > 0) {
    const list = selLists.find((l) => l.notStartedCount > 0)
    return {
      label: `Start ${totalNotStarted} decision${totalNotStarted !== 1 ? 's' : ''} with no options yet`,
      href: list ? `/app/tools/finish-decisions/${list.id}` : '/app/tools/finish-decisions',
    }
  }

  const bys = data.beforeYouSign ?? []
  const totalContractors = bys.reduce((s, c) => s + c.contractorCount, 0)
  const totalSelected = bys.reduce((s, c) => s + c.selectedContractorCount, 0)
  if (totalContractors > 0 && totalSelected < totalContractors) {
    return {
      label: `Compare ${totalContractors - totalSelected} contractor${totalContractors - totalSelected !== 1 ? 's' : ''}`,
      href: '/app/tools/before-you-sign',
    }
  }

  return null
}

export function QuietBanner({ lastActivityAt, data }: { lastActivityAt?: string; data?: DashboardResponse | null }) {
  const suggestion = data ? deriveSuggestion(data) : null

  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 px-5 py-4 mb-6 text-center">
      <p className="text-sm text-cream/50">All caught up — nothing needs your attention right now.</p>
      {lastActivityAt && (
        <p className="text-[11px] text-cream/25 mt-1">Last activity: {relativeTime(lastActivityAt)}</p>
      )}
      {suggestion && (
        <Link
          href={suggestion.href}
          className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 hover:text-sandstone transition-colors mt-2"
        >
          {suggestion.label}
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  )
}
