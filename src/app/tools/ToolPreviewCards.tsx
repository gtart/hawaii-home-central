'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { FadeInSection } from '@/components/effects/FadeInSection'

interface ToolCard {
  title: string
  description: string
  ctaHref: string
  steps: string[]
  features: string[]
}

/* ── Core tools (priority order: Fix List → Selections → Plan & Changes) ── */

const CORE_TOOLS: ToolCard[] = [
  {
    title: 'Fix List',
    description:
      'Keep a running list of fix items and walkthrough notes so nothing slips through the cracks.',
    ctaHref: '/login?callbackUrl=/app/tools/punchlist',
    steps: [
      'Add items as you notice them during the build',
      'Assign status, priority, and photos to each item',
      'Share a PDF report with your contractor',
    ],
    features: [
      'Photo uploads with each item',
      'Status tracking (Open → In Progress → Done)',
      'Shareable PDF report for walkthroughs',
    ],
  },
  {
    title: 'Selections',
    description:
      'Save renovation decisions by room — links, notes, and final picks — so nothing gets lost in texts and emails.',
    ctaHref: '/login?callbackUrl=/app/tools/finish-decisions',
    steps: [
      'Pick your rooms (kitchen, bathroom, etc.)',
      'Track decisions by room — countertops, cabinets, flooring, and more',
      'Compare options, add notes and links, mark progress',
    ],
    features: [
      'Collapsible room sections with decision counts',
      'Status badges (Deciding → Shortlist → Selected → Done)',
      'An option editor where you save links, notes, and your final pick',
    ],
  },
  {
    title: 'Plan & Changes',
    description:
      'Track your scope of work, plan changes, and cost impacts so you have a clear record of what was agreed on.',
    ctaHref: '/login?callbackUrl=/app/tools/project-summary',
    steps: [
      'Add your scope of work and budget baseline',
      'Log changes as they come up during the build',
      'Track cost impacts and approvals in one place',
    ],
    features: [
      'Scope of work with inline amendments',
      'Change log with status tracking and cost impact',
      'File attachments and notes on each change',
    ],
  },
]

/* ── Secondary tools (planning stage) ── */

const SECONDARY_TOOLS: ToolCard[] = [
  {
    title: 'Mood Boards',
    description:
      'Save inspiration and product ideas before you narrow down your selections.',
    ctaHref: '/login?callbackUrl=/app/tools/mood-boards',
    steps: [
      'Save ideas from any website or paste a link',
      'Organize into boards — by room, style, or however you like',
      'Turn favorites into selections when you\u2019re ready',
    ],
    features: [
      'Visual boards with images and source links',
      'One-click save from any product or inspiration page',
      'Convert ideas to Selections when you\u2019re ready to decide',
    ],
  },
  {
    title: 'Bid Checklist',
    description:
      'Use the same checklist for each bid to spot gaps, allowances, and unclear scope before you sign.',
    ctaHref: '/login?callbackUrl=/app/tools/before-you-sign',
    steps: [
      'Add your contractors\u2019 names and quotes',
      'Compare line items side by side — scope, costs, who handles what',
      'Agree on details before signing',
    ],
    features: [
      'Contractor tabs for easy switching between bids',
      'Comparison checklist with Yes / No / TBD per line item',
      'Notes tab for each contractor to track conversations',
    ],
  },
]

function ToolCardComponent({ tool, index }: { tool: ToolCard; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const slug = tool.title.toLowerCase().replace(/\s+/g, '-')

  return (
    <FadeInSection delay={index * 60}>
      <div className="bg-basalt-50 rounded-card p-5">
        <h2 className="font-serif text-lg text-sandstone mb-2">
          {tool.title}
        </h2>
        <p className="text-cream/70 text-sm leading-relaxed mb-4">
          {tool.description}
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex gap-3">
            <Link href="/waitlist" className="flex-1">
              <Button variant="primary" size="md" className="w-full" data-umami-event={`tool-request-access-${slug}`}>
                Request Early Access
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              data-umami-event={`tool-preview-${slug}`}
              className={cn(
                'flex-1 py-2.5 rounded-button text-sm font-medium transition-colors border',
                isOpen
                  ? 'border-sandstone/30 bg-sandstone/10 text-sandstone'
                  : 'border-cream/15 text-cream/60 hover:text-cream/80 hover:border-cream/25'
              )}
            >
              {isOpen ? 'Close' : 'Preview'}
            </button>
          </div>
          <Link
            href={tool.ctaHref}
            className="block text-center text-xs text-cream/40 hover:text-cream/60 transition-colors pt-1"
            data-umami-event={`tool-sign-in-${slug}`}
          >
            Have access? Sign in &rarr;
          </Link>
        </div>

        {/* Preview panel */}
        {isOpen && (
          <div className="border-t border-cream/10 pt-4 mt-3 animate-fade-in">
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

            <div className="space-y-2">
              <Link href="/waitlist">
                <Button variant="primary" size="sm" className="w-full" data-umami-event={`tool-preview-request-access-${slug}`}>
                  Request Early Access
                </Button>
              </Link>
              <Link
                href={tool.ctaHref}
                className="block text-center text-xs text-cream/40 hover:text-cream/60 transition-colors pt-1"
                data-umami-event={`tool-preview-sign-in-${slug}`}
              >
                Have access? Sign in &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </FadeInSection>
  )
}

export function ToolPreviewCards() {
  return (
    <div className="mb-12">
      {/* Core tools */}
      <div className="space-y-3 mb-10">
        {CORE_TOOLS.map((tool, index) => (
          <ToolCardComponent key={tool.title} tool={tool} index={index} />
        ))}
      </div>

      {/* Secondary tools */}
      <FadeInSection delay={200}>
        <h3 className="text-sm text-cream/40 uppercase tracking-wide mb-4 text-center">
          Planning &amp; Prep
        </h3>
      </FadeInSection>
      <div className="space-y-3">
        {SECONDARY_TOOLS.map((tool, index) => (
          <ToolCardComponent key={tool.title} tool={tool} index={index + CORE_TOOLS.length} />
        ))}
      </div>
    </div>
  )
}
