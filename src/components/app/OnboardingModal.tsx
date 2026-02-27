'use client'

import { useEffect, useRef } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { STAGE_PICKER_OPTIONS } from '@/lib/stage-tool-priority'

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const { setProjectStage } = useProject()
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstBtnRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
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

  const handleSelect = (stageId: string) => {
    setProjectStage(stageId).catch(() => {})
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
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
          Where are you in your renovation?
        </h2>
        <p className="text-cream/70 text-sm mb-6 leading-relaxed">
          We&apos;ll recommend the right tools for your stage.
        </p>
        <div className="space-y-3">
          {STAGE_PICKER_OPTIONS.map((option, i) => (
            <button
              key={option.id}
              ref={i === 0 ? firstBtnRef : undefined}
              type="button"
              onClick={() => handleSelect(option.id)}
              className="w-full text-left p-4 rounded-lg border border-cream/10 hover:border-sandstone/30 hover:bg-cream/5 transition-colors"
            >
              <span className="text-sm font-medium text-cream block">
                {option.label}
              </span>
              <span className="text-xs text-cream/50 mt-0.5 block">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
