import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer'
import { ContentMeta } from '@/components/content/ContentMeta'
import { ContentBreadcrumbs } from '@/components/content/ContentBreadcrumbs'
import { RelatedContent } from '@/components/content/RelatedContent'
import { Badge } from '@/components/ui/Badge'
import { ThumbsFeedback } from '@/components/content/ThumbsFeedback'
import { PrivateFeedbackForm } from '@/components/content/PrivateFeedbackForm'

async function getStory(slug: string) {
  return prisma.content.findFirst({
    where: {
      slug,
      contentType: 'STORY',
      status: 'PUBLISHED',
    },
    include: {
      tags: { include: { tag: true } },
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const story = await getStory(slug)
  if (!story) return { title: 'Not Found' }

  return {
    title: story.metaTitle || story.title,
    description: story.metaDescription || story.dek || undefined,
    ...(story.canonicalUrl && {
      alternates: { canonical: story.canonicalUrl },
    }),
    openGraph: {
      title: story.metaTitle || story.title,
      description: story.metaDescription || story.dek || undefined,
      ...(story.ogImageUrl && { images: [story.ogImageUrl] }),
    },
    ...(story.robotsNoIndex && { robots: { index: false, follow: false } }),
  }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await getStory(slug)
  if (!story) notFound()

  const wordCount = story.bodyMd.split(/\s+/).length

  return (
    <div className="pt-32 pb-24 px-6">
      <article className="max-w-3xl mx-auto">
        <ContentBreadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stories', href: '/stories' },
            { label: story.title, href: `/stories/${story.slug}` },
          ]}
        />

        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          {story.title}
        </h1>

        {story.dek && (
          <p className="text-cream/70 text-lg mb-4 leading-relaxed">
            {story.dek}
          </p>
        )}

        <div className="mb-8">
          <ContentMeta
            authorName={story.authorName}
            publishedAt={story.publishedAt}
            wordCount={wordCount}
          />
        </div>

        <MarkdownRenderer content={story.bodyMd} />

        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-cream/10">
            {story.tags.map((t) => (
              <Badge key={t.tag.id}>{t.tag.name}</Badge>
            ))}
          </div>
        )}

        {/* Feedback */}
        <ThumbsFeedback contentId={story.id} slug={story.slug} />
        <PrivateFeedbackForm slug={story.slug} />

        <RelatedContent contentId={story.id} />
      </article>
    </div>
  )
}
