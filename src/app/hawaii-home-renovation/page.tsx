import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { RenovationBasicsList } from '@/components/content/RenovationBasicsList'
import { RealityCheck } from '@/components/content/RealityCheck'
import { ContentsTOC } from '@/components/content/ContentsTOC'

export const metadata: Metadata = {
  title: 'Renovation Basics | Hawaii Home Central',
  description:
    'Practical guides, checklists, and articles for Hawaiʻi homeowners. Plan your renovation, compare bids, and learn the fundamentals—built for local conditions.',
}

const START_HERE_GUIDES = [
  {
    href: '/resources/renovation-stages',
    title: 'Plan Your Renovation',
    description:
      'A stage-by-stage walkthrough of every renovation phase\u2014from planning and contracts to closeout.',
    label: 'Start here',
  },
  {
    href: '/resources/playbooks/fair-bid-checklist',
    title: 'Apples-to-Apples Bid Checklist',
    description:
      'What to look for in every contractor bid. 11 sections, 44 items, with essentials flagged.',
    label: 'Checklist',
  },
  {
    href: '/resources/playbooks/responsibility-matrix',
    title: 'Who Handles What',
    description:
      'The 16 tasks that get dropped between homeowner, contractor, and subs.',
    label: 'Responsibilities',
  },
]

export default async function RenovationBasicsPage() {
  const [guides, allTags] = await Promise.all([
    prisma.content.findMany({
      where: { contentType: 'GUIDE', status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        dek: true,
        geoScope: true,
        tags: {
          select: { tagId: true },
        },
      },
    }),
    prisma.$queryRaw<{ id: string; name: string; slug: string; isPrimary: boolean }[]>`
      SELECT id, name, slug, "isPrimary" FROM "Tag" ORDER BY name ASC
    `,
  ])

  const allPrimaryTags = allTags
    .filter((t) => t.isPrimary)
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug }))

  const allPrimaryTagIds = new Set(allPrimaryTags.map((t) => t.id))

  const articles = guides.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    dek: g.dek,
    geoScope: g.geoScope,
    primaryTagIds: g.tags
      .filter((t) => allPrimaryTagIds.has(t.tagId))
      .map((t) => t.tagId),
  }))

  // Only show pills for tags that actually have published articles
  const usedPrimaryTagIds = new Set(articles.flatMap((a) => a.primaryTagIds))
  const primaryTags = allPrimaryTags.filter((t) => usedPrimaryTagIds.has(t.id))

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto lg:grid lg:grid-cols-[1fr_180px] lg:gap-10">
        {/* Main content column */}
        <div className="min-w-0">
          {/* Hero */}
          <FadeInSection>
            <div className="mb-12">
              <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
                Renovation Basics
              </h1>
              <p className="text-cream/70 text-lg max-w-2xl">
                Practical guides to help you navigate your Hawai&#x02BB;i
                renovation with clarity and confidence. Built from real
                experience, not theory.
              </p>
            </div>
          </FadeInSection>

          {/* Start Here */}
          <FadeInSection delay={50}>
            <section id="start-here" className="mb-12 scroll-mt-24">
              <h2 className="font-serif text-2xl text-cream mb-6">
                Start Here
              </h2>
              <div className="space-y-3">
                {START_HERE_GUIDES.map((guide, i) => (
                  <Link
                    key={guide.href}
                    href={guide.href}
                    className="block bg-basalt-50 rounded-card p-5 card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sandstone focus-visible:ring-offset-2 focus-visible:ring-offset-basalt"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h3 className="font-serif text-lg text-sandstone">
                            {guide.title}
                          </h3>
                          {i === 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-sandstone/15 text-sandstone">
                              {guide.label}
                            </span>
                          )}
                        </div>
                        <p className="text-cream/60 text-sm leading-relaxed">
                          {guide.description}
                        </p>
                      </div>
                      {i !== 0 && (
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-cream/40 mt-1">
                          {guide.label}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </FadeInSection>

          {/* Reality Check */}
          <FadeInSection delay={80}>
            <section id="reality-check" className="mb-12 scroll-mt-24">
              <RealityCheck />
            </section>
          </FadeInSection>

          {/* Library */}
          <FadeInSection delay={110}>
            <section id="library" className="scroll-mt-24">
              <h2 className="font-serif text-2xl text-cream mb-6">
                Library
              </h2>
              <RenovationBasicsList
                articles={articles}
                primaryTags={primaryTags}
              />
            </section>
          </FadeInSection>
        </div>

        {/* Desktop TOC — sticky right column */}
        <aside className="hidden lg:block">
          <ContentsTOC primaryTags={primaryTags} />
        </aside>
      </div>

      {/* Mobile TOC — fixed button */}
      <div className="lg:hidden">
        <ContentsTOC primaryTags={primaryTags} mobile />
      </div>
    </div>
  )
}
