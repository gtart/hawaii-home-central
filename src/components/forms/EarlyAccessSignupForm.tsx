'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EarlyAccessSignupForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const hasRegisteredGoogle = useRef(false)

  // Auto-register Google signups on redirect back
  useEffect(() => {
    if (
      searchParams.get('source') === 'google' &&
      session?.user?.email &&
      status === 'idle' &&
      !hasRegisteredGoogle.current
    ) {
      hasRegisteredGoogle.current = true
      registerSignup({
        email: session.user.email,
        source: 'GOOGLE',
        name: session.user.name ?? undefined,
        userId: (session.user as { id?: string }).id ?? undefined,
      })
    }
  }, [session, searchParams, status])

  async function registerSignup(payload: {
    email: string
    source: 'FORM' | 'GOOGLE'
    name?: string
    userId?: string
  }) {
    setStatus('submitting')
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setStatus('error')
        setErrorMessage(data.error || 'Something went wrong.')
        return
      }
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    const trimmed = email.trim()
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    await registerSignup({ email: trimmed, source: 'FORM' })
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <h3 className="font-serif text-2xl text-sandstone mb-3">
          You&apos;re on the list!
        </h3>
        <p className="text-cream/70 leading-relaxed">
          Mahalo! We&apos;ll email you when Hawaii Home Central officially
          launches. In the meantime, feel free to sign in with Google to
          preview what we&apos;re building.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-xl text-sandstone text-center">
        Join the waitlist!
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          placeholder="you@example.com"
          error={status === 'error' ? errorMessage : undefined}
          disabled={status === 'submitting'}
          aria-label="Email address"
        />
        <Button type="submit" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Joining...' : 'Submit'}
        </Button>
      </form>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-cream/10" />
        <span className="text-sm text-cream/30">or</span>
        <div className="flex-1 h-px bg-cream/10" />
      </div>

      <Button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/early-access?source=google' })}
        variant="secondary"
        className="w-full flex items-center justify-center gap-3"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in if you already have access
      </Button>

      <p className="text-xs text-cream/50 text-center">
        The site is in beta and actively changing. Your patience is appreciated as we build.
      </p>
    </div>
  )
}
