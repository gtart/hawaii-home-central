'use client'

import { cn } from '@/lib/utils'
import type { DecisionPointStageData } from '@/data/decision-points'

interface StageSelectorProps {
  stages: DecisionPointStageData[]
  activeStageId: string
  onSelect: (stageId: string) => void
  checkedItems: Record<string, boolean>
}

function getStepState(
  stage: DecisionPointStageData,
  checkedItems: Record<string, boolean>,
  isActive: boolean
): 'default' | 'active' | 'completed' {
  if (isActive) return 'active'
  const checkedCount = stage.items.filter((item) => checkedItems[item.id]).length
  if (checkedCount === stage.items.length) return 'completed'
  return 'default'
}

export function StageSelector({ stages, activeStageId, onSelect, checkedItems }: StageSelectorProps) {
  return (
    <div className="mb-8">
      {/* Desktop: single row with connectors */}
      <div className="hidden md:flex items-start justify-between">
        {stages.map((stage, index) => {
          const state = getStepState(stage, checkedItems, stage.id === activeStageId)
          const checkedCount = stage.items.filter((item) => checkedItems[item.id]).length

          return (
            <div key={stage.id} className="flex items-start flex-1">
              <button
                onClick={() => onSelect(stage.id)}
                className="flex flex-col items-center text-center group w-full"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    state === 'active' && 'bg-sandstone text-basalt',
                    state === 'completed' && 'bg-sandstone/30 text-sandstone',
                    state === 'default' && 'border border-cream/20 text-cream/40 group-hover:border-cream/40 group-hover:text-cream/60'
                  )}
                >
                  {state === 'completed' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 leading-tight transition-colors',
                    state === 'active' ? 'text-sandstone font-medium' : 'text-cream/50 group-hover:text-cream/70'
                  )}
                >
                  {stage.title}
                </span>
                <span className="text-xs text-cream/30 mt-0.5">
                  {checkedCount}/{stage.items.length}
                </span>
              </button>
              {index < stages.length - 1 && (
                <div className="h-px bg-cream/10 flex-1 mt-4 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden flex flex-col gap-1">
        {stages.map((stage, index) => {
          const state = getStepState(stage, checkedItems, stage.id === activeStageId)
          const checkedCount = stage.items.filter((item) => checkedItems[item.id]).length

          return (
            <button
              key={stage.id}
              onClick={() => onSelect(stage.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left w-full',
                state === 'active' && 'bg-cream/5'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 transition-colors',
                  state === 'active' && 'bg-sandstone text-basalt',
                  state === 'completed' && 'bg-sandstone/30 text-sandstone',
                  state === 'default' && 'border border-cream/20 text-cream/40'
                )}
              >
                {state === 'completed' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-sm flex-1 transition-colors',
                  state === 'active' ? 'text-sandstone font-medium' : 'text-cream/50'
                )}
              >
                {stage.title}
              </span>
              <span className="text-xs text-cream/30 shrink-0">
                {checkedCount}/{stage.items.length}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
