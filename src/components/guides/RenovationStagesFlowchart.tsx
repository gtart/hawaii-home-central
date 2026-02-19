'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { RenovationStage } from '@/data/renovation-stages'

interface RenovationStagesFlowchartProps {
  stages: RenovationStage[]
}

export function RenovationStagesFlowchart({ stages }: RenovationStagesFlowchartProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialIndex = (() => {
    const param = searchParams.get('stage')
    if (param) {
      const n = parseInt(param, 10)
      if (n >= 1 && n <= stages.length) return n - 1
    }
    return 0
  })()

  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null)

  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const stageButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const activeStage = stages[activeIndex]

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

  const goToStageWithFocus = useCallback(
    (index: number) => {
      goToStage(index)
      requestAnimationFrame(() => {
        stageButtonRefs.current[index]?.focus()
      })
    },
    [goToStage]
  )

  useEffect(() => {
    const param = searchParams.get('stage')
    if (param) {
      const n = parseInt(param, 10)
      if (n >= 1 && n <= stages.length) {
        setActiveIndex(n - 1)
      }
    }
  }, [searchParams, stages.length])

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          goToStageWithFocus(Math.min(activeIndex + 1, stages.length - 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToStageWithFocus(Math.max(activeIndex - 1, 0))
          break
        case 'Home':
          e.preventDefault()
          goToStageWithFocus(0)
          break
        case 'End':
          e.preventDefault()
          goToStageWithFocus(stages.length - 1)
          break
      }
    },
    [activeIndex, goToStageWithFocus, stages.length]
  )

  const mobileToggle = (id: string) => {
    setMobileExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      {/* ───── Desktop ───── */}
      <div
        ref={containerRef}
        className="hidden md:block"
        role="tablist"
        aria-label="Renovation stages"
      >
        {/* Prev / Next — above stepper for tight stepper→card connection */}
        <div className="flex items-center justify-between mb-4">
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

        {/* Stepper with progress connector */}
        <div className="relative mb-5">
          {/* Background connector line — centered on inactive circles (32px / 2 = 16px = top-4) */}
          <div className="absolute top-4 left-0 right-0 h-px bg-cream/10" aria-hidden="true" />
          <div
            className="absolute top-4 left-0 h-px bg-sandstone/40 transition-all duration-500 ease-out"
            style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
            aria-hidden="true"
          />

          <div className="relative flex items-start">
            {stages.map((stage, index) => {
              const isActive = index === activeIndex
              const isPast = index < activeIndex

              const showChevronAfter = index === 5 || index === 6

              return (
                <Fragment key={stage.id}>
                <div className="flex-1">
                  <button
                    ref={(el) => { stageButtonRefs.current[index] = el }}
                    onClick={() => goToStage(index)}
                    onKeyDown={handleKeyDown}
                    className="flex flex-col items-center text-center group w-full outline-none focus:outline-none ring-0"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`stage-panel-${stage.id}`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {/* Step circle — active is larger */}
                    <div className="relative">
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-full bg-sandstone/20 animate-stage-halo"
                          style={{ margin: '-5px' }}
                          aria-hidden="true"
                        />
                      )}
                      <div
                        className={cn(
                          'relative rounded-full flex items-center justify-center font-medium transition-all duration-300',
                          isActive
                            ? 'w-12 h-12 text-base font-semibold bg-sandstone text-basalt'
                            : isPast
                              ? 'w-8 h-8 text-xs bg-sandstone/30 text-basalt border border-sandstone/40'
                              : 'w-8 h-8 text-xs border border-cream/20 text-cream/40 group-hover:border-sandstone/50 group-hover:text-sandstone/70'
                        )}
                      >
                        {stage.number}
                      </div>
                    </div>

                    {/* Label — active is larger */}
                    <span
                      className={cn(
                        'mt-2 leading-snug transition-all duration-300 max-w-[130px] line-clamp-2',
                        isActive
                          ? 'text-sm font-medium text-sandstone'
                          : isPast
                            ? 'text-xs text-cream/60'
                            : 'text-xs text-cream/50 group-hover:text-cream/70'
                      )}
                    >
                      {stage.title}
                    </span>
                  </button>
                </div>
                {showChevronAfter && (
                  <div className="flex-none flex items-start justify-center w-4 pt-[10px]" aria-hidden="true">
                    <svg className="w-3 h-3 text-sandstone/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                </Fragment>
              )
            })}
          </div>
        </div>

        {/* Desktop preview card — directly below stepper, no gap */}
        <div
          id={`stage-panel-${activeStage.id}`}
          role="tabpanel"
          aria-labelledby={`stage-tab-${activeStage.id}`}
        >
          <StagePreviewCard stage={activeStage} key={activeStage.id} />
        </div>
      </div>

      {/* ───── Mobile: vertical accordion ───── */}
      <div className="md:hidden flex flex-col gap-1">
        {stages.map((stage) => {
          const isExpanded = mobileExpandedId === stage.id

          return (
            <div key={stage.id} ref={(el) => { stageRefs.current[stage.id] = el }}>
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
                      isExpanded ? 'text-sandstone font-medium' : 'text-cream/60'
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

              {isExpanded && (
                <div className="border-l-2 border-sandstone/20 ml-[22px] pl-4 pb-2">
                  <StagePreviewCard stage={stage} />
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
   Preview Card: 1-sentence + details toggle
   ────────────────────────────────────────────── */

function StagePreviewCard({ stage }: { stage: RenovationStage }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="bg-basalt-50 rounded-card p-6 space-y-4 animate-stage-enter">
      <div>
        <h3 className="font-serif text-base font-medium text-sandstone mb-0.5">
          {stage.number}. {stage.title}
        </h3>
        <p className="text-cream/40 text-xs">{stage.subtitle}</p>
      </div>

      <p className="text-sm text-cream/70 leading-relaxed">
        {stage.previewLine}
      </p>

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
        {detailsOpen ? 'Hide checklist & details' : 'Open checklist & details'}
      </button>

      {detailsOpen && (
        <div className="space-y-5 pt-2 border-t border-cream/8 animate-fade-in">
          <p className="text-cream/70 text-sm leading-relaxed">
            {stage.whatHappens}
          </p>

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
