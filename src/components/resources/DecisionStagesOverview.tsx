'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ReadOnlyDecisionItem } from '@/components/resources/ReadOnlyDecisionItem'
import type { DecisionPointStageData } from '@/data/decision-points'

export function DecisionStagesOverview({
  stages,
}: {
  stages: DecisionPointStageData[]
}) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    () => new Set([stages[0]?.id])
  )

  const toggleStage = (id: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div>
      {/* Stage pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {stages.map((stage) => {
          const isExpanded = expandedStages.has(stage.id)
          return (
            <button
              key={stage.id}
              onClick={() => toggleStage(stage.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                isExpanded
                  ? 'bg-sandstone/20 text-sandstone border border-sandstone/40'
                  : 'bg-basalt-50 text-cream/60 border border-cream/15 hover:border-cream/30 hover:text-cream/80'
              }`}
            >
              {stage.title}
              <span className="ml-1.5 text-xs opacity-60">
                {stage.items.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Stage content */}
      <div className="space-y-8">
        {stages.map((stage) => {
          if (!expandedStages.has(stage.id)) return null

          return (
            <section key={stage.id}>
              <h2 className="font-serif text-2xl text-cream mb-1">
                {stage.title}
              </h2>
              <p className="text-cream/50 text-sm mb-5">{stage.subtitle}</p>

              <div className="space-y-4">
                {stage.items.map((item) => (
                  <ReadOnlyDecisionItem key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* CTA */}
      <div className="bg-basalt-50 rounded-card p-8 mt-10 text-center">
        <h2 className="font-serif text-2xl text-cream mb-3">
          Personalize this for your home
        </h2>
        <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
          Decision Tracker lets you add your rooms, compare material options,
          track specs, and see everything organized by construction milestone.
        </p>
        <Link href="/tools/finish-decisions">
          <Button size="lg">
            Use Decision Tracker &mdash; Free
          </Button>
        </Link>
        <p className="text-cream/30 text-xs mt-3">
          Sign in with Google to save your progress.
        </p>
      </div>
    </div>
  )
}
