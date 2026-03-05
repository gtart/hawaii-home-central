import type { Metadata } from 'next'
import { InboxPage } from '@/components/app/InboxPage'

export const metadata: Metadata = {
  title: 'Inbox — Hawaii Home Central',
}

export default function InboxRoute() {
  return <InboxPage />
}
