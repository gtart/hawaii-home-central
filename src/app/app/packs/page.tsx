import type { Metadata } from 'next'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { PacksMarketplace } from './PacksMarketplace'

export const metadata: Metadata = {
  title: 'Decision Packs',
  description: 'Browse curated Decision Packs for your renovation.',
}

export default async function PacksPage() {
  const kits = await getPublishedIdeaPacks()
  return <PacksMarketplace kits={kits} />
}
