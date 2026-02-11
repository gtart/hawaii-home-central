import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CollectionEditor } from '@/components/admin/CollectionEditor'

export const metadata: Metadata = { title: 'Edit Collection' }

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ pinned: 'desc' }, { priority: 'asc' }],
        include: {
          content: {
            select: { id: true, title: true, contentType: true, slug: true, status: true },
          },
        },
      },
    },
  })

  if (!collection) notFound()

  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">
        Edit: {collection.title}
      </h1>
      <CollectionEditor initial={collection} />
    </div>
  )
}
