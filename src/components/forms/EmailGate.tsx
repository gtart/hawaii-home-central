'use client'

import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'hhc_resources_unlocked_v1'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface EmailGateProps {
  children: React.ReactNode
  previewContent: React.ReactNode
}

export function EmailGate({ children, previewContent }: EmailGateProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const gateRef = useRef<HTMLDivElement>(null)
  const wasLockedRef = useRef(true)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setIsUnlocked(true)
      wasLockedRef.current = false
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isUnlocked && wasLockedRef.current && gateRef.current) {
      wasLockedRef.current = false
      requestAnimationFrame(() => {
        gateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [isUnlocked])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    localStorage.setItem(STORAGE_KEY, trimmed)
    setIsUnlocked(true)
  }

  if (!isLoaded) {
    return <>{previewContent}</>
  }

  if (isUnlocked) {
    return <div ref={gateRef}>{children}</div>
  }

  return (
    <>
      {previewContent}

      <div className="bg-basalt-50 rounded-card p-8 mt-12">
        <h2 className="font-serif text-2xl text-cream mb-3">
          Unlock the full tool
        </h2>
        <p className="text-cream/60 text-sm mb-6">
          Enter your email to access this tool and all future resources. No spam, no sales pitches&mdash;just useful tools for your project.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
          />
          <Button type="submit" size="lg" className="w-full">
            Unlock Resources
          </Button>
        </form>

        <p className="text-xs text-cream/40 mt-4">
          Your email stays between us. We&apos;ll only reach out with genuinely useful updates.
        </p>
      </div>
    </>
  )
}
