import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema } from '@/lib/structured-data'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'My Tools — Interactive Renovation Workspace',
  description:
    'Sign in to access your renovation tools: compare contractor bids, track finish decisions, assign task ownership. Built for Hawaiʻi homeowners.',
}

const TOOLS = [
  {
    title: 'Contract Comparison Tool',
    description:
      'Compare quotes apples-to-apples, assign who handles what, and agree on the details that cause fights later.',
    ctaText: 'Sign in to get started',
    ctaHref: '/login?callbackUrl=/app/tools/before-you-sign',
  },
  {
    title: 'Decision Tracker',
    description:
      'Track every material and finish decision by room. Compare options, record details, and mark progress from deciding to done.',
    ctaText: 'Sign in to get started',
    ctaHref: '/login?callbackUrl=/app/tools/finish-decisions',
  },
]

export default async function ToolsMarketingPage() {
  const session = await auth()

  // Authenticated users → workspace
  if (session?.user) {
    redirect('/app')
  }

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'My Tools', href: '/tools' },
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
              My Tools
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Sign in to access your interactive renovation workspace.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              Built for Hawaiʻi homeowners. Free to use.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {TOOLS.map((tool, index) => (
              <FadeInSection key={tool.title} delay={index * 100}>
                <div className="bg-basalt-50 rounded-card p-6 h-full flex flex-col">
                  <h2 className="font-serif text-xl text-sandstone mb-3">
                    {tool.title}
                  </h2>
                  <p className="text-cream/70 text-sm leading-relaxed mb-4 flex-grow">
                    {tool.description}
                  </p>
                  <Link href={tool.ctaHref}>
                    <Button variant="secondary" size="md" className="w-full">
                      {tool.ctaText}
                    </Button>
                  </Link>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Trust messaging */}
          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 text-center mb-12">
              <p className="text-cream/60 text-sm mb-3">
                Free to use. Google sign-in. No credit card required.
              </p>
              <p className="text-cream/50 text-xs">
                Your data stays private and is never shared with contractors or third parties.
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
