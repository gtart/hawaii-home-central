import { redirect } from 'next/navigation'

/**
 * Legacy collection route redirect.
 * Old URLs like /app/tools/finish-decisions/[collectionId] now redirect
 * to the workspace-first landing page.
 */
export default async function DecisionTrackerCollectionPage() {
  redirect('/app/tools/finish-decisions')
}
