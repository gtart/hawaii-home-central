'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { FadeInSection } from '@/components/effects/FadeInSection'

const TOOLS = [
  {
    title: 'Contract Comparison Tool',
    description:
      'Choose the right contractor with fewer surprises\u2014by normalizing each bid into the same checklist.',
    ctaText: 'Sign in to save your workspace',
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
  {
    title: 'Decision Tracker',
    description:
      'Always know what\u2019s decided, what\u2019s next, and what\u2019s blocking\u2014by organizing decisions by room instead of texts and screenshots.',
    ctaText: 'Sign in to save your workspace',
    ctaHref: '/login?callbackUrl=/app/tools/finish-decisions',
    steps: [
      'Pick your rooms (kitchen, bathroom, etc.)',
      'Track decisions by room \u2014 countertops, cabinets, flooring, and more',
      'Compare options, add notes and links, mark progress',
    ],
    features: [
      'Collapsible room sections with decision counts',
      'Decision cards with status badges (Deciding \u2192 Shortlist \u2192 Selected \u2192 Done)',
      'An option editor where you save links, notes, and your final pick',
    ],
  },
]

export function ToolPreviewCards() {
  const [previewOpen, setPreviewOpen] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {TOOLS.map((tool, index) => {
        const isOpen = previewOpen === tool.title

        return (
          <FadeInSection key={tool.title} delay={index * 100}>
            <div className="bg-basalt-50 rounded-card p-6 h-full flex flex-col">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                {tool.title}
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed mb-4 flex-grow">
                {tool.description}
              </p>

              <div className="flex items-center gap-3 mb-3">
                <Link href={tool.ctaHref} className="flex-1">
                  <Button variant="secondary" size="md" className="w-full">
                    {tool.ctaText}
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewOpen(isOpen ? null : tool.title)
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
                <div className="border-t border-cream/10 pt-4 mt-1 animate-fade-in">
                  <h3 className="text-xs text-cream/50 uppercase tracking-wide mb-3">
                    How it works
                  </h3>
                  <ol className="space-y-2 mb-5">
                    {tool.steps.map((step, i) => (
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
                    {tool.features.map((feature, i) => (
                      <li key={i} className="flex gap-2 text-sm text-cream/60">
                        <span className="text-sandstone/40 shrink-0">&bull;</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={tool.ctaHref}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Sign in to save progress and share
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </FadeInSection>
        )
      })}
    </div>
  )
}
