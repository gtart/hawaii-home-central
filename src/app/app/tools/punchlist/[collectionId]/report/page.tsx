import type { Metadata } from 'next'
import { PunchlistReport } from '../../report/PunchlistReport'

export const metadata: Metadata = {
  title: 'Fix List Report',
  robots: 'noindex, nofollow',
}

export default async function CollectionReportPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  return <PunchlistReport collectionIdOverride={collectionId} />
}
