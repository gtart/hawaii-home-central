import type { Metadata } from 'next'
import { RoomDetailContent } from '../../../room/[roomId]/RoomDetailContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getDefaultDecisionsByRoomType, getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Room Detail',
}

export default async function CollectionRoomDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string; roomId: string }>
}) {
  const { collectionId } = await params
  const [kits, defaultDecisions, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getDefaultDecisionsByRoomType(),
    getSelectionEmojiMap(),
  ])

  return (
    <RoomDetailContent
      collectionId={collectionId}
      kits={kits}
      defaultDecisions={defaultDecisions}
      emojiMap={emojiMap}
    />
  )
}
