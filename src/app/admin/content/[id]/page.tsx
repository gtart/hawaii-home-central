import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ContentEditor } from '@/components/admin/ContentEditor'
import type { ContentWithRelations } from '@/types/content'

export const metadata: Metadata = { title: 'Edit Content' }

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      collectionItems: { include: { collection: true } },
      images: { orderBy: { createdAt: 'desc' } },
      relationsFrom: {
        orderBy: { priority: 'asc' },
        include: {
          toContent: {
            select: { id: true, title: true, contentType: true, slug: true },
          },
        },
      },
      primaryCollection: true,
    },
  })

  if (!content) notFound()

  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">
        Edit: {content.title}
      </h1>
      <ContentEditor initial={content as ContentWithRelations} />
    </div>
  )
}
