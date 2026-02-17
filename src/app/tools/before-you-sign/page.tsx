import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema } from '@/lib/structured-data'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Contract Comparison Tool — Compare Bids, Assign Tasks & Agree on Terms',
  description:
    'Three free tools in one: compare quotes apples-to-apples, assign who handles what, and agree on the details that cause fights later. Built for Hawaiʻi homeowners.',
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
]

const KEY_AGREEMENTS = [
  {
    name: 'Change Orders',
    detail:
      'How changes get priced, approved, and documented during the project.',
  },
  {
    name: 'Payment Schedule',
    detail: 'When payments are due and what triggers each one.',
  },
  {
    name: 'Allowances & Substitutions',
    detail:
      'What happens when your selection costs more\u2014or the item is unavailable.',
  },
  {
    name: 'Communication Plan',
    detail:
      'How updates, questions, and problems get communicated during construction.',
  },
]

export default async function BeforeYouSignLandingPage() {
  const session = await auth()
  if (session?.user) redirect('/app/tools/before-you-sign')

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Contract Comparison Tool', href: '/tools/before-you-sign' },
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
              Contract Comparison Tool
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Three tools in one: compare quotes, assign who handles what, and
              agree on the details that cause fights later.
            </p>
            <p className="text-cream/50 text-sm mb-10">
              Free to use. Sign in to save and track everything across devices.
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
                    <Link
                      href={section.href}
                      className="text-sandstone text-sm hover:text-sandstone-light transition-colors"
                    >
                      Try it now &rarr;
                    </Link>
                    <Link
                      href={section.guide}
                      className="text-cream/50 text-sm hover:text-cream/70 transition-colors"
                    >
                      Read the guide
                    </Link>
                  </div>
                </div>
              </FadeInSection>
            ))}

            {/* Key Agreements — inline preview */}
            <FadeInSection delay={160}>
              <div className="bg-basalt-50 rounded-card p-6">
                <h2 className="font-serif text-xl text-sandstone mb-2">
                  Key Agreements
                </h2>
                <p className="text-cream/70 text-sm leading-relaxed mb-4">
                  Four conversations to have before signing.
                </p>
                <ul className="space-y-3 mb-5">
                  {KEY_AGREEMENTS.map((item) => (
                    <li key={item.name} className="flex gap-3">
                      <span className="text-sandstone shrink-0 text-sm">&bull;</span>
                      <div>
                        <span className="text-cream/80 text-sm font-medium">
                          {item.name}
                        </span>
                        <span className="text-cream/50 text-sm">
                          {' \u2014 '}
                          {item.detail}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?callbackUrl=/app/tools/before-you-sign"
                  className="text-sandstone text-sm hover:text-sandstone-light transition-colors"
                >
                  Use in the Contract Comparison Tool (sign in to save) &rarr;
                </Link>
              </div>
            </FadeInSection>
          </div>

          <FadeInSection delay={300}>
            <div className="bg-basalt-50 rounded-card p-8 text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Get started
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to use all three tools together&mdash;compare bids, assign tasks, and track agreements&mdash;with everything saved to your account.
              </p>
              <Link href="/login?callbackUrl=/app/tools/before-you-sign">
                <Button size="lg">
                  Sign in to get started &mdash; Free
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
