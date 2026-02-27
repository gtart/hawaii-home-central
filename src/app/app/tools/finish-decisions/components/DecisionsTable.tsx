'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import {
  STATUS_CONFIG_V3,
  type DecisionV3,
} from '@/data/finish-decisions'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { DecisionCard } from './DecisionCard'

function getDecisionThumbnail(decision: DecisionV3): string | null {
  // 1. Selected option with image
  for (const opt of decision.options) {
    if (opt.isSelected) {
      const hero = getHeroImage(opt)
      if (hero) return displayUrl(hero.thumbnailUrl || hero.url)
      if (opt.thumbnailUrl) return displayUrl(opt.thumbnailUrl)
      if (opt.imageUrl) return displayUrl(opt.imageUrl)
    }
  }
  // 2. Any option with image (most recent first)
  const withImage = [...decision.options].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  for (const opt of withImage) {
    const hero = getHeroImage(opt)
    if (hero) return displayUrl(hero.thumbnailUrl || hero.url)
    if (opt.thumbnailUrl) return displayUrl(opt.thumbnailUrl)
    if (opt.imageUrl) return displayUrl(opt.imageUrl)
  }
  return null
}

function safeStatusConfig(status: string) {
  return STATUS_CONFIG_V3[status as keyof typeof STATUS_CONFIG_V3] ?? STATUS_CONFIG_V3.deciding
}

export function DecisionsTable({
  decisions,
  roomType,
  onDeleteDecision,
  readOnly = false,
  emojiMap = {},
}: {
  decisions: DecisionV3[]
  roomType: string
  onDeleteDecision: (decisionId: string) => void
  readOnly?: boolean
  emojiMap?: Record<string, string>
}) {
  const router = useRouter()
  const [sortColumn, setSortColumn] = useState<'title' | 'status' | 'dueDate' | 'updated'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const sortedDecisions = useMemo(() => {
    const sorted = [...decisions].sort((a, b) => {
      // Pin Uncategorized first always
      const aUncat = a.systemKey === 'uncategorized' ? 0 : 1
      const bUncat = b.systemKey === 'uncategorized' ? 0 : 1
      if (aUncat !== bUncat) return aUncat - bUncat

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
        No decisions yet. Use <strong className="text-cream/60">+ Decision</strong> in this room to get started.
      </div>
    )
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {sortedDecisions.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            thumbnail={getDecisionThumbnail(decision)}
            onDelete={() => onDeleteDecision(decision.id)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-cream/10">
            <tr>
              <th className="px-3 py-2 w-14"></th>
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
                Ideas
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-cream/60 uppercase tracking-wide">
                Comments
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-cream/60 uppercase tracking-wide">
                Notes
              </th>
              {!readOnly && <th className="px-3 py-2 w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {sortedDecisions.map((decision) => {
              const thumbnail = getDecisionThumbnail(decision)
              const statusCfg = safeStatusConfig(decision.status)

              return (
                <tr
                  key={decision.id}
                  className="border-b border-cream/5 hover:bg-basalt/50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/app/tools/finish-decisions/decision/${decision.id}`)
                  }
                >
                  {/* Thumbnail cell */}
                  <td className="px-3 py-2.5">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-basalt/50 flex items-center justify-center text-lg">
                        {emojiMap[decision.title.toLowerCase()] || '📋'}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-cream font-medium text-sm">{decision.title}</div>
                    {(() => {
                      const sel = decision.options.find(o => o.isSelected)
                      return sel ? (
                        <div className="text-[11px] text-sandstone/60 mt-0.5 truncate">Selected: {sel.name}</div>
                      ) : null
                    })()}
                  </td>
                  <td className="px-3 py-2.5">
                    {decision.systemKey === 'uncategorized' ? (
                      <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[11px] rounded-full">
                        Needs sorting
                      </span>
                    ) : (
                      <Badge variant={statusCfg.variant}>
                        {statusCfg.label}
                      </Badge>
                    )}
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
                  <td className="px-3 py-2.5 text-center">
                    {(() => {
                      const cmt = decision.comments?.length ?? 0
                      return cmt > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cream/50">
                          <span>💬</span>
                          <span>{cmt}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-cream/20">&mdash;</span>
                      )
                    })()}
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
                      {decision.systemKey !== 'uncategorized' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteDecision(decision.id)
                          }}
                          className="text-red-400/60 hover:text-red-400 text-xs"
                        >
                          &times;
                        </button>
                      )}
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
