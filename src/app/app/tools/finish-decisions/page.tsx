import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getDefaultDecisionsByRoomType, getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Finish Selections',
}

export default async function FinishDecisionsToolPage() {
  const [kits, defaultDecisions, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getDefaultDecisionsByRoomType(),
    getSelectionEmojiMap(),
  ])

  return (
    <ToolContent
      kits={kits}
      defaultDecisions={defaultDecisions}
      emojiMap={emojiMap}
    />
  )
}
