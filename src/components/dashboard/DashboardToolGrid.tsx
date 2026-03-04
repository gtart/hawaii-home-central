'use client'

import type { DashboardResponse } from '@/server/dashboard'
import { rankTools, type ToolKey } from './toolScoring'
import { DashboardCardFixList } from './DashboardCardFixList'
import { DashboardCardSelections } from './DashboardCardSelections'
import { DashboardCardMoodBoards } from './DashboardCardMoodBoards'
import { DashboardCardContractChecklist } from './DashboardCardContractChecklist'
import { DashboardSecondary } from './DashboardSecondary'
import { TOOL_LABELS, TOOL_PATHS } from '@/lib/tool-registry'

const CARD_MAP: Record<ToolKey, React.FC<{ data: DashboardResponse | null; isLoading: boolean }>> = {
  punchlist: DashboardCardFixList,
  finish_decisions: DashboardCardSelections,
  mood_boards: DashboardCardMoodBoards,
  before_you_sign: DashboardCardContractChecklist,
}

export function DashboardToolGrid({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-basalt-50 rounded-card border border-cream/10 p-5 md:p-6 animate-pulse">
            <div className="h-3 w-16 bg-cream/5 rounded mb-4" />
            <div className="h-8 w-20 bg-cream/5 rounded mb-2" />
            <div className="h-3 w-48 bg-cream/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const { active, other } = rankTools(data)

  return (
    <>
      {/* Active tools — full-weight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {active.map(({ toolKey }) => {
          const Card = CARD_MAP[toolKey]
          return <Card key={toolKey} data={data} isLoading={false} />
        })}
      </div>

      {/* Other tools — compact row */}
      {other.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-cream/20 mb-3">Other Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {other.map(({ toolKey }) => (
              <DashboardSecondary
                key={toolKey}
                title={TOOL_LABELS[toolKey] || toolKey}
                href={TOOL_PATHS[toolKey] || '/app'}
                toolKey={toolKey}
                data={data}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
