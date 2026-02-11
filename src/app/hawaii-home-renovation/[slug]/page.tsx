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
import Link from 'next/link'

async function getGuide(slug: string) {
  return prisma.content.findFirst({
    where: {
      slug,
      contentType: 'GUIDE',
      status: 'PUBLISHED',
    },
    include: {
      primaryCollection: true,
      collectionItems: { include: { collection: true } },
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
  const guide = await getGuide(slug)
  if (!guide) return { title: 'Not Found' }

  return {
    title: guide.metaTitle || guide.title,
    description: guide.metaDescription || guide.dek || undefined,
    ...(guide.canonicalUrl && {
      alternates: { canonical: guide.canonicalUrl },
    }),
    openGraph: {
      title: guide.metaTitle || guide.title,
      description: guide.metaDescription || guide.dek || undefined,
      ...(guide.ogImageUrl && { images: [guide.ogImageUrl] }),
    },
    ...(guide.robotsNoIndex && { robots: { index: false, follow: false } }),
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = await getGuide(slug)
  if (!guide) notFound()

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Renovation Basics', href: '/hawaii-home-renovation' },
  ]
  if (guide.primaryCollection) {
    breadcrumbs.push({
      label: guide.primaryCollection.title,
      href: `/hawaii-home-renovation/collections/${guide.primaryCollection.slug}`,
    })
  }
  breadcrumbs.push({ label: guide.title, href: `/hawaii-home-renovation/${guide.slug}` })

  const collections = guide.collectionItems.map((ci) => ci.collection)
  const wordCount = guide.bodyMd.split(/\s+/).length

  return (
    <div className="pt-32 pb-24 px-6">
      <article className="max-w-3xl mx-auto">
        <ContentBreadcrumbs items={breadcrumbs} />

        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          {guide.title}
        </h1>

        {guide.dek && (
          <p className="text-cream/70 text-lg mb-4 leading-relaxed">
            {guide.dek}
          </p>
        )}

        <div className="mb-6">
          <ContentMeta
            authorName={guide.authorName}
            wordCount={wordCount}
          />
        </div>

        {/* Collection chips */}
        {collections.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {collections.map((c) => (
              <Link key={c.id} href={`/hawaii-home-renovation/collections/${c.slug}`}>
                <Badge variant="accent">{c.title}</Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Body */}
        <MarkdownRenderer content={guide.bodyMd} />

        {/* Tags */}
        {guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-cream/10">
            {guide.tags.map((t) => (
              <Badge key={t.tag.id}>{t.tag.name}</Badge>
            ))}
          </div>
        )}

        {/* Feedback */}
        <ThumbsFeedback contentId={guide.id} slug={guide.slug} />
        <PrivateFeedbackForm slug={guide.slug} />

        {/* Related */}
        <RelatedContent contentId={guide.id} />
      </article>
    </div>
  )
}
