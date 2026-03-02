import { BeforeYouSignContent } from '../BeforeYouSignContent'

export default async function BYSCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params
  return <BeforeYouSignContent collectionId={collectionId} />
}
