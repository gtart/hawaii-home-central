'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmailGate } from '@/components/forms/EmailGate'
import { ResponsibilityRow } from '@/components/resources/ResponsibilityRow'
import {
  RESPONSIBILITY_ITEMS,
  STAGES,
  type OwnerOption,
  type ResponsibilityStage,
} from '@/data/responsibility-matrix'

const STORAGE_KEY = 'hhc_responsibility_matrix_v1'

interface PerRowState {
  selectedOwner: OwnerOption | ''
  notes: string
}

function useResponsibilityMatrixState() {
  const [rowStates, setRowStates] = useState<Record<string, PerRowState>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRowStates(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  const setOwner = useCallback((id: string, owner: OwnerOption | '') => {
    setRowStates((prev) => {
      const next = {
        ...prev,
        [id]: { selectedOwner: owner, notes: prev[id]?.notes ?? '' },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setNotes = useCallback((id: string, notes: string) => {
    setRowStates((prev) => {
      const next = {
        ...prev,
        [id]: { notes, selectedOwner: prev[id]?.selectedOwner ?? '' },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    setRowStates({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { rowStates, setOwner, setNotes, resetAll, isLoaded }
}

function PreviewContent() {
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
        Responsibility Matrix
      </h1>
      <p className="text-cream/70 text-lg mb-4 leading-relaxed">
        Clarify who owns the most commonly-missed responsibilities before work
        starts&mdash;so nothing gets lost, assumed, or forgotten.
      </p>
      <p className="text-cream/60 text-sm mb-8 leading-relaxed">
        This isn&apos;t a contract. It&apos;s a clarity baseline. Use it to
        confirm who will purchase, coordinate, store, install, permit, and
        warranty key items on your project.
      </p>

      <div className="bg-basalt-50 rounded-card p-6">
        <h2 className="font-serif text-xl text-cream mb-3">
          What&apos;s inside
        </h2>
        <ul className="text-cream/60 space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>
              12 commonly-missed responsibilities across all project stages
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>
              Owner assignment with guidance on who typically handles each item
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>
              Expandable detail: what ownership includes, clarifying questions,
              and common mismatches
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>
              Notes field for documenting your specific agreements
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

type StageFilter = ResponsibilityStage | 'All'

export function PlaybookContent() {
  const { rowStates, setOwner, setNotes, resetAll, isLoaded } =
    useResponsibilityMatrixState()
  const [activeStage, setActiveStage] = useState<StageFilter>('All')

  const filteredItems =
    activeStage === 'All'
      ? RESPONSIBILITY_ITEMS
      : RESPONSIBILITY_ITEMS.filter((item) => item.stage === activeStage)

  const hasAnySelection = Object.values(rowStates).some(
    (state) => state.selectedOwner || state.notes
  )

  const stageFilters: StageFilter[] = ['All', ...STAGES]

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <EmailGate previewContent={<PreviewContent />}>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-2">
            Responsibility Matrix
          </h1>
          <p className="text-cream/70 text-lg mb-4 leading-relaxed">
            Clarify who owns the most commonly-missed responsibilities before
            work starts&mdash;so nothing gets lost, assumed, or forgotten.
          </p>
          <p className="text-cream/60 text-sm mb-8 leading-relaxed">
            This isn&apos;t a contract. It&apos;s a clarity baseline. Use it to
            confirm who will purchase, coordinate, store, install, permit, and
            warranty key items on your project.
          </p>

          <div className="bg-basalt-50 rounded-card p-6 mb-8">
            <h2 className="font-serif text-xl text-sandstone mb-3">
              How to use this matrix
            </h2>
            <p className="text-cream/70 text-sm leading-relaxed mb-3">
              Review each item and assign the responsible party for your
              project. The &ldquo;Often&rdquo; label shows who typically handles
              it, but every project is different.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed italic">
              Your selections and notes are saved locally in your browser.
            </p>
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

              {hasAnySelection && (
                <div className="flex justify-end mb-4">
                  <Button variant="ghost" size="sm" onClick={resetAll}>
                    Reset all
                  </Button>
                </div>
              )}

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
        </EmailGate>
      </div>
    </div>
  )
}
