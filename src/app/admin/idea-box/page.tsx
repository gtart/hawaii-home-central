import type { Metadata } from 'next'
import { IdeaBoxDashboard } from '@/components/admin/IdeaBoxDashboard'

export const metadata: Metadata = {
  title: 'Idea Box',
  robots: { index: false, follow: false },
}

export default function AdminIdeaBoxPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-2">Idea Box</h1>
      <p className="text-sm text-cream/50 mb-6">User-submitted feedback and ideas from the site.</p>
      <IdeaBoxDashboard />
    </div>
  )
}
