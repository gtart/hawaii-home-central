'use client'

import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const requireWhitelist = process.env.NEXT_PUBLIC_REQUIRE_WHITELIST === 'true'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/app'
  const error = searchParams.get('error')
  const { data: session } = useSession()
  const [redirectFailed, setRedirectFailed] = useState(false)

  // Whitelist mode state
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (session?.user && !error) {
      window.location.href = callbackUrl
      const timeout = setTimeout(() => setRedirectFailed(true), 3000)
      return () => clearTimeout(timeout)
    }
  }, [session, callbackUrl, error])

  // Redirect to guides after successful waitlist signup
  useEffect(() => {
    if (signedUp) {
      const timeout = setTimeout(() => {
        window.location.href = '/hawaii-home-renovation'
      }, 2500)
      return () => clearTimeout(timeout)
    }
  }, [signedUp])

  async function handleWhitelistSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setFormError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      // Check allowlist first
      const checkRes = await fetch(`/api/early-access/allowed?email=${encodeURIComponent(trimmed)}`)
      const checkData = await checkRes.json()

      if (checkData.allowed) {
        // Allowlisted — go straight to Google sign-in
        signIn('google', { callbackUrl })
        return
      }

      // Not allowlisted — sign them up for the waitlist
      const signupRes = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'FORM' }),
      })

      if (!signupRes.ok) {
        const data = await signupRes.json()
        setFormError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSignedUp(true)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // AccessDenied = non-allowlisted user tried to sign in via Google directly
  if (error === 'AccessDenied') {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
              Not Yet Available
            </h1>
            <p className="text-cream/70 leading-relaxed">
              We&apos;re in early beta, opening access in waves. Your email isn&apos;t on the list yet.
            </p>
          </div>
          <div className="bg-basalt-50 rounded-card p-6 text-center">
            <p className="text-cream/60 text-sm mb-4">
              Request early access and we&apos;ll invite you when the next wave opens.
            </p>
            <Link href="/waitlist">
              <Button variant="primary" size="lg" className="w-full">
                Request Early Access
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Other auth errors
  if (error) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
              Sign In
            </h1>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 rounded-input px-4 py-3 mb-6 text-sm text-red-300" role="alert">
            Something went wrong during sign-in. Please try again.
            <p className="mt-1 text-xs text-red-300/60">Error: {error}</p>
          </div>
          <Button
            onClick={() => signIn('google', { callbackUrl })}
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Try Again with Google
          </Button>
        </div>
      </div>
    )
  }

  // Already signed in
  if (session?.user) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-sm mx-auto text-center">
          {redirectFailed ? (
            <>
              <p className="text-cream/70 text-sm mb-4">
                Signed in successfully.
              </p>
              <Link
                href={callbackUrl}
                className="text-sandstone hover:text-sandstone-light transition-colors font-medium"
              >
                Continue to {callbackUrl === '/app' ? 'your tools' : callbackUrl} &rarr;
              </Link>
            </>
          ) : (
            <p className="text-cream/50 text-sm">Redirecting...</p>
          )}
        </div>
      </div>
    )
  }

  // Whitelist mode: single form — checks allowlist, or signs up for waitlist
  if (requireWhitelist) {
    // Success state — signed up, redirecting to guides
    if (signedUp) {
      return (
        <div className="pt-32 pb-24 px-6">
          <div className="max-w-sm mx-auto text-center">
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
              You&apos;re on the list!
            </h1>
            <p className="text-cream/70 leading-relaxed mb-6">
              We&apos;ll email you when the next access wave opens. In the meantime, check out our free guides.
            </p>
            <p className="text-cream/40 text-sm">Redirecting to guides...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
              We&apos;re in Early Beta
            </h1>
            <p className="text-cream/70 leading-relaxed">
              Request access and we&apos;ll invite you when the next wave opens.
            </p>
          </div>

          <form onSubmit={handleWhitelistSubmit} className="space-y-4">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (formError) setFormError('')
              }}
              placeholder="you@example.com"
              disabled={submitting}
              error={formError || undefined}
              aria-label="Email address"
            />
            <Button
              type="submit"
              disabled={submitting || !email.trim()}
              size="lg"
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Request Access'}
            </Button>
          </form>

          <div className="flex items-center gap-4 mt-8 mb-4">
            <div className="flex-1 h-px bg-cream/10" />
            <span className="text-sm text-cream/30">or</span>
            <div className="flex-1 h-px bg-cream/10" />
          </div>

          <p className="text-center text-sm text-cream/50">
            Already invited?{' '}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="text-sandstone hover:text-sandstone-light transition-colors font-medium"
            >
              Sign in with Google
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Normal public login
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
            Sign In
          </h1>
          <p className="text-cream/70 leading-relaxed">
            Sign in to run tools and save your progress across devices.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => signIn('google', { callbackUrl })}
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </div>

        <p className="text-xs text-cream/40 text-center mt-8 leading-relaxed">
          Your data is saved securely. We only use your email to identify your account.
        </p>
      </div>
    </div>
  )
}
