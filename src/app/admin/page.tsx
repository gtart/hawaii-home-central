import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [guideCount, storyCount, draftCount, feedbackCount, signupCount] =
    await Promise.all([
      prisma.content.count({ where: { contentType: 'GUIDE' } }),
      prisma.content.count({ where: { contentType: 'STORY' } }),
      prisma.content.count({ where: { status: 'DRAFT' } }),
      prisma.contentPrivateFeedback.count(),
      prisma.earlyAccessSignup
        ? prisma.earlyAccessSignup.count()
        : Promise.resolve(0),
    ])

  const stats = [
    { label: 'Basics', value: guideCount, href: '/admin/content?type=GUIDE' },
    { label: 'Stories', value: storyCount, href: '/admin/content?type=STORY' },
    { label: 'Drafts', value: draftCount, href: '/admin/content?status=DRAFT' },
    { label: 'Feedback', value: feedbackCount, href: '/admin/feedback' },
    { label: 'Signups', value: signupCount, href: '/admin/signups' },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-basalt-50 rounded-card p-4 hover:bg-cream/5 transition-colors"
          >
            <p className="text-2xl font-medium text-cream">{stat.value}</p>
            <p className="text-sm text-cream/50">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/content/new?type=GUIDE"
          className="bg-basalt-50 rounded-card p-4 text-center hover:bg-cream/5 transition-colors"
        >
          <p className="text-sandstone font-medium">+ New Guide</p>
        </Link>
        <Link
          href="/admin/content/new?type=STORY"
          className="bg-basalt-50 rounded-card p-4 text-center hover:bg-cream/5 transition-colors"
        >
          <p className="text-sandstone font-medium">+ New Story</p>
        </Link>
      </div>
    </div>
  )
}
