import type { Metadata } from 'next'
import { IdeaPackList } from './IdeaPackList'

export const metadata: Metadata = { title: 'Selection Packs' }

export default function AdminIdeaPacksPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Selection Packs</h1>
      <IdeaPackList />
    </div>
  )
}
