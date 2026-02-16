'use client'

import { useMemo } from 'react'
import { ALL_TABS, getTabItemIds } from '../beforeYouSignConfig'
import type { BYSContractor, BYSAnswer, TabKey } from '../types'

interface ContractorSnapshotRowProps {
  contractors: BYSContractor[]
  getAnswer: (tab: TabKey, contractorId: string, itemId: string) => BYSAnswer
}

export function ContractorSnapshotRow({
  contractors,
  getAnswer,
}: ContractorSnapshotRowProps) {
  // Precompute essential item IDs (quotes tab, priority === 'essential')
  const essentialIds = useMemo(() => {
    const quotesTab = ALL_TABS.find((t) => t.key === 'quotes')
    if (!quotesTab) return []
    return quotesTab.sections.flatMap((s) =>
      s.items.filter((i) => i.priority === 'essential').map((i) => i.id)
    )
  }, [])

  // All item IDs across all tabs
  const allTabItemIds = useMemo(
    () =>
      ALL_TABS.map((t) => ({
        key: t.key,
        ids: getTabItemIds(t.key),
      })),
    []
  )

  const stats = useMemo(
    () =>
      contractors.map((c) => {
        // Confirmed essentials (yes only)
        const confirmedEssentials = essentialIds.filter(
          (id) => getAnswer('quotes', c.id, id).status === 'yes'
        ).length

        // Answered across all tabs (yes + no)
        let totalItems = 0
        let totalAnswered = 0
        for (const { key, ids } of allTabItemIds) {
          totalItems += ids.length
          totalAnswered += ids.filter(
            (id) => getAnswer(key as TabKey, c.id, id).status !== 'unknown'
          ).length
        }

        return {
          id: c.id,
          name: c.name,
          confirmedEssentials,
          totalEssentials: essentialIds.length,
          totalAnswered,
          totalItems,
        }
      }),
    [contractors, getAnswer, essentialIds, allTabItemIds]
  )

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.id}
          className="bg-basalt-50 rounded-lg border border-cream/10 px-3 py-2"
        >
          <p className="text-xs font-medium text-cream/70 truncate mb-1">
            {s.name}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-cream/40">
            <span>
              <span className="text-emerald-400/70">
                {s.confirmedEssentials}
              </span>{' '}
              / {s.totalEssentials} essentials confirmed
            </span>
            <span>
              {s.totalAnswered} / {s.totalItems} answered
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
