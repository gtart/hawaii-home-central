'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmailGate } from '@/components/forms/EmailGate'
import { ShareButton } from '@/components/resources/ShareButton'
import { StageSelector } from '@/components/resources/StageSelector'
import { SpecCard } from '@/components/resources/SpecCard'
import { HOLD_POINT_STAGES } from '@/data/hold-points'
import type { HoldPointItemData } from '@/data/hold-points'

const HOLDPOINTS_STORAGE_KEY = 'hhc_holdpoints_state'

type StageStatus = 'not-locked' | 'partially-locked' | 'locked'

function getStageStatus(
  items: HoldPointItemData[],
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

function useHoldPointsState() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HOLDPOINTS_STORAGE_KEY)
      if (stored) {
        setCheckedItems(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  const toggle = useCallback((id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(HOLDPOINTS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { checkedItems, toggle, isLoaded }
}

function PreviewContent() {
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
        Hold Points
      </h1>
      <p className="text-cream/70 text-lg mb-8 leading-relaxed">
        The most expensive mistakes happen when decisions are made after construction has already moved on. This playbook highlights the key moments where decisions must be locked in before work continues.
      </p>

      <div className="bg-basalt-50 rounded-card p-6 mb-8">
        <h2 className="font-serif text-xl text-cream mb-3">What&apos;s inside</h2>
        <ul className="text-cream/60 space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>5 construction stages with spec decisions that must be locked in</span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>Interactive checkboxes that save your progress</span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>Expandable detail explaining why each decision matters and what to confirm</span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>Hawai&#x02BB;i-specific callouts for local conditions</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export function PlaybookContent() {
  const { checkedItems, toggle, isLoaded } = useHoldPointsState()
  const [activeStageId, setActiveStageId] = useState(HOLD_POINT_STAGES[0].id)

  const activeStage = HOLD_POINT_STAGES.find((s) => s.id === activeStageId) ?? HOLD_POINT_STAGES[0]
  const status = isLoaded ? getStageStatus(activeStage.items, checkedItems) : 'not-locked'

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <EmailGate previewContent={<PreviewContent />}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
              Hold Points
            </h1>
            <div className="shrink-0 mt-2">
              <ShareButton title="Hold Points: Specs You Must Lock In By Stage \u2014 Hawaii Home Central" />
            </div>
          </div>

          <p className="text-cream/70 text-lg mb-8 leading-relaxed">
            The most expensive mistakes happen when decisions are made after construction has already moved on. This playbook highlights the key moments where decisions must be locked in before work continues.
          </p>

          <div className="bg-basalt-50 rounded-card p-6 mb-8">
            <h2 className="font-serif text-xl text-sandstone mb-3">What is a hold point?</h2>
            <p className="text-cream/70 text-sm leading-relaxed mb-3">
              A hold point is a stage in construction where work should not proceed until certain decisions are resolved.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed italic">
              Once you pass a hold point, changes become expensive, disruptive, or impossible.
            </p>
          </div>

          {isLoaded && (
            <>
              <StageSelector
                stages={HOLD_POINT_STAGES}
                activeStageId={activeStageId}
                onSelect={setActiveStageId}
                checkedItems={checkedItems}
              />

              <div key={activeStageId} className="animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-serif text-xl text-sandstone">{activeStage.title}</h2>
                  <Badge variant={status === 'locked' ? 'accent' : 'default'}>
                    {STATUS_LABELS[status]}
                  </Badge>
                </div>
                <p className="text-cream/50 text-sm mb-6">{activeStage.subtitle}</p>

                <div className="bg-basalt-50 rounded-card p-6">
                  {activeStage.items.map((item) => (
                    <SpecCard
                      key={item.id}
                      item={item}
                      isChecked={!!checkedItems[item.id]}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

        </EmailGate>
      </div>
    </div>
  )
}
