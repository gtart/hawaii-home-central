import type { Metadata } from 'next'
import { ProjectSummaryCollectionContent } from './ProjectSummaryCollectionContent'

export const metadata: Metadata = {
  title: 'Project Summary',
}

export default async function ProjectSummaryCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params

  return <ProjectSummaryCollectionContent collectionId={collectionId} />
}
