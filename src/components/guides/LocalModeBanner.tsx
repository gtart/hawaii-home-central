'use client'

import Link from 'next/link'

interface LocalModeBannerProps {
  signInUrl: string
}

export function LocalModeBanner({ signInUrl }: LocalModeBannerProps) {
  return (
    <div className="bg-sandstone/10 border border-sandstone/20 rounded-card px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <p className="text-cream/70 text-sm flex-1">
        Your data is saved in this browser. Sign in to sync across devices.
      </p>
      <Link
        href={signInUrl}
        className="text-sandstone text-sm font-medium hover:text-sandstone-light transition-colors shrink-0"
      >
        Sign in &rarr;
      </Link>
    </div>
  )
}
