'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'

const MAX_SUMMARY = 1000

export function StorySubmissionForm() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!summary.trim()) {
      setError('Please tell us about your story.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/stories/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || null,
          summary: summary.trim(),
          challenge: null,
          proudestMoment: null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-basalt-50 rounded-card p-8 text-center">
        <h2 className="font-serif text-xl text-sandstone mb-3">
          Thank you for sharing
        </h2>
        <p className="text-cream/60 text-sm leading-relaxed max-w-md mx-auto">
          We&apos;ll review your submission and may reach out if we&apos;d like to feature it.
          We appreciate you taking the time.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="bg-basalt-50 rounded-card p-8 text-center">
        <h2 className="font-serif text-2xl text-sandstone mb-3">
          Interested in sharing a story?
        </h2>
        <p className="text-cream/60 text-sm leading-relaxed max-w-lg mx-auto mb-6">
          We&apos;re looking for real renovation experiences from Hawai&#x02BB;i
          homeowners. Your story can help others avoid surprises and feel more
          prepared. You can stay anonymous&mdash;we just need to verify your
          story is authentic.
        </p>
        <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
          Share Your Story
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-basalt-50 rounded-card p-6 md:p-8">
      <h2 className="font-serif text-xl text-sandstone mb-2">
        Tell us about your renovation
      </h2>
      <p className="text-cream/50 text-sm leading-relaxed mb-6">
        Keep it brief&mdash;a few sentences to a short paragraph is perfect. We
        review all submissions and may not publish every story. Your identity can
        remain confidential, but we may follow up to verify details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Story */}
        <div>
          <label className="block text-sm text-cream/70 mb-1.5">
            What&apos;s your story about? <span className="text-sandstone">*</span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value.slice(0, MAX_SUMMARY))}
            placeholder="e.g., We renovated our 1970s kitchen in Kailua. The biggest lesson was ordering materials 8 weeks earlier than we thought we needed..."
            className="w-full bg-basalt border border-cream/20 text-cream rounded-lg px-3 py-2.5 text-sm placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50 min-h-[120px]"
            required
          />
          <p className="text-[10px] text-cream/25 mt-1 text-right">
            {summary.length}/{MAX_SUMMARY}
          </p>
        </div>

        {/* Optional: Email */}
        <div>
          <label className="block text-sm text-cream/70 mb-1.5">
            Email <span className="text-cream/30 text-xs">(optional&mdash;only if you&apos;d like us to follow up)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-basalt border border-cream/20 text-cream rounded-lg px-3 py-2.5 text-sm placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting || !summary.trim()}>
            {submitting ? 'Submitting...' : 'Submit Story'}
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-cream/40 hover:text-cream/60 transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-[11px] text-cream/25 leading-relaxed">
          By submitting, you agree that we may use your story (anonymously if
          you prefer) on Hawaii Home Central. We review all submissions for
          authenticity and may not publish every story.
        </p>
      </form>
    </div>
  )
}
