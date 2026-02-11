import type { Metadata } from 'next'
import { ContentEditor } from '@/components/admin/ContentEditor'

export const metadata: Metadata = { title: 'New Content' }

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const defaultType = type === 'STORY' ? 'STORY' : 'GUIDE'

  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">
        New {defaultType === 'GUIDE' ? 'Guide' : 'Story'}
      </h1>
      <ContentEditor defaultType={defaultType} />
    </div>
  )
}
