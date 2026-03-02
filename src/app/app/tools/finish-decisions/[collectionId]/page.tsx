import { ToolContent } from '../ToolContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getDefaultDecisionsByRoomType, getSelectionEmojiMap } from '@/lib/default-selections-db'

export default async function DecisionTrackerCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  const [kits, defaultDecisions, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getDefaultDecisionsByRoomType(),
    getSelectionEmojiMap(),
  ])

  return (
    <ToolContent
      collectionId={collectionId}
      kits={kits}
      defaultDecisions={defaultDecisions}
      emojiMap={emojiMap}
    />
  )
}
