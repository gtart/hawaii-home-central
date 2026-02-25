import type { Metadata } from 'next'
import { RoomDetailContent } from './RoomDetailContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getDefaultDecisionsByRoomType, getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Room Detail',
}

export default async function RoomDetailPage() {
  const [kits, defaultDecisions, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getDefaultDecisionsByRoomType(),
    getSelectionEmojiMap(),
  ])

  return (
    <RoomDetailContent
      kits={kits}
      defaultDecisions={defaultDecisions}
      emojiMap={emojiMap}
    />
  )
}
