import type { Metadata } from 'next'
import { SignupsDashboard } from '@/components/admin/SignupsDashboard'

export const metadata: Metadata = {
  title: 'Signups',
  robots: { index: false, follow: false },
}

export default function AdminSignupsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Early Access Signups</h1>
      <SignupsDashboard />
    </div>
  )
}
