'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING_OPTIONS } from '@/lib/onboarding-options'

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstBtnRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleSelect('exploring', null)
      return
    }
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const handleSelect = (focus: string, href: string | null) => {
    fetch('/api/user/onboarding-complete', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ focus }),
    }).catch(() => {})

    onClose()
    if (href) router.push(href)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => handleSelect('exploring', null)}
      />
      <div
        ref={dialogRef}
        className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <h2
          id="onboarding-title"
          className="font-serif text-2xl text-sandstone mb-3"
        >
          Welcome to Hawaii Home Central
        </h2>
        <p className="text-cream/70 text-sm mb-6 leading-relaxed">
          What brings you here today? We&apos;ll point you in the right
          direction.
        </p>
        <div className="space-y-3">
          {ONBOARDING_OPTIONS.map((option, i) => (
            <button
              key={option.focus}
              ref={i === 0 ? firstBtnRef : undefined}
              type="button"
              onClick={() => handleSelect(option.focus, option.href)}
              className="w-full text-left p-4 rounded-lg border border-cream/10 hover:border-sandstone/30 hover:bg-cream/5 transition-colors"
            >
              <span className="text-sm text-cream">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
