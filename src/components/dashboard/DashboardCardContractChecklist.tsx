'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { ShareMetaLine } from './ShareMetaLine'

export function DashboardCardContractChecklist({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6 animate-pulse">
        <div className="h-3 w-28 bg-cream/5 rounded mb-4" />
        <div className="h-8 w-20 bg-cream/5 rounded mb-2" />
        <div className="h-3 w-48 bg-cream/5 rounded" />
      </div>
    )
  }

  const checklists = data?.beforeYouSign ?? []
  const totalContractors = checklists.reduce((s, c) => s + c.contractorCount, 0)
  const totalSelected = checklists.reduce((s, c) => s + c.selectedContractorCount, 0)
  const allSelected = checklists.length > 0 && totalContractors > 0 && totalSelected >= totalContractors

  // Not started
  if (checklists.length === 0) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Contract Checklist</p>
        <p className="text-sm text-cream/40 mb-4">Run this before signing anything.</p>
        <Link
          href="/app/tools/before-you-sign"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
        >
          Start Checklist
        </Link>
      </div>
    )
  }

  // All selected
  if (allSelected) {
    return (
      <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
        <p className="text-sm uppercase tracking-wider text-cream/40 mb-3">Contract Checklist</p>
        <p className="text-lg font-medium text-cream/60 mb-1">Contractors selected</p>
        <p className="text-xs text-cream/35 mb-1">
          {totalSelected} contractor{totalSelected !== 1 ? 's' : ''} chosen across {checklists.length} comparison list{checklists.length !== 1 ? 's' : ''}
        </p>
        <ShareMetaLine meta={data?.toolMeta?.before_you_sign} noun="comparison list" />
        <p className="text-[11px] text-cream/25 mb-2 truncate">
          Last updated: {checklists[0].title} · {relativeTime(checklists[0].updatedAt)}{checklists[0].updatedByName ? ` by ${checklists[0].updatedByName.split(' ')[0]}` : ''}
        </p>
        <Link
          href="/app/tools/before-you-sign"
          className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors mt-2"
        >
          View Checklists
        </Link>
      </div>
    )
  }

  // Active — has contractors to compare
  const heuristic = totalContractors > 0
    ? `${totalContractors} contractor${totalContractors !== 1 ? 's' : ''} to compare`
    : `${checklists.length} comparison list${checklists.length !== 1 ? 's' : ''} in progress`

  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm uppercase tracking-wider text-cream/40">Contract Checklist</p>
        <span className="text-[10px] text-cream/30 tabular-nums">{checklists.length} comparison list{checklists.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-2xl font-semibold text-cream tabular-nums">
          {totalContractors > 0 ? totalContractors : checklists.length}
        </span>
        <span className="text-sm text-cream/40">
          {totalContractors > 0 ? `contractor${totalContractors !== 1 ? 's' : ''}` : `comparison list${checklists.length !== 1 ? 's' : ''}`}
        </span>
        {totalSelected > 0 && (
          <>
            <span className="text-cream/15">&middot;</span>
            <span className="text-sm text-green-400/60">{totalSelected} selected</span>
          </>
        )}
      </div>
      <p className="text-xs text-cream/35 mb-2">{heuristic}</p>
      <ShareMetaLine meta={data?.toolMeta?.before_you_sign} noun="comparison list" />
      <p className="text-[11px] text-cream/25 mb-4 truncate">
        Last updated: {checklists[0].title} · {relativeTime(checklists[0].updatedAt)}{checklists[0].updatedByName ? ` by ${checklists[0].updatedByName.split(' ')[0]}` : ''}
      </p>
      <Link
        href="/app/tools/before-you-sign"
        className="inline-flex items-center px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-button hover:bg-sandstone-light transition-colors"
      >
        Compare Contractors
      </Link>
    </div>
  )
}
