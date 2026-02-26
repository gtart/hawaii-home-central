'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { FadeInSection } from '@/components/effects/FadeInSection'

interface StageTool {
  title: string
  description: string
  ctaText: string
  ctaHref: string
  steps: string[]
  features: string[]
}

interface StageEntry {
  number: number
  title: string
  subtitle: string
  tool: StageTool | null
}

const STAGES: StageEntry[] = [
  {
    number: 2,
    title: 'Hire & Contract',
    subtitle: 'Compare bids and lock expectations.',
    tool: {
      title: 'Contract Checklist',
      description:
        'Walk through each bid against the same checklist\u2014so nothing gets missed and you sign with confidence.',
      ctaText: 'Sign in to get started',
      ctaHref: '/login?callbackUrl=/app/tools/before-you-sign',
      steps: [
        'Add your contractors\u2019 names and quotes',
        'Compare line items side by side \u2014 scope, costs, who handles what',
        'Agree on details before signing',
      ],
      features: [
        'Contractor pills for easy switching between bids',
        'A comparison checklist with Yes / No / TBD answers per line item',
        'A notes tab for each contractor to track conversations and details',
      ],
    },
  },
  {
    number: 4,
    title: 'Decide & Order',
    subtitle: 'Finalize selections and confirm lead times.',
    tool: {
      title: 'Selection Boards',
      description:
        'Always know what\u2019s decided, what\u2019s next, and what\u2019s blocking\u2014by organizing selections by room instead of texts and screenshots.',
      ctaText: 'Sign in to get started',
      ctaHref: '/login?callbackUrl=/app/tools/finish-decisions',
      steps: [
        'Pick your rooms (kitchen, bathroom, etc.)',
        'Track selections by room \u2014 countertops, cabinets, flooring, and more',
        'Compare options, add notes and links, mark progress',
      ],
      features: [
        'Collapsible room sections with selection counts',
        'Status badges (Deciding \u2192 Shortlist \u2192 Selected \u2192 Done)',
        'An option editor where you save links, notes, and your final pick',
      ],
    },
  },
  {
    number: 5,
    title: 'Build & Closeout',
    subtitle: 'Track issues as you go, then finish strong.',
    tool: {
      title: 'Fix List',
      description:
        'Track fixes and punch list items in real time\u2014and share a clean report with your contractor.',
      ctaText: 'Sign in to get started',
      ctaHref: '/login?callbackUrl=/app/tools/punchlist',
      steps: [
        'Add items as you notice them during the build',
        'Assign status, priority, and photos to each item',
        'Share a PDF report with your contractor',
      ],
      features: [
        'Photo uploads with each item',
        'Status tracking (Open \u2192 In Progress \u2192 Done)',
        'Shareable PDF report for walkthroughs',
      ],
    },
  },
]

export function ToolPreviewCards() {
  const [previewOpen, setPreviewOpen] = useState<string | null>(null)

  return (
    <div className="space-y-3 mb-12">
      {STAGES.map((stage, index) => {
        const isOpen = previewOpen === stage.tool?.title

        return (
          <FadeInSection key={stage.number} delay={index * 60}>
            <div className="flex gap-4">
              {/* Stage marker */}
              <div className="flex flex-col items-center shrink-0 pt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-sandstone text-basalt">
                  {stage.number}
                </div>
                {index < STAGES.length - 1 && (
                  <div className="w-px flex-1 bg-cream/10 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="mb-1">
                  <span className="text-sm font-medium text-cream/60">{stage.title}</span>
                  <span className="text-cream/20 mx-2">&middot;</span>
                  <span className="text-xs text-cream/30">{stage.subtitle}</span>
                </div>

                {stage.tool && (
                  <div className="bg-basalt-50 rounded-card p-5">
                    <h2 className="font-serif text-lg text-sandstone mb-2">
                      {stage.tool!.title}
                    </h2>
                    <p className="text-cream/70 text-sm leading-relaxed mb-4">
                      {stage.tool!.description}
                    </p>

                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 space-y-2">
                        <Link href="/waitlist">
                          <Button variant="primary" size="md" className="w-full">
                            Join the Waitlist
                          </Button>
                        </Link>
                        <Link
                          href={stage.tool!.ctaHref}
                          className="block text-center text-xs text-cream/40 hover:text-cream/60 transition-colors"
                        >
                          Already have access? Sign in
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewOpen(isOpen ? null : stage.tool!.title)
                        }
                        className={cn(
                          'px-3 py-2 rounded-button text-xs font-medium transition-colors shrink-0',
                          isOpen
                            ? 'bg-sandstone/20 text-sandstone'
                            : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                        )}
                      >
                        {isOpen ? 'Close' : 'Preview'}
                      </button>
                    </div>

                    {/* Preview panel */}
                    {isOpen && (
                      <div className="border-t border-cream/10 pt-4 mt-3 animate-fade-in">
                        <h3 className="text-xs text-cream/50 uppercase tracking-wide mb-3">
                          How it works
                        </h3>
                        <ol className="space-y-2 mb-5">
                          {stage.tool!.steps.map((step, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-cream/70">
                              <span className="text-sandstone/60 font-medium shrink-0">
                                {i + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>

                        <h3 className="text-xs text-cream/50 uppercase tracking-wide mb-3">
                          What you&apos;ll see
                        </h3>
                        <ul className="space-y-1.5 mb-5">
                          {stage.tool!.features.map((feature, i) => (
                            <li key={i} className="flex gap-2 text-sm text-cream/60">
                              <span className="text-sandstone/40 shrink-0">&bull;</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="space-y-2">
                          <Link href="/waitlist">
                            <Button variant="primary" size="sm" className="w-full">
                              Join the Waitlist
                            </Button>
                          </Link>
                          <Link
                            href={stage.tool!.ctaHref}
                            className="block text-center text-xs text-cream/40 hover:text-cream/60 transition-colors"
                          >
                            Already have access? Sign in
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </FadeInSection>
        )
      })}
    </div>
  )
}
