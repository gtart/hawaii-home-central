'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface PrivateFeedbackFormProps {
  slug: string
}

function getAnonId(): string {
  const key = 'hhc-anon-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function PrivateFeedbackForm({ slug }: PrivateFeedbackFormProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [honey, setHoney] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || honey) return

    // Client-side cooldown
    const cooldownKey = `feedback-cooldown-${slug}`
    const lastSent = localStorage.getItem(cooldownKey)
    if (lastSent && Date.now() - Number(lastSent) < 30000) {
      setError('Please wait before sending another message')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/content/${slug}/private-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          name: name.trim() || null,
          email: email.trim() || null,
          anonId: getAnonId(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send')
        return
      }

      localStorage.setItem(cooldownKey, String(Date.now()))
      setSubmitted(true)
      setMessage('')
      setName('')
      setEmail('')
    } catch {
      setError('Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-4 p-3 bg-sandstone/10 border border-sandstone/20 rounded text-sm text-sandstone">
        Thanks for your feedback!
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-cream/30 hover:text-cream/50 transition-colors"
      >
        Have specific feedback? Tell us more...
      </button>
    )
  }

  const inputClass =
    'w-full bg-basalt border border-cream/10 rounded px-3 py-2 text-cream text-sm focus:border-sandstone focus:outline-none placeholder:text-cream/30'

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      {error && (
        <div className="text-red-300 text-xs">{error}</div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What could be better? (required)"
        className={`${inputClass} resize-y`}
        rows={3}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className={inputClass}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          type="email"
          className={inputClass}
        />
      </div>

      {/* Honeypot */}
      <input
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        className="absolute -left-[9999px]"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="flex items-center gap-3">
        <Button size="sm" type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Feedback'}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-cream/30 hover:text-cream/50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
