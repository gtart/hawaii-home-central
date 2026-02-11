'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ShareButton } from '@/components/resources/ShareButton'
import { StageSelector } from '@/components/resources/StageSelector'
import { SpecCard } from '@/components/resources/SpecCard'
import { DECISION_POINT_STAGES } from '@/data/decision-points'
import type { DecisionPointItemData } from '@/data/decision-points'
import { useToolState } from '@/hooks/useToolState'

type StageStatus = 'not-locked' | 'partially-locked' | 'locked'

function getStageStatus(
  items: DecisionPointItemData[],
  checkedItems: Record<string, boolean>
): StageStatus {
  const checkedCount = items.filter((item) => checkedItems[item.id]).length
  if (checkedCount === 0) return 'not-locked'
  if (checkedCount === items.length) return 'locked'
  return 'partially-locked'
}

const STATUS_LABELS: Record<StageStatus, string> = {
  'not-locked': 'Not locked',
  'partially-locked': 'Partially locked',
  'locked': 'Locked',
}

function renderStageItems(
  items: DecisionPointItemData[],
  checkedItems: Record<string, boolean>,
  toggle: (id: string) => void
) {
  const hasGroups = items.some((item) => item.group)

  if (!hasGroups) {
    return items.map((item) => (
      <SpecCard
        key={item.id}
        item={item}
        isChecked={!!checkedItems[item.id]}
        onToggle={toggle}
      />
    ))
  }

  const groups = new Map<string, DecisionPointItemData[]>()
  for (const item of items) {
    const group = item.group ?? 'Other'
    const existing = groups.get(group) ?? []
    existing.push(item)
    groups.set(group, existing)
  }

  return Array.from(groups).map(([groupName, groupItems]) => (
    <div key={groupName}>
      <p className="text-cream/50 text-xs font-medium uppercase tracking-wider mb-2 mt-4 first:mt-0">
        {groupName}
      </p>
      {groupItems.map((item) => (
        <SpecCard
          key={item.id}
          item={item}
          isChecked={!!checkedItems[item.id]}
          onToggle={toggle}
        />
      ))}
    </div>
  ))
}

function StageDecisionSummary({
  items,
  checkedItems,
}: {
  items: DecisionPointItemData[]
  checkedItems: Record<string, boolean>
}) {
  const total = items.length
  const decided = items.filter((item) => checkedItems[item.id]).length
  const remaining = total - decided
  const withHawaiiCallout = items.filter(
    (item) => item.hawaiiCallout && !checkedItems[item.id]
  ).length

  if (remaining === 0) return null

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-6 flex items-center justify-between">
      <span className="text-cream/70 text-sm">
        {remaining} decision{remaining !== 1 ? 's' : ''} left
        {withHawaiiCallout > 0 && (
          <span className="text-sandstone ml-1">
            &middot; {withHawaiiCallout} with Hawai&#x02BB;i considerations
          </span>
        )}
      </span>
      <span className="text-cream/40 text-sm">
        {decided}/{total} locked
      </span>
    </div>
  )
}

export function ToolContent() {
  const { state: checkedItems, setState: setCheckedItems, isLoaded, isSyncing } =
    useToolState<Record<string, boolean>>({
      toolKey: 'hold_points',
      localStorageKey: 'hhc_holdpoints_state',
      defaultValue: {},
    })

  const [activeStageId, setActiveStageId] = useState(DECISION_POINT_STAGES[0].id)

  const activeStage =
    DECISION_POINT_STAGES.find((s) => s.id === activeStageId) ?? DECISION_POINT_STAGES[0]
  const status = isLoaded
    ? getStageStatus(activeStage.items, checkedItems)
    : 'not-locked'
  const hasCheckedInStage = activeStage.items.some(
    (item) => checkedItems[item.id]
  )

  const toggle = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const resetStage = (itemIds: string[]) => {
    setCheckedItems((prev) => {
      const next = { ...prev }
      for (const id of itemIds) {
        delete next[id]
      }
      return next
    })
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
            Decision Points
          </h1>
          <div className="shrink-0 mt-2 flex items-center gap-3">
            {isSyncing && (
              <span className="text-xs text-cream/30">Saving...</span>
            )}
            <ShareButton title="Decision Points &mdash; Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          The costliest renovation mistakes happen when decisions are made after
          construction moves on. This tool shows what must be locked in before
          each stage.
        </p>

        <div className="bg-basalt-50 rounded-card p-6 mb-8">
          <h2 className="font-serif text-xl text-sandstone mb-3">
            What is a decision point?
          </h2>
          <p className="text-cream/70 text-sm leading-relaxed mb-3">
            A decision point is a stage in construction where work should not
            proceed until certain choices are locked in.
          </p>
          <p className="text-cream/60 text-sm leading-relaxed italic">
            Once you pass a decision point, changes become expensive, disruptive,
            or impossible.
          </p>
        </div>

        {isLoaded && (
          <>
            <StageSelector
              stages={DECISION_POINT_STAGES}
              activeStageId={activeStageId}
              onSelect={setActiveStageId}
              checkedItems={checkedItems}
            />

            <StageDecisionSummary
              items={activeStage.items}
              checkedItems={checkedItems}
            />

            <div key={activeStageId} className="animate-fade-in">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-xl text-sandstone">
                    {activeStage.title}
                  </h2>
                  <Badge
                    variant={status === 'locked' ? 'accent' : 'default'}
                  >
                    {STATUS_LABELS[status]}
                  </Badge>
                </div>
                {hasCheckedInStage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      resetStage(activeStage.items.map((i) => i.id))
                    }
                  >
                    Reset
                  </Button>
                )}
              </div>
              <p className="text-cream/50 text-sm mb-6">
                {activeStage.subtitle}
              </p>

              <div className="bg-basalt-50 rounded-card p-6">
                {renderStageItems(activeStage.items, checkedItems, toggle)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
