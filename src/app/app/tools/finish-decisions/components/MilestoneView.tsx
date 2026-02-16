'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { getHeuristicsConfig, matchDecision } from '@/lib/decisionHeuristics'
import {
  STATUS_CONFIG_V3,
  type RoomV3,
  type DecisionV3,
} from '@/data/finish-decisions'
import Link from 'next/link'

interface DecisionWithRoom extends DecisionV3 {
  roomId: string
  roomName: string
  roomType: string
}

export function MilestoneView({ rooms }: { rooms: RoomV3[] }) {
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

  // Flatten all decisions with room context
  const allDecisions: DecisionWithRoom[] = useMemo(
    () =>
      rooms.flatMap((room) =>
        room.decisions.map((d) => ({
          ...d,
          roomId: room.id,
          roomName: room.name,
          roomType: room.type,
        }))
      ),
    [rooms]
  )

  // Group decisions by milestone
  const milestoneGroups = useMemo(() => {
    const groups = new Map<string, DecisionWithRoom[]>()

    // Initialize groups for each milestone
    for (const milestone of config.milestones) {
      groups.set(milestone.id, [])
    }
    groups.set('other', [])

    for (const decision of allDecisions) {
      const selectedOption = decision.options.find((opt) => opt.isSelected)
      const result = matchDecision(
        config,
        decision.title,
        decision.roomType,
        selectedOption?.name
      )

      if (result.milestones.length === 0) {
        groups.get('other')!.push(decision)
      } else {
        // Add to the first matched milestone (primary timing)
        const primaryMilestone = result.milestones[0]
        groups.get(primaryMilestone.id)!.push(decision)
      }
    }

    return groups
  }, [allDecisions, config])

  return (
    <div className="space-y-3">
      {config.milestones.map((milestone) => {
        const decisions = milestoneGroups.get(milestone.id) || []
        if (decisions.length === 0) return null

        const isExpanded = expandedMilestones.has(milestone.id)

        return (
          <div key={milestone.id} className="bg-basalt-50 rounded-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-basalt-50/80 transition-colors"
              onClick={() => toggleMilestone(milestone.id)}
            >
              <span className="text-cream/50 text-sm select-none">
                {isExpanded ? '▼' : '▶'}
              </span>
              <h3 className="text-cream font-medium flex-1">{milestone.label}</h3>
              <span className="text-xs text-cream/50">
                {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isExpanded && (
              <div className="border-t border-cream/10">
                <table className="w-full">
                  <thead className="border-b border-cream/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide">
                        Decision
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide">
                        Room
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide hidden md:table-cell">
                        Selected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((d) => {
                      const selectedOption = d.options.find((opt) => opt.isSelected)
                      return (
                        <tr
                          key={`${d.roomId}-${d.id}`}
                          className="border-b border-cream/5 hover:bg-basalt/50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(`/app/tools/finish-decisions/decision/${d.id}`)
                          }
                        >
                          <td className="px-4 py-2.5 text-sm text-cream font-medium">
                            {d.title}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-cream/60">{d.roomName}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={STATUS_CONFIG_V3[d.status].variant}>
                              {STATUS_CONFIG_V3[d.status].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            {selectedOption ? (
                              <span className="text-xs text-sandstone/70">
                                → {selectedOption.name}
                              </span>
                            ) : (
                              <span className="text-xs text-cream/20">—</span>
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

      {/* Other decisions (no milestone match) */}
      {(() => {
        const otherDecisions = milestoneGroups.get('other') || []
        if (otherDecisions.length === 0) return null

        const isExpanded = expandedMilestones.has('other')

        return (
          <div className="bg-basalt-50 rounded-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-basalt-50/80 transition-colors"
              onClick={() => toggleMilestone('other')}
            >
              <span className="text-cream/50 text-sm select-none">
                {isExpanded ? '▼' : '▶'}
              </span>
              <h3 className="text-cream/60 font-medium flex-1">Other</h3>
              <span className="text-xs text-cream/40">
                {otherDecisions.length} decision{otherDecisions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isExpanded && (
              <div className="border-t border-cream/10">
                <table className="w-full">
                  <thead className="border-b border-cream/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide">
                        Decision
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide">
                        Room
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-cream/50 uppercase tracking-wide hidden md:table-cell">
                        Selected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherDecisions.map((d) => {
                      const selectedOption = d.options.find((opt) => opt.isSelected)
                      return (
                        <tr
                          key={`${d.roomId}-${d.id}`}
                          className="border-b border-cream/5 hover:bg-basalt/50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(`/app/tools/finish-decisions/decision/${d.id}`)
                          }
                        >
                          <td className="px-4 py-2.5 text-sm text-cream font-medium">
                            {d.title}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-cream/60">{d.roomName}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant={STATUS_CONFIG_V3[d.status].variant}>
                              {STATUS_CONFIG_V3[d.status].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            {selectedOption ? (
                              <span className="text-xs text-sandstone/70">
                                → {selectedOption.name}
                              </span>
                            ) : (
                              <span className="text-xs text-cream/20">—</span>
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
