'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { ONBOARDING_OPTIONS } from '@/lib/onboarding-options'

export function StartHereModule() {
  const [dismissed, setDismissed] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null
  )

  useEffect(() => {
    fetch('/api/user/onboarding-status')
      .then((r) => r.json())
      .then((data) => setHasSeenOnboarding(data.hasSeenAppOnboarding))
      .catch(() => setHasSeenOnboarding(true))
  }, [])

  if (dismissed || hasSeenOnboarding !== false) return null

  const markComplete = (focus: string) => {
    fetch('/api/user/onboarding-complete', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus }),
    }).catch(() => {})
  }

  return (
    <FadeInSection>
      <div className="bg-basalt-50 rounded-card p-6 mb-8">
        <h2 className="font-serif text-xl text-sandstone mb-2">
          What brings you here today?
        </h2>
        <p className="text-cream/60 text-sm mb-6">
          Pick what fits and we&apos;ll take you there.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ONBOARDING_OPTIONS.map((option) =>
            option.href ? (
              <Link
                key={option.focus}
                href={option.href}
                onClick={() => markComplete(option.focus)}
                className="flex items-center gap-3 p-4 rounded-lg border border-cream/10 hover:border-sandstone/30 hover:bg-cream/5 transition-colors"
              >
                <span className="text-sm text-cream/70">{option.label}</span>
              </Link>
            ) : (
              <button
                key={option.focus}
                type="button"
                onClick={() => {
                  markComplete(option.focus)
                  setDismissed(true)
                }}
                className="flex items-center gap-3 p-4 rounded-lg border border-cream/10 hover:border-cream/20 hover:bg-cream/5 transition-colors text-left"
              >
                <span className="text-sm text-cream/70">{option.label}</span>
              </button>
            )
          )}
        </div>
      </div>
    </FadeInSection>
  )
}
