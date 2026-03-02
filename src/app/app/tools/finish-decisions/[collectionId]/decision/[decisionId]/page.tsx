import type { Metadata } from 'next'
import { DecisionDetailContent } from '../../../decision/[decisionId]/DecisionDetailContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Decision Detail',
}

export default async function CollectionDecisionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string; decisionId: string }>
}) {
  const { collectionId } = await params
  const [kits, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getSelectionEmojiMap(),
  ])

  return <DecisionDetailContent collectionId={collectionId} kits={kits} emojiMap={emojiMap} />
}
