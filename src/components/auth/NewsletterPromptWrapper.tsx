'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { NewsletterPrompt } from './NewsletterPrompt'

export function NewsletterPromptWrapper() {
  const { data: session, status } = useSession()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return

    fetch('/api/user/newsletter-prompt-status')
      .then((r) => r.json())
      .then((data) => {
        if (!data.hasSeenPrompt) setShowPrompt(true)
      })
      .catch(() => {})
  }, [status, session])

  if (!showPrompt) return null

  return <NewsletterPrompt onClose={() => setShowPrompt(false)} />
}
