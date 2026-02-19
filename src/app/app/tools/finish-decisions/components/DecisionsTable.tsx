'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import {
  STATUS_CONFIG_V3,
  type DecisionV3,
} from '@/data/finish-decisions'
import { getHeuristicsConfig, matchDecision } from '@/lib/decisionHeuristics'
import { DecisionCard } from './DecisionCard'

export function DecisionsTable({
  decisions,
  roomType,
  onDeleteDecision,
  readOnly = false,
}: {
  decisions: DecisionV3[]
  roomType: string
  onDeleteDecision: (decisionId: string) => void
  readOnly?: boolean
}) {
  const router = useRouter()
  const heuristicsConfig = useMemo(() => getHeuristicsConfig(), [])
  const [sortColumn, setSortColumn] = useState<'title' | 'status' | 'dueDate' | 'updated'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedDecisions = useMemo(() => {
    const sorted = [...decisions].sort((a, b) => {
      let comparison = 0
      if (sortColumn === 'title') {
        comparison = a.title.localeCompare(b.title)
      } else if (sortColumn === 'status') {
        comparison = a.status.localeCompare(b.status)
      } else if (sortColumn === 'dueDate') {
        const aDate = a.dueDate || 'zzzz' // nulls sort last
        const bDate = b.dueDate || 'zzzz'
        comparison = aDate.localeCompare(bDate)
      } else if (sortColumn === 'updated') {
        comparison = (a.updatedAt || '').localeCompare(b.updatedAt || '')
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })
    return sorted
  }, [decisions, sortColumn, sortDirection])

  const toggleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const arrow = (col: typeof sortColumn) =>
    sortColumn === col ? (sortDirection === 'asc' ? ' \u2191' : ' \u2193') : ''

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-8 text-cream/50 text-sm">
        No decisions yet. Click &quot;+ Add Decision&quot; to get started.
      </div>
    )
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {sortedDecisions.map((decision) => {
          const selectedOption = decision.options.find((opt) => opt.isSelected)
          const hResult = matchDecision(
            heuristicsConfig,
            decision.title,
            roomType,
            selectedOption?.name,
            decision.dismissedSuggestionKeys
          )
          const milestone = hResult.milestones[0] || null

          return (
            <DecisionCard
              key={decision.id}
              decision={decision}
              milestone={milestone}
              onDelete={() => onDeleteDecision(decision.id)}
              readOnly={readOnly}
            />
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-cream/10">
            <tr>
              <th
                onClick={() => toggleSort('title')}
                className="px-3 py-2 text-left text-xs font-medium text-cream/60 cursor-pointer hover:text-cream uppercase tracking-wide"
              >
                Decision{arrow('title')}
              </th>
              <th
                onClick={() => toggleSort('status')}
                className="px-3 py-2 text-left text-xs font-medium text-cream/60 cursor-pointer hover:text-cream uppercase tracking-wide"
              >
                Status{arrow('status')}
              </th>
              <th
                onClick={() => toggleSort('dueDate')}
                className="px-3 py-2 text-left text-xs font-medium text-cream/60 cursor-pointer hover:text-cream uppercase tracking-wide"
              >
                Due{arrow('dueDate')}
              </th>
              <th
                onClick={() => toggleSort('updated')}
                className="px-3 py-2 text-left text-xs font-medium text-cream/60 cursor-pointer hover:text-cream uppercase tracking-wide"
              >
                Updated{arrow('updated')}
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-cream/60 uppercase tracking-wide">
                Opts
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-cream/60 uppercase tracking-wide">
                Notes
              </th>
              {!readOnly && <th className="px-3 py-2 w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {sortedDecisions.map((decision) => {
              const selectedOption = decision.options.find((opt) => opt.isSelected)
              const hResult = matchDecision(
                heuristicsConfig,
                decision.title,
                roomType,
                selectedOption?.name,
                decision.dismissedSuggestionKeys
              )
              const milestone = hResult.milestones[0]

              return (
                <tr
                  key={decision.id}
                  className="border-b border-cream/5 hover:bg-basalt/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/app/tools/finish-decisions/decision/${decision.id}`)
                  }
                >
                  <td className="px-3 py-2.5">
                    <div className="text-cream font-medium text-sm">{decision.title}</div>
                    {milestone && (
                      <span className="inline-block mt-0.5 text-[11px] text-sandstone/70 bg-sandstone/10 px-2 py-0.5 rounded-full">
                        {milestone.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={STATUS_CONFIG_V3[decision.status].variant}>
                      {STATUS_CONFIG_V3[decision.status].label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    {decision.dueDate ? (
                      <span className="text-xs text-cream/60">
                        {new Date(decision.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-cream/20">TBD</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-cream/40">
                      {formatRelativeDate(decision.updatedAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs text-cream/40">
                      {decision.options.length}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[200px]">
                    {decision.notes ? (
                      <span className="text-xs text-cream/50 truncate block">{decision.notes}</span>
                    ) : (
                      <span className="text-xs text-cream/20">&mdash;</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteDecision(decision.id)
                        }}
                        className="text-red-400/60 hover:text-red-400 text-xs"
                      >
                        &times;
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
