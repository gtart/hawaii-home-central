import type { Metadata } from 'next'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { PacksMarketplace } from './PacksMarketplace'

export const metadata: Metadata = {
  title: 'Selection Packs',
  description: 'Browse curated Selection Packs for your renovation.',
}

export default async function PacksPage() {
  const kits = await getPublishedIdeaPacks()
  return <PacksMarketplace kits={kits} />
}
