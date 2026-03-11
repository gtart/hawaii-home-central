import { ToolContent } from '../ToolContent'

export default async function AlignmentCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  return <ToolContent collectionId={collectionId} />
}
