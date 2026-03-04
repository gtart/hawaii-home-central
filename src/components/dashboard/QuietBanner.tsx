'use client'

import { relativeTime } from '@/lib/relativeTime'

export function QuietBanner({ lastActivityAt }: { lastActivityAt?: string }) {
  return (
    <div className="bg-basalt-50 rounded-card border border-cream/10 px-5 py-4 mb-6 text-center">
      <p className="text-sm text-cream/50">All caught up — nothing needs your attention right now.</p>
      {lastActivityAt && (
        <p className="text-[11px] text-cream/25 mt-1">Last activity: {relativeTime(lastActivityAt)}</p>
      )}
    </div>
  )
}
