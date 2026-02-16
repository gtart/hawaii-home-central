'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { RenovationStage } from '@/data/renovation-stages'

interface RenovationStagesFlowchartProps {
  stages: RenovationStage[]
}

export function RenovationStagesFlowchart({ stages }: RenovationStagesFlowchartProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const expandedStage = stages.find((s) => s.id === expandedId)

  return (
    <div>
      {/* Desktop: horizontal flowchart */}
      <div className="hidden md:block">
        <div className="flex items-start">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-start flex-1">
              <button
                onClick={() => toggle(stage.id)}
                className="flex flex-col items-center text-center group w-full"
                aria-expanded={expandedId === stage.id}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    expandedId === stage.id
                      ? 'bg-sandstone text-basalt'
                      : 'border border-cream/20 text-cream/40 group-hover:border-sandstone/50 group-hover:text-sandstone/70'
                  )}
                >
                  {stage.number}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 leading-tight transition-colors max-w-[90px]',
                    expandedId === stage.id
                      ? 'text-sandstone font-medium'
                      : 'text-cream/50 group-hover:text-cream/70'
                  )}
                >
                  {stage.title}
                </span>
              </button>
              {index < stages.length - 1 && (
                <div className="flex items-center mt-5 mx-0.5 shrink-0">
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="text-cream/15">
                    <path d="M0 5h12M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical stacked stages */}
      <div className="md:hidden flex flex-col gap-1">
        {stages.map((stage) => (
          <div key={stage.id}>
            <button
              onClick={() => toggle(stage.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left w-full',
                expandedId === stage.id && 'bg-cream/5'
              )}
              aria-expanded={expandedId === stage.id}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors',
                  expandedId === stage.id
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
                    expandedId === stage.id
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
                  expandedId === stage.id && 'rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Mobile expanded content inline */}
            {expandedId === stage.id && (
              <StageDetail stage={stage} />
            )}
          </div>
        ))}
      </div>

      {/* Desktop expanded detail panel */}
      {expandedStage && (
        <div className="hidden md:block mt-6">
          <StageDetail stage={expandedStage} />
        </div>
      )}
    </div>
  )
}

function StageDetail({ stage }: { stage: RenovationStage }) {
  return (
    <div className="bg-basalt-50 rounded-card p-6 space-y-5 animate-fade-in">
      <div>
        <h3 className="font-serif text-xl text-sandstone mb-1">
          {stage.number}. {stage.title}
        </h3>
        <p className="text-cream/40 text-sm">{stage.subtitle}</p>
      </div>

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
  )
}
