import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Card } from '@/components/ui/Card'
import { breadcrumbSchema } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Free Renovation Tools',
  description:
    'Free interactive tools for Hawai\u02BBi homeowners: decision-point checklists, bid comparison tools, and responsibility matrices. Built for real renovation projects.',
}

const TOOLS = [
  {
    title: 'Decision Points',
    description:
      'Track the spec decisions that must be locked before each construction stage. 5 stages, 24 items, with Hawai\u02BBi-specific callouts.',
    href: '/tools/decision-points',
  },
  {
    title: 'Fair Bid Checklist',
    description:
      'Compare contractor bids apples-to-apples. 11 sections covering scope, labor, materials, permits, and more.',
    href: '/tools/fair-bid-checklist',
  },
  {
    title: 'Responsibility Matrix',
    description:
      'Assign who owns 16 commonly-missed renovation tasks so nothing gets assumed or dropped between parties.',
    href: '/tools/responsibility-matrix',
  },
  {
    title: 'Selections Tracker',
    description:
      "Track finish and appliance selections by room. Compare options, record specs, mark what you've selected.",
    href: '/tools/finish-decisions',
  },
]

export default function ToolsIndexPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6 text-center">
              Renovation Tools
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Free, interactive tools built for Hawai&#x02BB;i homeowners tackling real renovation projects. Sign in to save your progress across devices.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              Each tool is designed to surface the gaps, assumptions, and missed handoffs that cause the most expensive renovation mistakes.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLS.map((tool, index) => (
              <FadeInSection key={tool.href} delay={index * 100}>
                <Card
                  href={tool.href}
                  title={tool.title}
                  description={tool.description}
                />
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={400}>
            <div className="mt-16 text-center">
              <p className="text-cream/50 text-sm">
                Looking for guides and deep-dive content?{' '}
                <Link href="/resources" className="text-sandstone hover:text-sandstone-light transition-colors">
                  Visit Resources
                </Link>
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
