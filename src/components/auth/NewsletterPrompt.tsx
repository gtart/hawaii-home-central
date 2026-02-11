'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface PromptCopy {
  newsletter_prompt_title: string
  newsletter_prompt_body: string
  newsletter_prompt_opt_in_label: string
  newsletter_prompt_skip_label: string
}

const DEFAULTS: PromptCopy = {
  newsletter_prompt_title: 'Stay in the loop',
  newsletter_prompt_body:
    'Get occasional updates about new guides and tools for Hawaiʻi homeowners.',
  newsletter_prompt_opt_in_label: 'Yes, sign me up',
  newsletter_prompt_skip_label: 'Skip for now',
}

export function NewsletterPrompt({ onClose }: { onClose: () => void }) {
  const [copy, setCopy] = useState<PromptCopy>(DEFAULTS)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings/newsletter-prompt')
      .then((r) => r.json())
      .then((data) => setCopy({ ...DEFAULTS, ...data }))
      .catch(() => {})
  }, [])

  const markSeen = useCallback(async () => {
    await fetch('/api/user/newsletter-prompt-seen', { method: 'PUT' }).catch(
      () => {}
    )
  }, [])

  const handleOptIn = async () => {
    setIsSubmitting(true)
    await fetch('/api/newsletter', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn: true }),
    }).catch(() => {})
    await markSeen()
    onClose()
  }

  const handleSkip = async () => {
    setIsSubmitting(true)
    await markSeen()
    onClose()
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-basalt/80"
        onClick={handleSkip}
        aria-hidden="true"
      />
      <div className="relative bg-basalt-50 border border-cream/10 rounded-card p-8 max-w-md w-full shadow-xl">
        <h2 className="font-serif text-2xl text-sandstone mb-3">
          {copy.newsletter_prompt_title}
        </h2>
        <p className="text-cream/70 text-sm mb-6 leading-relaxed">
          {copy.newsletter_prompt_body}
        </p>
        <div className="space-y-3">
          <Button
            onClick={handleOptIn}
            disabled={isSubmitting}
            size="lg"
            className="w-full"
          >
            {copy.newsletter_prompt_opt_in_label}
          </Button>
          <Button
            onClick={handleSkip}
            disabled={isSubmitting}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {copy.newsletter_prompt_skip_label}
          </Button>
        </div>
        <p className="text-xs text-cream/30 mt-4 text-center">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  )
}
