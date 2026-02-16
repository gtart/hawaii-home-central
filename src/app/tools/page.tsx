import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Card } from '@/components/ui/Card'
import { breadcrumbSchema } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Your Renovation Toolkit',
  description:
    'Free interactive toolkit for Hawai\u02BBi homeowners: bid comparison, task ownership, decision tracking, and more. Built for real renovation projects.',
}

const TOOLS = [
  {
    title: 'Before You Sign',
    description:
      'Compare quotes, assign who handles what, and agree on the details that cause fights later. Three tools in one.',
    href: '/tools/before-you-sign',
  },
  {
    title: 'Track Your Decisions',
    description:
      'Track every material and finish decision by room. Compare options, record specs, and mark progress from deciding to done.',
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
              Your Renovation Toolkit
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Planning help from start to finish&mdash;what homeowners wish they had before they started.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              Free to use. Sign in to save your progress across devices.
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

          <FadeInSection delay={300}>
            <div className="mt-16 text-center space-y-3">
              <p className="text-cream/50 text-sm">
                New to renovating? Start with the{' '}
                <Link href="/tools/decision-points" className="text-sandstone hover:text-sandstone-light transition-colors">
                  Decision Stages Overview &rarr;
                </Link>
              </p>
              <p className="text-cream/50 text-sm">
                Looking for in-depth guides?{' '}
                <Link href="/resources" className="text-sandstone hover:text-sandstone-light transition-colors">
                  Visit Guides
                </Link>
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
