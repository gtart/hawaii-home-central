'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { RenovationStage } from '@/data/renovation-stages'

interface RenovationStagesFlowchartProps {
  stages: RenovationStage[]
}

export function RenovationStagesFlowchart({ stages }: RenovationStagesFlowchartProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Phase 7: Initialize from query param, default to 0
  const initialIndex = (() => {
    const param = searchParams.get('stage')
    if (param) {
      const n = parseInt(param, 10)
      if (n >= 1 && n <= stages.length) return n - 1
    }
    return 0
  })()

  // Phase 2: activeIndex is never null on desktop (always one stage selected)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  // Mobile accordion: null means collapsed
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null)
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const [showKeyHint, setShowKeyHint] = useState(false)

  const activeStage = stages[activeIndex]

  // Phase 7: Update query param when stage changes
  const updateQueryParam = useCallback(
    (index: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('stage', String(index + 1))
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const goToStage = useCallback(
    (index: number) => {
      if (index < 0 || index >= stages.length) return
      setActiveIndex(index)
      updateQueryParam(index)
    },
    [stages.length, updateQueryParam]
  )

  // Phase 7: Handle browser back/forward
  useEffect(() => {
    const param = searchParams.get('stage')
    if (param) {
      const n = parseInt(param, 10)
      if (n >= 1 && n <= stages.length) {
        setActiveIndex(n - 1)
      }
    }
  }, [searchParams, stages.length])

  // Mobile: auto-scroll expanded stage into view
  useEffect(() => {
    if (!mobileExpandedId) return
    const el = stageRefs.current[mobileExpandedId]
    if (!el) return
    if (window.innerWidth >= 768) return
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
    return () => clearTimeout(timer)
  }, [mobileExpandedId])

  // Phase 3: Scoped keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          goToStage(Math.min(activeIndex + 1, stages.length - 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToStage(Math.max(activeIndex - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          goToStage(0)
          break
        case 'End':
          e.preventDefault()
          goToStage(stages.length - 1)
          break
      }
    },
    [activeIndex, goToStage, stages.length]
  )

  const mobileToggle = (id: string) => {
    setMobileExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      {/* ───── Desktop ───── */}
      <div
        ref={containerRef}
        className="hidden md:block focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowKeyHint(true)}
        onBlur={() => setShowKeyHint(false)}
        role="tablist"
        aria-label="Renovation stages"
      >
        {/* Phase 6: Stepper with progress connector */}
        <div className="relative">
          {/* Progress connector line */}
          <div className="absolute top-5 left-0 right-0 h-px bg-cream/10" aria-hidden="true" />
          <div
            className="absolute top-5 left-0 h-px bg-sandstone/40 transition-all duration-500 ease-out"
            style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
            aria-hidden="true"
          />

          <div className="relative flex items-start">
            {stages.map((stage, index) => {
              const isActive = index === activeIndex
              const isPast = index < activeIndex

              return (
                <div key={stage.id} className="flex items-start flex-1">
                  <button
                    onClick={() => goToStage(index)}
                    className="flex flex-col items-center text-center group w-full"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`stage-panel-${stage.id}`}
                  >
                    {/* Phase 6: Step circle with halo on active */}
                    <div className="relative">
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full bg-sandstone/20 animate-stage-halo"
                          style={{ margin: '-4px' }}
                          aria-hidden="true"
                        />
                      )}
                      <div
                        className={cn(
                          'relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300',
                          isActive
                            ? 'bg-sandstone text-basalt'
                            : isPast
                              ? 'bg-sandstone/30 text-basalt border border-sandstone/40'
                              : 'border border-cream/20 text-cream/40 group-hover:border-sandstone/50 group-hover:text-sandstone/70'
                        )}
                      >
                        {stage.number}
                      </div>
                    </div>

                    {/* Phase 5: Larger labels, wider, 2-line clamp */}
                    <span
                      className={cn(
                        'text-sm mt-2.5 leading-snug transition-colors max-w-[130px] line-clamp-2',
                        isActive
                          ? 'text-sandstone font-medium'
                          : isPast
                            ? 'text-cream/60'
                            : 'text-cream/50 group-hover:text-cream/70'
                      )}
                    >
                      {stage.title}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase 3: Keyboard hint */}
        {showKeyHint && (
          <p className="text-[11px] text-cream/25 text-center mt-3 select-none" aria-hidden="true">
            Tip: use &larr; &rarr; to navigate stages
          </p>
        )}

        {/* Phase 3: Prev / Next buttons */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <button
            type="button"
            onClick={() => goToStage(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors px-3 py-1.5 rounded-lg',
              activeIndex === 0
                ? 'text-cream/20 cursor-not-allowed'
                : 'text-cream/60 hover:text-cream hover:bg-cream/5'
            )}
            aria-label="Previous stage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Prev
          </button>

          <span className="text-xs text-cream/30">
            {activeIndex + 1} of {stages.length}
          </span>

          <button
            type="button"
            onClick={() => goToStage(activeIndex + 1)}
            disabled={activeIndex === stages.length - 1}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors px-3 py-1.5 rounded-lg',
              activeIndex === stages.length - 1
                ? 'text-cream/20 cursor-not-allowed'
                : 'text-cream/60 hover:text-cream hover:bg-cream/5'
            )}
            aria-label="Next stage"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Phase 4: Desktop stage card (compact + details) */}
        <div
          id={`stage-panel-${activeStage.id}`}
          role="tabpanel"
          aria-labelledby={`stage-tab-${activeStage.id}`}
        >
          <StageCard stage={activeStage} key={activeStage.id} />
        </div>
      </div>

      {/* ───── Mobile: vertical accordion ───── */}
      <div className="md:hidden flex flex-col gap-1">
        {stages.map((stage) => {
          const isExpanded = mobileExpandedId === stage.id

          return (
            <div
              key={stage.id}
              ref={(el) => { stageRefs.current[stage.id] = el }}
            >
              <button
                onClick={() => mobileToggle(stage.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left w-full',
                  isExpanded && 'bg-cream/5'
                )}
                aria-expanded={isExpanded}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors',
                    isExpanded
                      ? 'bg-sandstone text-basalt'
                      : 'border border-cream/20 text-cream/40'
                  )}
                >
                  {stage.number}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'text-sm transition-colors block',
                      isExpanded
                        ? 'text-sandstone font-medium'
                        : 'text-cream/60'
                    )}
                  >
                    {stage.title}
                  </span>
                  <span className="text-xs text-cream/30 block truncate">
                    {stage.subtitle}
                  </span>
                </div>
                <svg
                  className={cn(
                    'w-4 h-4 text-cream/30 shrink-0 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Mobile expanded content */}
              {isExpanded && (
                <div className="border-l-2 border-sandstone/20 ml-[22px] pl-4 pb-2">
                  <StageCard stage={stage} />
                  <button
                    type="button"
                    onClick={() => setMobileExpandedId(null)}
                    className="mt-4 text-xs text-cream/40 hover:text-cream/60 transition-colors"
                  >
                    Collapse &uarr;
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Phase 4: Compact-first stage card with Details
   ────────────────────────────────────────────── */

function StageCard({ stage }: { stage: RenovationStage }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="bg-basalt-50 rounded-card p-6 space-y-4 animate-stage-enter">
      {/* Header */}
      <div>
        <h3 className="font-serif text-xl text-sandstone mb-1">
          {stage.number}. {stage.title}
        </h3>
        <p className="text-cream/40 text-sm">{stage.subtitle}</p>
      </div>

      {/* Do this now */}
      <div>
        <h4 className="text-cream text-sm font-medium mb-1.5">Do this now</h4>
        <p className="text-cream/70 text-sm leading-relaxed">{stage.doThisNow}</p>
      </div>

      {/* Top decisions */}
      <div>
        <h4 className="text-cream text-sm font-medium mb-1.5">Top decisions</h4>
        <ul className="space-y-1.5">
          {stage.topDecisions.map((d, i) => (
            <li key={i} className="flex gap-2 text-sm text-cream/60">
              <span className="text-sandstone shrink-0">&rarr;</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Details toggle */}
      <button
        type="button"
        onClick={() => setDetailsOpen(!detailsOpen)}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium transition-colors',
          detailsOpen
            ? 'text-sandstone'
            : 'text-cream/40 hover:text-cream/60'
        )}
      >
        <svg
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200',
            detailsOpen && 'rotate-90'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {detailsOpen ? 'Hide details' : 'Details'}
      </button>

      {/* Expanded details */}
      {detailsOpen && (
        <div className="space-y-5 pt-2 border-t border-cream/8 animate-fade-in">
          {/* What happens */}
          <p className="text-cream/70 text-sm leading-relaxed">
            {stage.whatHappens}
          </p>

          {/* Full decisions list */}
          <div>
            <h4 className="text-cream text-sm font-medium mb-2">
              What you should decide
            </h4>
            <ul className="space-y-1.5">
              {stage.decisions.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-cream/60">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hawaiʻi considerations */}
          {stage.hawaiiNotes.length > 0 && (
            <div className="bg-sandstone/5 border border-sandstone/15 rounded-lg p-4">
              <h4 className="text-sandstone text-sm font-medium mb-2">
                Hawai&#x02BB;i considerations
              </h4>
              <ul className="space-y-1.5">
                {stage.hawaiiNotes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm text-cream/60">
                    <span className="text-sandstone/60 shrink-0">&bull;</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common pitfalls */}
          {stage.pitfalls.length > 0 && (
            <div>
              <h4 className="text-cream text-sm font-medium mb-2">
                Common pitfalls
              </h4>
              <ul className="space-y-1.5">
                {stage.pitfalls.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-cream/50">
                    <span className="text-cream/30 shrink-0">&times;</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
