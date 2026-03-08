import { ToolContent } from '../ToolContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getSelectionEmojiMap } from '@/lib/default-selections-db'

export default async function DecisionTrackerCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  const [kits, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getSelectionEmojiMap(),
  ])

  return (
    <ToolContent
      collectionId={collectionId}
      kits={kits}
      emojiMap={emojiMap}
    />
  )
}
