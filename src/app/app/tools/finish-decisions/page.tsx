import type { Metadata } from 'next'
import { SelectionsWorkspaceLoader } from './SelectionsWorkspaceLoader'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { getSelectionEmojiMap } from '@/lib/default-selections-db'

export const metadata: Metadata = {
  title: 'Selections',
}

export default async function FinishDecisionsToolPage() {
  const [kits, emojiMap] = await Promise.all([
    getPublishedIdeaPacks(),
    getSelectionEmojiMap(),
  ])

  return <SelectionsWorkspaceLoader kits={kits} emojiMap={emojiMap} />
}
