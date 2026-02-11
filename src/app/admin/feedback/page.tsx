import type { Metadata } from 'next'
import { FeedbackDashboard } from '@/components/admin/FeedbackDashboard'

export const metadata: Metadata = {
  title: 'Feedback',
  robots: { index: false, follow: false },
}

export default function AdminFeedbackPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Feedback</h1>
      <FeedbackDashboard />
    </div>
  )
}
