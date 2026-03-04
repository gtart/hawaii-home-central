import type { Metadata } from 'next'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

export const metadata: Metadata = {
  title: 'Home — Hawaii Home Central',
}

export default function AppPage() {
  return <DashboardPage />
}
