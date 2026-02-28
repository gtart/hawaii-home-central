import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { breadcrumbSchema } from '@/lib/structured-data'
import { auth } from '@/auth'
import { HowItWorksStrip } from '@/components/home/HowItWorksStrip'
import { ToolPreviewCards } from './ToolPreviewCards'

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Homeowner tools for every stage of a Hawaiʻi renovation: contract checklist, finish decisions, and fix list. Request early access.',
}

export default async function ToolsMarketingPage() {
  const session = await auth()

  // Authenticated users → app
  if (session?.user) {
    redirect('/app')
  }

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
              Tools
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              One tool for each stage of your home project.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              Built for Hawai&#x02BB;i homeowners. Currently in early beta.
            </p>
          </FadeInSection>

          <div className="mb-8 -mx-6">
            <HowItWorksStrip />
          </div>

          <ToolPreviewCards />

          {/* Trust messaging */}
          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 text-center mb-12">
              <p className="text-cream/60 text-sm mb-3">
                Free during beta. Google sign-in. No credit card.
              </p>
              <p className="text-cream/50 text-xs">
                We&apos;re opening access in waves. Request early access to get invited.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="mt-8 text-center space-y-3">
              <p className="text-cream/50 text-sm">
                New to renovating? Read{' '}
                <Link href="/resources/renovation-stages" className="text-sandstone hover:text-sandstone-light transition-colors">
                  Plan Your Renovation &rarr;
                </Link>
              </p>
              <p className="text-cream/50 text-sm">
                Looking for in-depth guides?{' '}
                <Link href="/hawaii-home-renovation" className="text-sandstone hover:text-sandstone-light transition-colors">
                  Visit Renovation Guides
                </Link>
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
