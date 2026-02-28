import type { Metadata } from 'next'
import { getPublishedIdeaPacks } from '@/lib/idea-packs-db'
import { PackDetail } from './PackDetail'

export const metadata: Metadata = {
  title: 'Decision Pack Detail',
}

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ packId: string }>
}) {
  const { packId } = await params
  const kits = await getPublishedIdeaPacks()
  return <PackDetail packId={packId} kits={kits} />
}
