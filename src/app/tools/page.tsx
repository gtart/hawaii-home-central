import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { breadcrumbSchema } from '@/lib/structured-data'
import { auth } from '@/auth'
import { ToolPreviewCards } from './ToolPreviewCards'

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Track fix items, save selections, and keep a record of plan changes during your Hawaiʻi renovation. Free tools, currently in limited beta.',
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
              Track what needs fixing, save your selections, and keep a clear record of changes.
            </p>
            <p className="text-cream/70 text-sm mb-2 max-w-2xl mx-auto text-center leading-relaxed">
              Start with the tool that matches where you are right now.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              Free to use. Currently in limited beta &mdash; request access to get started.
            </p>
          </FadeInSection>

          <ToolPreviewCards />

          {/* Trust messaging */}
          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 text-center mb-12">
              <p className="text-cream/60 text-sm">
                Free to use. Google sign-in once approved.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="mt-8 text-center space-y-3">
              <p className="text-cream/50 text-sm">
                New to renovating? Read{' '}
                <Link href="/resources/renovation-stages" className="text-sandstone hover:text-sandstone-light transition-colors" data-umami-event="tools-plan-renovation-link">
                  Plan Your Renovation &rarr;
                </Link>
              </p>
              <p className="text-cream/50 text-sm">
                Looking for in-depth guides?{' '}
                <Link href="/hawaii-home-renovation" className="text-sandstone hover:text-sandstone-light transition-colors" data-umami-event="tools-renovation-guides-link">
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
