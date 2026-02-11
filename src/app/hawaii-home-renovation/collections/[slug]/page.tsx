import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ContentBreadcrumbs } from '@/components/content/ContentBreadcrumbs'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

async function getCollection(slug: string) {
  return prisma.collection.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: [{ pinned: 'desc' }, { priority: 'asc' }],
        include: {
          content: {
            select: {
              id: true,
              title: true,
              slug: true,
              dek: true,
              contentType: true,
              status: true,
              publishedAt: true,
              geoScope: true,
            },
          },
        },
      },
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) return { title: 'Not Found' }

  return {
    title: collection.title,
    description: collection.description || undefined,
  }
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) notFound()

  const publishedItems = collection.items.filter(
    (i) => i.content.status === 'PUBLISHED'
  )

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <ContentBreadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Renovation Basics', href: '/guides' },
            { label: collection.title, href: `/guides/collections/${collection.slug}` },
          ]}
        />

        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="text-cream/70 text-lg mb-8 max-w-2xl">
            {collection.description}
          </p>
        )}

        {publishedItems.length === 0 ? (
          <p className="text-cream/40">No items in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedItems.map((item) => (
              <Link
                key={item.id}
                href={`/${item.content.contentType === 'GUIDE' ? 'hawaii-home-renovation' : 'stories'}/${item.content.slug}`}
                className="block p-6 bg-basalt-50 rounded-card card-hover"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-serif text-xl text-sandstone">
                    {item.content.title}
                  </h3>
                  <Badge>
                    {item.content.contentType === 'GUIDE' ? 'Basics' : 'Story'}
                  </Badge>
                </div>
                {item.content.dek && (
                  <p className="text-cream/60 text-sm line-clamp-2">
                    {item.content.dek}
                  </p>
                )}
                {item.pinned && (
                  <span className="text-xs text-sandstone/60 mt-2 inline-block">
                    Pinned
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
