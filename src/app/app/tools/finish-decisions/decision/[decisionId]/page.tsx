import type { Metadata } from 'next'
import { DecisionDetailContent } from './DecisionDetailContent'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Decision Detail',
}

export default async function DecisionDetailPage() {
  const [kits, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getSelectionEmojiMap(),
  ])

  return <DecisionDetailContent kits={kits} emojiMap={emojiMap} />
}
