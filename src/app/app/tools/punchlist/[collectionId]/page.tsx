import { ToolContent } from '../ToolContent'

export default async function PunchlistCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  return <ToolContent collectionId={collectionId} />
}
