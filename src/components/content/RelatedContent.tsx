import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'

const MAX_RELATED = 3

export async function RelatedContent({ contentId }: { contentId: string }) {
  // 1. Curated related
  const curated = await prisma.contentRelation.findMany({
    where: { fromContentId: contentId },
    orderBy: { priority: 'asc' },
    take: MAX_RELATED,
    include: {
      toContent: {
        select: {
          id: true,
          title: true,
          slug: true,
          dek: true,
          contentType: true,
          status: true,
          publishedAt: true,
        },
      },
    },
  })

  const curatedItems = curated
    .filter((r) => r.toContent.status === 'PUBLISHED')
    .map((r) => r.toContent)

  // 2. If fewer than MAX_RELATED, backfill from shared collections
  let items = [...curatedItems]
  const usedIds = new Set([contentId, ...items.map((i) => i.id)])

  if (items.length < MAX_RELATED) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: {
        contentType: true,
        collectionItems: { select: { collectionId: true } },
        tags: { select: { tagId: true } },
      },
    })

    if (content) {
      const collectionIds = content.collectionItems.map((c) => c.collectionId)
      if (collectionIds.length > 0) {
        const siblings = await prisma.content.findMany({
          where: {
            id: { notIn: [...usedIds] },
            status: 'PUBLISHED',
            collectionItems: { some: { collectionId: { in: collectionIds } } },
          },
          take: MAX_RELATED - items.length,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            dek: true,
            contentType: true,
            status: true,
            publishedAt: true,
          },
        })
        for (const s of siblings) {
          if (items.length >= MAX_RELATED) break
          if (!usedIds.has(s.id)) {
            items.push(s)
            usedIds.add(s.id)
          }
        }
      }

      // 3. Tag overlap fallback
      if (items.length < MAX_RELATED) {
        const tagIds = content.tags.map((t) => t.tagId)
        if (tagIds.length > 0) {
          const tagSiblings = await prisma.content.findMany({
            where: {
              id: { notIn: [...usedIds] },
              status: 'PUBLISHED',
              tags: { some: { tagId: { in: tagIds } } },
            },
            take: MAX_RELATED - items.length,
            orderBy: { publishedAt: 'desc' },
            select: {
              id: true,
              title: true,
              slug: true,
              dek: true,
              contentType: true,
              status: true,
              publishedAt: true,
            },
          })
          for (const s of tagSiblings) {
            if (items.length >= MAX_RELATED) break
            if (!usedIds.has(s.id)) {
              items.push(s)
              usedIds.add(s.id)
            }
          }
        }
      }
    }
  }

  if (items.length === 0) return null

  return (
    <section className="mt-16 pt-8 border-t border-cream/10">
      <h2 className="font-serif text-2xl text-sandstone mb-6">Related</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${item.contentType === 'GUIDE' ? 'hawaii-home-renovation' : 'stories'}/${item.slug}`}
            className="block p-4 bg-basalt-50 rounded-card hover:bg-cream/5 transition-colors"
          >
            <Badge variant="default" className="mb-2">
              {item.contentType === 'GUIDE' ? 'Basics' : 'Story'}
            </Badge>
            <h3 className="font-serif text-lg text-sandstone mb-1">
              {item.title}
            </h3>
            {item.dek && (
              <p className="text-cream/50 text-sm line-clamp-2">{item.dek}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
