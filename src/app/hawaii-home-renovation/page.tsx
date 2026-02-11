import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { RenovationBasicsList } from '@/components/content/RenovationBasicsList'

export const metadata: Metadata = {
  title: 'Hawaii Home Renovation Basics',
  description:
    'Learn the fundamentals of home renovation in Hawaiʻi — from permitting to materials to working with contractors. Free to read, no sign-in required.',
}

export default async function RenovationBasicsPage() {
  const [guides, primaryTags] = await Promise.all([
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
          where: { tag: { isPrimary: true } },
          select: { tagId: true },
        },
      },
    }),
    prisma.tag.findMany({
      where: { isPrimary: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ])

  const articles = guides.map((g) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    dek: g.dek,
    geoScope: g.geoScope,
    primaryTagIds: g.tags.map((t) => t.tagId),
  }))

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeInSection>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
            Renovation Basics
          </h1>
          <p className="text-cream/70 text-lg mb-10 max-w-2xl">
            Learn the fundamentals of home renovation in Hawai&#x02BB;i — from
            permitting to materials to working with contractors.
          </p>
        </FadeInSection>

        <FadeInSection delay={50}>
          <RenovationBasicsList
            articles={articles}
            primaryTags={primaryTags}
          />
        </FadeInSection>
      </div>
    </div>
  )
}
