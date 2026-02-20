'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ShareButton } from '@/components/resources/ShareButton'
import { ResponsibilityRow } from '@/components/resources/ResponsibilityRow'
import {
  RESPONSIBILITY_ITEMS,
  STAGES,
  type OwnerOption,
  type ResponsibilityStage,
} from '@/data/responsibility-matrix'
import { useToolState } from '@/hooks/useToolState'

interface PerRowState {
  selectedOwner: OwnerOption | ''
  notes: string
}

type StageFilter = ResponsibilityStage | 'All'

export function ToolContent({ embedded }: { embedded?: boolean }) {
  const { state: rowStates, setState: setRowStates, isLoaded, isSyncing } =
    useToolState<Record<string, PerRowState>>({
      toolKey: 'responsibility_matrix',
      localStorageKey: 'hhc_responsibility_matrix_v1',
      defaultValue: {},
    })

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
    setRowStates(() => ({}))
  }

  const content = (
    <>
      {embedded ? (
        <>
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="font-serif text-2xl text-sandstone">
              Who Handles What
            </h2>
            {isSyncing && (
              <span className="text-xs text-cream/30">Saving...</span>
            )}
          </div>
          <p className="text-cream/70 text-sm mb-4 leading-relaxed">
            Prevent tasks from falling between trades&mdash;by making &lsquo;who does what&rsquo; clear before work starts.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
              Who Handles What
            </h1>
            <div className="shrink-0 mt-2 flex items-center gap-3">
              {isSyncing && (
                <span className="text-xs text-cream/30">Saving...</span>
              )}
              <ShareButton title="Who Handles What &mdash; Hawaii Home Central" />
            </div>
          </div>
          <p className="text-cream/70 text-lg mb-4 leading-relaxed">
            Prevent tasks from falling between trades&mdash;by making &lsquo;who does what&rsquo; clear before work starts.
          </p>
          <p className="text-cream/60 text-sm mb-8 leading-relaxed">
            Not a contract&mdash;just a clarity baseline to confirm handoffs.
          </p>
        </>
      )}

      <div className="bg-basalt-50 rounded-card p-6 mb-8">
        <h3 className="font-serif text-xl text-sandstone mb-3">
          How to use this
        </h3>
        <p className="text-cream/70 text-sm leading-relaxed mb-3">
          Review each item and assign the responsible party for your project.
          The &ldquo;Often&rdquo; label shows who typically handles it, but
          every project is different.
        </p>
        <p className="text-cream/60 text-sm leading-relaxed italic mb-4">
          Your selections and notes are saved to your account.
        </p>
        <details className="group">
          <summary className="text-sandstone text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-sandstone-light transition-colors">
            What do these roles mean?
          </summary>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-cream/70 font-medium inline">Homeowner</dt>
              <dd className="text-cream/50 inline">
                {' '}
                &mdash; You handle it directly
              </dd>
            </div>
            <div>
              <dt className="text-cream/70 font-medium inline">
                GC / Contractor
              </dt>
              <dd className="text-cream/50 inline">
                {' '}
                &mdash; Your general contractor or lead builder
              </dd>
            </div>
            <div>
              <dt className="text-cream/70 font-medium inline">
                Trade / Sub
              </dt>
              <dd className="text-cream/50 inline">
                {' '}
                &mdash; A specialized subcontractor (plumber, electrician,
                tiler)
              </dd>
            </div>
            <div>
              <dt className="text-cream/70 font-medium inline">
                Vendor / Supplier
              </dt>
              <dd className="text-cream/50 inline">
                {' '}
                &mdash; The store, dealer, or manufacturer
              </dd>
            </div>
            <div>
              <dt className="text-cream/70 font-medium inline">Shared</dt>
              <dd className="text-cream/50 inline">
                {' '}
                &mdash; Split between two or more parties (clarify the split)
              </dd>
            </div>
            <div>
              <dt className="text-cream/70 font-medium inline">
                Other / TBD
              </dt>
              <dd className="text-cream/50 inline">
                {' '}
                &mdash; Not yet decided
              </dd>
            </div>
          </dl>
        </details>
      </div>

      {isLoaded && (
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
      )}
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {content}
      </div>
    </div>
  )
}
