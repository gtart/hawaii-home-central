'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ResponsibilityRow } from '@/components/resources/ResponsibilityRow'
import {
  RESPONSIBILITY_ITEMS,
  STAGES,
  type OwnerOption,
  type ResponsibilityStage,
} from '@/data/responsibility-matrix'

interface PerRowState {
  selectedOwner: OwnerOption | ''
  notes: string
}

type StageFilter = ResponsibilityStage | 'All'

export function ResponsibilityPublicContent() {
  const [rowStates, setRowStates] = useState<Record<string, PerRowState>>({})
  const [activeStage, setActiveStage] = useState<StageFilter>('All')

  const filteredItems =
    activeStage === 'All'
      ? RESPONSIBILITY_ITEMS
      : RESPONSIBILITY_ITEMS.filter((item) => item.stage === activeStage)

  const hasAnySelection = Object.values(rowStates).some(
    (state) => state.selectedOwner || state.notes
  )

  const totalItems = RESPONSIBILITY_ITEMS.length
  const assignedCount = RESPONSIBILITY_ITEMS.filter(
    (item) => rowStates[item.id]?.selectedOwner
  ).length
  const unassignedHighVariance = RESPONSIBILITY_ITEMS.filter(
    (item) => item.variance === 'high' && !rowStates[item.id]?.selectedOwner
  ).length

  const stageFilters: StageFilter[] = ['All', ...STAGES]

  const setOwner = (id: string, owner: OwnerOption | '') => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { selectedOwner: owner, notes: prev[id]?.notes ?? '' },
    }))
  }

  const setNotes = (id: string, notes: string) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { notes, selectedOwner: prev[id]?.selectedOwner ?? '' },
    }))
  }

  const fillWithTypical = () => {
    setRowStates((prev) => {
      const next = { ...prev }
      for (const item of RESPONSIBILITY_ITEMS) {
        if (!next[item.id]?.selectedOwner) {
          next[item.id] = {
            selectedOwner: item.oftenOwner,
            notes: next[item.id]?.notes ?? '',
          }
        }
      }
      return next
    })
  }

  const resetAll = () => {
    setRowStates({})
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {stageFilters.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeStage === stage
                ? 'bg-sandstone text-basalt'
                : 'bg-basalt-50 text-cream/50 border border-cream/10 hover:border-cream/30 hover:text-cream/70'
            )}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-cream/60">
            Assigned {assignedCount}/{totalItems}
          </span>
          {unassignedHighVariance > 0 && (
            <span className="text-sandstone/70">
              {unassignedHighVariance} unassigned high-variance
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {assignedCount < totalItems && (
            <Button
              variant="secondary"
              size="sm"
              onClick={fillWithTypical}
            >
              Fill with typical
            </Button>
          )}
          {hasAnySelection && (
            <Button variant="ghost" size="sm" onClick={resetAll}>
              Reset all
            </Button>
          )}
        </div>
      </div>

      <div className="bg-basalt-50 rounded-card p-6">
        {filteredItems.length === 0 ? (
          <p className="text-cream/40 text-sm text-center py-4">
            No items for this stage.
          </p>
        ) : (
          filteredItems.map((item) => (
            <ResponsibilityRow
              key={item.id}
              item={item}
              selectedOwner={rowStates[item.id]?.selectedOwner ?? ''}
              notes={rowStates[item.id]?.notes ?? ''}
              onOwnerChange={setOwner}
              onNotesChange={setNotes}
            />
          ))
        )}
      </div>
    </>
  )
}
