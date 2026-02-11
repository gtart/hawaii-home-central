import type { Metadata } from 'next'
import { CollectionEditor } from '@/components/admin/CollectionEditor'

export const metadata: Metadata = { title: 'New Collection' }

export default function NewCollectionPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">
        New Collection
      </h1>
      <CollectionEditor />
    </div>
  )
}
