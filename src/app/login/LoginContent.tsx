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

  // Whitelist gate state
  const [checkEmail, setCheckEmail] = useState('')
  const [checking, setChecking] = useState(false)
  const [emailAllowed, setEmailAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (session?.user && !error) {
      window.location.href = callbackUrl
      const timeout = setTimeout(() => setRedirectFailed(true), 3000)
      return () => clearTimeout(timeout)
    }
  }, [session, callbackUrl, error])

  async function handleEmailCheck(e: FormEvent) {
    e.preventDefault()
    const trimmed = checkEmail.trim().toLowerCase()
    if (!trimmed || !EMAIL_RE.test(trimmed)) return

    setChecking(true)
    try {
      const res = await fetch(`/api/early-access/allowed?email=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      setEmailAllowed(data.allowed)
    } catch {
      setEmailAllowed(false)
    } finally {
      setChecking(false)
    }
  }

  // AccessDenied = non-allowlisted user tried to sign in via Google
  if (error === 'AccessDenied') {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
              Not Yet Available
            </h1>
            <p className="text-cream/70 leading-relaxed">
              Hawaii Home Central hasn&apos;t launched yet. Your email isn&apos;t on the early access list.
            </p>
          </div>
          <div className="bg-basalt-50 rounded-card p-6 text-center">
            <p className="text-cream/60 text-sm mb-4">
              Join the waitlist and we&apos;ll let you know when we launch.
            </p>
            <Link href="/early-access">
              <Button variant="primary" size="lg" className="w-full">
                Join the Waitlist
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

  // Whitelist mode: gate Google button behind email check
  if (requireWhitelist) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
              Early Access
            </h1>
            <p className="text-cream/70 leading-relaxed">
              Hawaii Home Central hasn&apos;t launched yet. If you have early access, enter your email to sign in.
            </p>
          </div>

          {emailAllowed === null && (
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <Input
                type="email"
                required
                value={checkEmail}
                onChange={(e) => {
                  setCheckEmail(e.target.value)
                  setEmailAllowed(null)
                }}
                placeholder="you@gmail.com"
                disabled={checking}
                aria-label="Google email address"
              />
              <Button
                type="submit"
                disabled={checking || !checkEmail.trim()}
                size="lg"
                className="w-full"
              >
                {checking ? 'Checking...' : 'Check Access'}
              </Button>
            </form>
          )}

          {emailAllowed === true && (
            <div className="space-y-4">
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-input px-4 py-3 text-sm text-emerald-300 text-center">
                You&apos;re on the list. Sign in below.
              </div>
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
          )}

          {emailAllowed === false && (
            <div className="space-y-4">
              <div className="bg-basalt-50 rounded-card p-6 text-center">
                <p className="text-cream/60 text-sm mb-1">
                  That email isn&apos;t on the early access list yet.
                </p>
                <p className="text-cream/40 text-xs mb-4">
                  Join the waitlist and we&apos;ll notify you when we launch.
                </p>
                <Link href="/early-access">
                  <Button variant="primary" className="w-full">
                    Join the Waitlist
                  </Button>
                </Link>
              </div>
              <button
                type="button"
                onClick={() => { setEmailAllowed(null); setCheckEmail('') }}
                className="text-xs text-cream/40 hover:text-cream/60 transition-colors w-full text-center"
              >
                Try a different email
              </button>
            </div>
          )}

          <p className="text-xs text-cream/40 text-center mt-8 leading-relaxed">
            Your data is saved securely. We only use your email to identify your account.
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
