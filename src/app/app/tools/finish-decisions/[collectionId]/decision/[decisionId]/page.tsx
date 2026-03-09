import { redirect } from 'next/navigation'

/**
 * Legacy collection decision detail redirect.
 * Redirects to the workspace-first decision detail route.
 */
export default async function CollectionDecisionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string; decisionId: string }>
}) {
  const { decisionId } = await params
  redirect(`/app/tools/finish-decisions/decision/${decisionId}`)
}
