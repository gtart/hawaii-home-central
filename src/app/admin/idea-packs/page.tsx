import type { Metadata } from 'next'
import { IdeaPackList } from './IdeaPackList'

export const metadata: Metadata = { title: 'Idea Packs' }

export default function AdminIdeaPacksPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Idea Packs</h1>
      <IdeaPackList />
    </div>
  )
}
