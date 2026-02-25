import type { Metadata } from 'next'
import { IdeaPackEditor } from './IdeaPackEditor'

export const metadata: Metadata = { title: 'Edit Idea Pack' }

export default async function AdminIdeaPackDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div>
      <IdeaPackEditor packId={id} />
    </div>
  )
}
