import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { StorySubmissionForm } from './StorySubmissionForm'

export const metadata: Metadata = {
  title: 'Stories',
  description:
    'Real renovation stories from Hawaiʻi homeowners—what worked, what didn’t, and what they wish they knew earlier.',
}

export default async function StoriesPage() {
  const stories = await prisma.content.findMany({
    where: { contentType: 'STORY', status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      dek: true,
      publishedAt: true,
      authorName: true,
      geoScope: true,
    },
  })

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeInSection>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
            Stories
          </h1>
          <p className="text-cream/70 text-lg mb-12">
            Real renovation stories from Hawai&#x02BB;i homeowners&mdash;what
            worked, what didn&apos;t, and what they wish they knew earlier.
          </p>
        </FadeInSection>

        {stories.length === 0 ? (
          <FadeInSection delay={50}>
            <div className="bg-basalt-50 rounded-card p-8 text-center mb-10">
              <Badge variant="accent" className="mb-4">
                Coming Soon
              </Badge>
              <p className="text-cream/60 mb-2">
                Stories are on the way. We&apos;re collecting real renovation
                experiences from Hawai&#x02BB;i homeowners.
              </p>
              <p className="text-cream/40 text-sm">
                Want to be first? Submit yours below.
              </p>
            </div>
          </FadeInSection>
        ) : (
          <div className="space-y-4 mb-10">
            {stories.map((s, i) => (
              <FadeInSection key={s.id} delay={i * 50}>
                <Link
                  href={`/stories/${s.slug}`}
                  className="block p-6 bg-basalt-50 rounded-card card-hover"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="font-serif text-xl text-sandstone">
                      {s.title}
                    </h2>
                    {s.geoScope && s.geoScope !== 'STATEWIDE' && (
                      <Badge>{s.geoScope.replace('_', ' ')}</Badge>
                    )}
                  </div>
                  {s.dek && (
                    <p className="text-cream/60 text-sm mb-2">{s.dek}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-cream/40">
                    {s.authorName && <span>By {s.authorName}</span>}
                    {s.publishedAt && (
                      <time>
                        {new Date(s.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                  </div>
                </Link>
              </FadeInSection>
            ))}
          </div>
        )}

        <FadeInSection delay={stories.length > 0 ? stories.length * 50 + 50 : 100}>
          <StorySubmissionForm />
        </FadeInSection>
      </div>
    </div>
  )
}
