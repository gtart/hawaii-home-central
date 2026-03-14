'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { getHeuristicsConfig, matchDecision } from '@/lib/decisionHeuristics'
import {
  STATUS_CONFIG_V3,
  type SelectionV4,
} from '@/data/finish-decisions'
import Link from 'next/link'
import { buildDecisionHref } from '../lib/routing'

interface SelectionWithTags extends SelectionV4 {
  primaryTag: string
}

export function MilestoneView({ selections }: { selections: SelectionV4[] }) {
  const router = useRouter()
  const config = getHeuristicsConfig()
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(
    () => new Set(config.milestones.map((m) => m.id))
  )

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Add tag context to selections
  const allSelections: SelectionWithTags[] = useMemo(
    () =>
      selections.map((s) => ({
        ...s,
        primaryTag: s.tags[0] || '',
      })),
    [selections]
  )

  // Group selections by milestone
  const milestoneGroups = useMemo(() => {
    const groups = new Map<string, SelectionWithTags[]>()

    // Initialize groups for each milestone
    for (const milestone of config.milestones) {
      groups.set(milestone.id, [])
    }
    groups.set('other', [])

    for (const selection of allSelections) {
      const selectedOption = selection.options.find((opt) => opt.isSelected)
      const hintType = (selection.tags[0]?.toLowerCase().replace(/\s+/g, '_') || 'other') as any
      const result = matchDecision(
        config,
        selection.title,
        hintType,
        selectedOption?.name
      )

      if (result.milestones.length === 0) {
        groups.get('other')!.push(selection)
      } else {
        // Add to the first matched milestone (primary timing)
        const primaryMilestone = result.milestones[0]
        groups.get(primaryMilestone.id)!.push(selection)
      }
    }

    return groups
  }, [allSelections, config])

  return (
    <div className="space-y-3">
      {config.milestones.map((milestone) => {
        const milestoneSelections = milestoneGroups.get(milestone.id) || []
        if (milestoneSelections.length === 0) return null

        const isExpanded = expandedMilestones.has(milestone.id)

        return (
          <div key={milestone.id} className="bg-stone rounded-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-hover transition-colors"
              onClick={() => toggleMilestone(milestone.id)}
            >
              <span className="text-cream/65 text-sm select-none">
                {isExpanded ? '▼' : '▶'}
              </span>
              <h3 className="text-cream font-medium flex-1">{milestone.label}</h3>
              <span className="text-xs text-cream/65">
                {milestoneSelections.length} selection{milestoneSelections.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isExpanded && (
              <div className="border-t border-cream/15">
                <table className="w-full">
                  <thead className="border-b border-cream/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide">
                        Selection
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide">
                        Tags
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide hidden md:table-cell">
                        Selected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestoneSelections.map((s) => {
                      const selectedOption = s.options.find((opt) => opt.isSelected)
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-cream/10 hover:bg-basalt/50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(buildDecisionHref({ decisionId: s.id }))
                          }
                        >
                          <td className="px-4 py-2.5 text-sm text-cream font-medium">
                            {s.title}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-cream/70">
                            {s.tags.length > 0 ? s.tags.join(', ') : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={STATUS_CONFIG_V3[s.status].variant}>
                              {STATUS_CONFIG_V3[s.status].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            {selectedOption ? (
                              <span className="text-xs text-sandstone/70">
                                → {selectedOption.name}
                              </span>
                            ) : (
                              <span className="text-xs text-cream/35">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* Other selections (no milestone match) */}
      {(() => {
        const otherSelections = milestoneGroups.get('other') || []
        if (otherSelections.length === 0) return null

        const isExpanded = expandedMilestones.has('other')

        return (
          <div className="bg-stone rounded-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-hover transition-colors"
              onClick={() => toggleMilestone('other')}
            >
              <span className="text-cream/65 text-sm select-none">
                {isExpanded ? '▼' : '▶'}
              </span>
              <h3 className="text-cream/70 font-medium flex-1">Other</h3>
              <span className="text-xs text-cream/55">
                {otherSelections.length} selection{otherSelections.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isExpanded && (
              <div className="border-t border-cream/15">
                <table className="w-full">
                  <thead className="border-b border-cream/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide">
                        Selection
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide">
                        Tags
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/65 uppercase tracking-wide hidden md:table-cell">
                        Selected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherSelections.map((s) => {
                      const selectedOption = s.options.find((opt) => opt.isSelected)
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-cream/10 hover:bg-basalt/50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(buildDecisionHref({ decisionId: s.id }))
                          }
                        >
                          <td className="px-4 py-2.5 text-sm text-cream font-medium">
                            {s.title}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-cream/70">
                            {s.tags.length > 0 ? s.tags.join(', ') : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={STATUS_CONFIG_V3[s.status].variant}>
                              {STATUS_CONFIG_V3[s.status].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            {selectedOption ? (
                              <span className="text-xs text-sandstone/70">
                                → {selectedOption.name}
                              </span>
                            ) : (
                              <span className="text-xs text-cream/35">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

      {/* Link to Decision Stages Overview */}
      <div className="text-center pt-2">
        <Link
          href="/resources/renovation-stages"
          className="text-sm text-sandstone/60 hover:text-sandstone transition-colors"
        >
          View Renovation Stages Guide &rarr;
        </Link>
      </div>
    </div>
  )
}
