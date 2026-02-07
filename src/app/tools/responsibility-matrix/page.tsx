import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Responsibility Matrix \u2014 Assign Who Owns Each Renovation Task',
  description:
    'Free interactive tool: assign ownership for 16 commonly-missed renovation responsibilities. Prevent handoff gaps between homeowner, contractor, and subs.',
}

const FAQ_ITEMS = [
  {
    question: 'What is a responsibility matrix for home renovation?',
    answer:
      'A responsibility matrix is a simple tool that assigns ownership for each task in a renovation project. It clarifies who handles what\u2014homeowner, general contractor, subcontractor, or vendor\u2014so nothing falls through the cracks between parties.',
  },
  {
    question: 'Why do renovation responsibilities get dropped between parties?',
    answer:
      'Most renovation disputes stem from assumptions, not bad intent. The homeowner assumes the GC handles permits; the GC assumes the homeowner ordered the fixtures. A responsibility matrix makes these assumptions explicit before work begins.',
  },
  {
    question: 'How is this different from a scope of work?',
    answer:
      'A scope of work describes what will be done. A responsibility matrix describes who does it. They\u2019re complementary\u2014the scope defines the tasks, and the matrix assigns them. This tool focuses on the 16 tasks most commonly left unassigned.',
  },
]

export default function ResponsibilityMatrixLandingPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Responsibility Matrix', href: '/tools/responsibility-matrix' },
  ])
  const faq = faqSchema(FAQ_ITEMS)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Responsibility Matrix
            </h1>
            <p className="text-lg text-cream/70 mb-8 leading-relaxed">
              Assign who owns the easy-to-miss tasks&mdash;so nothing gets assumed. Not a contract, just a clarity baseline to confirm handoffs before work begins.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                What this tool does
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed mb-3">
                The Responsibility Matrix covers 16 commonly-missed tasks across 5 project stages: Ordering, Rough-In, Close Walls, Waterproof/Tile, and Closeout. For each task, you assign an owner: Homeowner, GC/Contractor, Trade/Sub, Vendor/Supplier, Shared, or TBD.
              </p>
              <p className="text-cream/60 text-sm leading-relaxed">
                High-variance items&mdash;tasks where ownership varies significantly from project to project&mdash;are flagged so you know which ones need the most attention.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Key features
              </h2>
              <ul className="text-cream/60 space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>16 commonly-missed responsibilities across 5 project stages</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>6 owner options with &ldquo;Often&rdquo; guidance for typical projects</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>High-variance flags for tasks that vary most between projects</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Notes field for documenting specific agreements</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>&ldquo;Fill with typical&rdquo; to start from common defaults</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Progress saved to your account across devices</span>
                </li>
              </ul>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Frequently asked questions
              </h2>
              <div className="space-y-4">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-cream/80 text-sm font-medium mb-1">
                      {item.question}
                    </h3>
                    <p className="text-cream/50 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="text-center">
              <Link href="/login?callbackUrl=/app/tools/responsibility-matrix">
                <Button size="lg">
                  Sign in to use this tool &rarr;
                </Button>
              </Link>
              <p className="text-cream/40 text-xs mt-3">
                Free to use. Google sign-in. No spam.
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
