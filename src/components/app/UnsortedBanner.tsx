'use client'

import Link from 'next/link'
import { useInboxCount } from '@/hooks/useInboxCount'

const TOOL_LABELS: Record<string, string> = {
  finish_decisions: 'Selections',
  punchlist: 'Fix List',
  mood_boards: 'Mood Boards',
}

export function UnsortedBanner({ toolKey }: { toolKey: string }) {
  const { byTool } = useInboxCount()
  const count = byTool[toolKey] || 0

  if (count === 0) return null

  const label = TOOL_LABELS[toolKey] || toolKey

  return (
    <Link
      href={`/app/inbox`}
      className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-sandstone/5 border border-sandstone/10 rounded-lg hover:bg-sandstone/8 transition-colors"
    >
      <svg className="w-4 h-4 text-sandstone/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm text-cream/50">
        <span className="text-sandstone font-medium">{count}</span> unsorted {count === 1 ? 'item' : 'items'} for {label}
      </span>
      <svg className="w-3.5 h-3.5 text-cream/25 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
