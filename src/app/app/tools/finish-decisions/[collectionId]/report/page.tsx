import { redirect } from 'next/navigation'

/**
 * Legacy collection report redirect.
 * Redirects to the workspace-first report route.
 */
export default async function CollectionReportPage() {
  redirect('/app/tools/finish-decisions/report')
}
