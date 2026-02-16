import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema } from '@/lib/structured-data'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Before You Sign — Contractor Agreement Toolkit for Hawaiʻi',
  description:
    'Three free tools in one: compare quotes, assign who handles what, and agree on the details that cause fights later. Built for Hawaiʻi homeowners.',
}

const SECTIONS = [
  {
    title: 'Compare Your Quotes',
    description:
      'Surface the gaps, exclusions, and assumptions across bids so you\u2019re comparing the same project\u2014not just the bottom-line price.',
    href: '/tools/fair-bid-checklist',
    guide: '/resources/playbooks/fair-bid-checklist',
  },
  {
    title: 'Who Handles What',
    description:
      'Assign who owns the easy-to-miss tasks\u2014permits, deliveries, punch list, warranties\u2014so nothing gets assumed.',
    href: '/tools/responsibility-matrix',
    guide: '/resources/playbooks/responsibility-matrix',
  },
  {
    title: 'Key Agreements',
    description:
      'Four conversations you should have before signing: change orders, payments, allowances, and communication.',
    href: null,
  },
]

export default async function BeforeYouSignLandingPage() {
  const session = await auth()
  if (session?.user) redirect('/app/tools/before-you-sign')

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Before You Sign', href: '/tools/before-you-sign' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Before You Sign
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Three tools in one: compare quotes, assign who handles what, and
              agree on the details that cause fights later.
            </p>
            <p className="text-cream/50 text-sm mb-10">
              Free to use. Sign in to save your progress across devices.
            </p>
          </FadeInSection>

          <div className="space-y-6 mb-12">
            {SECTIONS.map((section, index) => (
              <FadeInSection key={section.title} delay={index * 80}>
                <div className="bg-basalt-50 rounded-card p-6">
                  <h2 className="font-serif text-xl text-sandstone mb-2">
                    {section.title}
                  </h2>
                  <p className="text-cream/70 text-sm leading-relaxed mb-4">
                    {section.description}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {section.href && (
                      <Link
                        href={section.href}
                        className="text-sandstone text-sm hover:text-sandstone-light transition-colors"
                      >
                        Try it now &rarr;
                      </Link>
                    )}
                    {section.guide && (
                      <Link
                        href={section.guide}
                        className="text-cream/50 text-sm hover:text-cream/70 transition-colors"
                      >
                        Read the guide
                      </Link>
                    )}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={300}>
            <div className="bg-basalt-50 rounded-card p-8 text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Save your progress
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to save everything across devices. All three tools are
                combined on one page in your account.
              </p>
              <Link href="/login?callbackUrl=/app/tools/before-you-sign">
                <Button size="lg">
                  Sign in to save your progress &mdash; Free
                </Button>
              </Link>
              <p className="text-cream/40 text-xs mt-3">
                Google sign-in. No credit card required.
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
