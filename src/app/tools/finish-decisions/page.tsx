import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ToolContent } from '@/app/app/tools/finish-decisions/ToolContent'

export const metadata: Metadata = {
  title: 'Decision Tracker — Track Every Material and Finish Choice',
  description:
    'Free interactive tracker for renovation finish decisions. Track appliances, countertops, flooring, fixtures, and more across rooms and construction stages.',
}

export default async function FinishDecisionsLocalPage() {
  const session = await auth()
  if (session?.user) redirect('/app/tools/finish-decisions')

  return <ToolContent localOnly />
}
