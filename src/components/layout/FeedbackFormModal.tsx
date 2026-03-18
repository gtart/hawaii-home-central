'use client'

import { useState, useEffect, useRef } from 'react'

interface FeedbackFormModalProps {
  open: boolean
  onClose: () => void
}

export function FeedbackFormModal({ open, onClose }: FeedbackFormModalProps) {
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setMessage('')
      setEmail('')
      setSubmitted(false)
      setError(null)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
          pageUrl: window.location.href,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: navigator.platform || undefined,
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Try again.')
        return
      }

      setSubmitted(true)
      setTimeout(() => onClose(), 2000)
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 md:pt-32 p-4">
      <div
        className="absolute inset-0 bg-basalt/80"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-basalt-50 border border-cream/10 rounded-card p-6 md:p-8 max-w-md w-full shadow-xl">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-lg text-sandstone font-serif mb-2">Thank you!</p>
            <p className="text-sm text-cream/60">We got your feedback and will take a look.</p>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-xl text-sandstone mb-1">
              Submit Feedback or Ideas
            </h2>
            <p className="text-xs text-cream/45 mb-5">
              Tell us what&apos;s working, what&apos;s not, or what you wish existed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="feedback-message" className="block text-[11px] text-cream/55 uppercase tracking-wider mb-1.5">
                  Your feedback <span className="text-sandstone/60">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={4}
                  maxLength={5000}
                  required
                  className="w-full bg-basalt border border-cream/15 focus:border-sandstone/40 rounded-lg px-3 py-2 text-sm text-cream/80 placeholder-cream/25 outline-none transition-colors resize-y"
                />
              </div>

              <div>
                <label htmlFor="feedback-email" className="block text-[11px] text-cream/55 uppercase tracking-wider mb-1.5">
                  Email <span className="text-cream/30">(optional)</span>
                </label>
                <input
                  type="email"
                  id="feedback-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="In case we want to follow up"
                  className="w-full bg-basalt border border-cream/15 focus:border-sandstone/40 rounded-lg px-3 py-2 text-sm text-cream/80 placeholder-cream/25 outline-none transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400/80">{error}</p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!message.trim() || submitting}
                  className="px-5 py-2 text-sm font-medium text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg transition-colors disabled:opacity-40"
                >
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-sm text-cream/40 hover:text-cream/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
