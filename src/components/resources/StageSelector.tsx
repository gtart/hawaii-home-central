'use client'

import { cn } from '@/lib/utils'
import type { HoldPointStageData } from '@/data/hold-points'

interface StageSelectorProps {
  stages: HoldPointStageData[]
  activeStageId: string
  onSelect: (stageId: string) => void
  checkedItems: Record<string, boolean>
}

export function StageSelector({ stages, activeStageId, onSelect, checkedItems }: StageSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
      {stages.map((stage) => {
        const isActive = stage.id === activeStageId
        const checkedCount = stage.items.filter((item) => checkedItems[item.id]).length
        const totalCount = stage.items.length

        return (
          <button
            key={stage.id}
            onClick={() => onSelect(stage.id)}
            className={cn(
              'rounded-button px-4 py-2 text-sm whitespace-nowrap transition-colors shrink-0',
              isActive
                ? 'bg-sandstone text-basalt font-medium'
                : 'bg-basalt-50 text-cream/60 hover:text-cream/80'
            )}
          >
            {stage.title}
            <span className={cn(
              'ml-1.5 text-xs',
              isActive ? 'text-basalt/60' : 'text-cream/30'
            )}>
              {checkedCount}/{totalCount}
            </span>
          </button>
        )
      })}
    </div>
  )
}
