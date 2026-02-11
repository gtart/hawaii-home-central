import type { Metadata } from 'next'
import { ContentList } from './ContentList'

export const metadata: Metadata = { title: 'Content' }

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Content</h1>
      <ContentList />
    </div>
  )
}
