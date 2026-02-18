'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ALL_TABS, getTabItemIds } from '../beforeYouSignConfig'
import type { BYSContractor, BYSAnswer, TabKey, ContractType } from '../types'

function contractTypeLabel(type: ContractType): string {
  const labels: Record<ContractType, string> = {
    fixed: 'Fixed Price',
    time_materials: 'Time & Materials',
    cost_plus: 'Cost Plus',
    not_sure: 'Not sure',
    '': '',
  }
  return labels[type] || type
}

const TAB_LABELS: Record<TabKey, string> = {
  quotes: 'Quotes',
  handoffs: 'Who does what',
  agree: 'Agreed',
}

interface ContractorSnapshotRowProps {
  contractors: BYSContractor[]
  getAnswer: (tab: TabKey, contractorId: string, itemId: string) => BYSAnswer
}

export function ContractorSnapshotRow({
  contractors,
  getAnswer,
}: ContractorSnapshotRowProps) {
  const [expanded, setExpanded] = useState(false)

  const allTabItemIds = useMemo(
    () =>
      ALL_TABS.map((t) => ({
        key: t.key as TabKey,
        ids: getTabItemIds(t.key),
      })),
    []
  )

  const stats = useMemo(
    () =>
      contractors.map((c) => {
        const perTab = allTabItemIds.map(({ key, ids }) => {
          const answered = ids.filter(
            (id) => getAnswer(key, c.id, id).status !== 'unknown'
          ).length
          return {
            key,
            answered,
            total: ids.length,
            pct: ids.length > 0 ? Math.round((answered / ids.length) * 100) : 0,
          }
        })

        const totalItems = perTab.reduce((a, t) => a + t.total, 0)
        const totalAnswered = perTab.reduce((a, t) => a + t.answered, 0)

        return { id: c.id, name: c.name, contractor: c, perTab, totalAnswered, totalItems }
      }),
    [contractors, getAnswer, allTabItemIds]
  )

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => {
        const c = s.contractor
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'bg-basalt-50 rounded-lg border border-cream/10 px-3 py-2 text-left transition-all',
              'hover:border-cream/20',
              expanded && 'border-cream/20'
            )}
          >
            {/* Collapsed header - always visible */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-cream/70 truncate">
                {s.name}
              </p>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  'shrink-0 text-cream/30 transition-transform ml-2',
                  expanded && 'rotate-180'
                )}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <p className="text-[11px] text-cream/40 mt-1">
              {s.totalAnswered} / {s.totalItems} answered
            </p>

            {/* Expanded details */}
            {expanded && (
              <div className="mt-3 pt-3 border-t border-cream/5 space-y-3">
                {/* Contract value */}
                {(c.totalValue || (c.contractType && contractTypeLabel(c.contractType))) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {c.totalValue && (
                      <div>
                        <span className="text-[11px] text-cream/40">Value: </span>
                        <span className="text-xs text-cream/70 font-medium">{c.totalValue}</span>
                      </div>
                    )}
                    {c.contractType && contractTypeLabel(c.contractType) && (
                      <div>
                        <span className="text-[11px] text-cream/40">Type: </span>
                        <span className="text-xs text-cream/70">{contractTypeLabel(c.contractType)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Per-tab completion */}
                <div className="space-y-1.5">
                  {s.perTab.map((tab) => (
                    <div key={tab.key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-cream/40">{TAB_LABELS[tab.key]}</span>
                        <span className="text-[11px] text-cream/50">{tab.pct}%</span>
                      </div>
                      <div className="h-1 bg-cream/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sandstone/60 rounded-full transition-all"
                          style={{ width: `${tab.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Truncated notes */}
                {c.notes && (
                  <div>
                    <p className="text-[11px] text-cream/40 mb-0.5">Notes</p>
                    <p className="text-xs text-cream/50 line-clamp-2">{c.notes}</p>
                  </div>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
