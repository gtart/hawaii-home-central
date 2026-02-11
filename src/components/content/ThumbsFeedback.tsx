'use client'

import { useState, useEffect } from 'react'

interface ThumbsFeedbackProps {
  contentId: string
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

export function ThumbsFeedback({ contentId, slug }: ThumbsFeedbackProps) {
  const [vote, setVote] = useState<'UP' | 'DOWN' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`feedback-${contentId}`)
    if (stored === 'UP' || stored === 'DOWN') {
      setVote(stored)
    }
  }, [contentId])

  const handleVote = async (newVote: 'UP' | 'DOWN') => {
    if (submitting) return
    setSubmitting(true)

    const anonId = getAnonId()

    try {
      const res = await fetch(`/api/content/${slug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: newVote, anonId }),
      })

      if (res.ok) {
        setVote(newVote)
        localStorage.setItem(`feedback-${contentId}`, newVote)
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 mt-8 pt-4 border-t border-cream/10">
      <span className="text-sm text-cream/50">Was this helpful?</span>
      <button
        type="button"
        onClick={() => handleVote('UP')}
        disabled={submitting}
        className={`text-lg transition-colors ${
          vote === 'UP'
            ? 'text-sandstone'
            : 'text-cream/30 hover:text-cream/60'
        }`}
        aria-label="Thumbs up"
      >
        &#128077;
      </button>
      <button
        type="button"
        onClick={() => handleVote('DOWN')}
        disabled={submitting}
        className={`text-lg transition-colors ${
          vote === 'DOWN'
            ? 'text-red-400'
            : 'text-cream/30 hover:text-cream/60'
        }`}
        aria-label="Thumbs down"
      >
        &#128078;
      </button>
    </div>
  )
}
