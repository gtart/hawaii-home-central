import type { Metadata } from 'next'
import { DecisionDetailLoader } from './DecisionDetailLoader'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Selection Detail',
}

export default async function DecisionDetailPage() {
  const [kits, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getSelectionEmojiMap(),
  ])

  return <DecisionDetailLoader kits={kits} emojiMap={emojiMap} />
}
