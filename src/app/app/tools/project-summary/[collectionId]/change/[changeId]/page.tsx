import type { Metadata } from 'next'
import { ChangeDetailContent } from './ChangeDetailContent'

export const metadata: Metadata = {
  title: 'Change Detail — Change Log',
}

export default async function ChangeDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string; changeId: string }>
}) {
  const { collectionId, changeId } = await params

  return <ChangeDetailContent collectionId={collectionId} changeId={changeId} />
}
