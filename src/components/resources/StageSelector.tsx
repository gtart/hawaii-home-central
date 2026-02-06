'use client'

import { cn } from '@/lib/utils'
import type { HoldPointStageData } from '@/data/hold-points'

interface StageSelectorProps {
  stages: HoldPointStageData[]
  activeStageId: string
  onSelect: (stageId: string) => void
  checkedItems: Record<string, boolean>
}

function getStepState(
  stage: HoldPointStageData,
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

      {/* Mobile: flex-wrap grid, no scrolling */}
      <div className="md:hidden flex flex-wrap justify-center gap-x-6 gap-y-4">
        {stages.map((stage, index) => {
          const state = getStepState(stage, checkedItems, stage.id === activeStageId)
          const checkedCount = stage.items.filter((item) => checkedItems[item.id]).length

          return (
            <button
              key={stage.id}
              onClick={() => onSelect(stage.id)}
              className="flex flex-col items-center text-center w-[4.5rem]"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  state === 'active' && 'bg-sandstone text-basalt',
                  state === 'completed' && 'bg-sandstone/30 text-sandstone',
                  state === 'default' && 'border border-cream/20 text-cream/40'
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
                  'text-[10px] mt-1.5 leading-tight',
                  state === 'active' ? 'text-sandstone font-medium' : 'text-cream/50'
                )}
              >
                {stage.title}
              </span>
              <span className="text-[10px] text-cream/30 mt-0.5">
                {checkedCount}/{stage.items.length}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
