import type { Metadata } from 'next'
import { StorySubmissionsDashboard } from '@/components/admin/StorySubmissionsDashboard'

export const metadata: Metadata = {
  title: 'Story Submissions',
  robots: { index: false, follow: false },
}

export default function AdminStorySubmissionsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Story Submissions</h1>
      <StorySubmissionsDashboard />
    </div>
  )
}
