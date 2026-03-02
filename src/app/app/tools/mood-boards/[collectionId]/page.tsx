import type { Metadata } from 'next'
import { MoodBoardCollectionContent } from './MoodBoardCollectionContent'

export const metadata: Metadata = {
  title: 'Mood Board',
}

export default async function MoodBoardCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params

  return <MoodBoardCollectionContent collectionId={collectionId} />
}
