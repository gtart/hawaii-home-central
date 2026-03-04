'use client'

import Link from 'next/link'
import type { DashboardResponse } from '@/server/dashboard'

export function DashboardSecondary({
  title,
  href,
  toolKey,
  data,
}: {
  title: string
  href: string
  toolKey: string
  data: DashboardResponse | null
}) {
  let statLine: string | null = null

  if (data && toolKey === 'mood_boards') {
    const boards = data.moodBoards
    if (boards.length > 0) {
      const totalIdeas = boards.reduce((s, b) => s + b.itemCount, 0)
      statLine = `${boards.length} board${boards.length !== 1 ? 's' : ''} · ${totalIdeas} idea${totalIdeas !== 1 ? 's' : ''}`
    }
  } else if (data && toolKey === 'before_you_sign') {
    const checklists = data.beforeYouSign
    if (checklists.length > 0) {
      statLine = `${checklists.length} checklist${checklists.length !== 1 ? 's' : ''}`
    }
  }

  return (
    <Link
      href={href}
      className="group bg-basalt-50 rounded-card border border-cream/10 p-4 hover:border-sandstone/20 transition-colors block"
    >
      <p className="text-sm font-medium text-cream/60 group-hover:text-sandstone transition-colors mb-1">
        {title}
      </p>
      {statLine ? (
        <p className="text-[11px] text-cream/30">{statLine}</p>
      ) : (
        <p className="text-[11px] text-cream/20">
          {data ? 'Not started yet' : ''}
        </p>
      )}
    </Link>
  )
}
