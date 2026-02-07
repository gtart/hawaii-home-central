'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface PreviewGateProps {
  previewContent: React.ReactNode
  appToolPath: string
}

export function PreviewGate({ previewContent, appToolPath }: PreviewGateProps) {
  const { data: session, status } = useSession()
  const [hadEmailGate, setHadEmailGate] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('hhc_resources_unlocked_v1')) {
      setHadEmailGate(true)
    }
  }, [])

  return (
    <>
      {previewContent}

      <div className="bg-basalt-50 rounded-card p-8 mt-8">
        {status === 'loading' ? (
          <div className="h-24 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
          </div>
        ) : session?.user ? (
          // Authenticated: link to tool
          <div className="text-center">
            <p className="text-cream/70 text-sm mb-4">
              You&apos;re signed in. Your progress is saved to your account.
            </p>
            <Link href={appToolPath}>
              <Button size="lg" className="w-full sm:w-auto">
                Continue to tool &rarr;
              </Button>
            </Link>
          </div>
        ) : (
          // Not authenticated: sign-in CTA
          <>
            {hadEmailGate && (
              <p className="text-sandstone/80 text-sm mb-4">
                You&apos;ve been using this tool &mdash; sign in to save your progress to the cloud.
              </p>
            )}
            <h2 className="font-serif text-2xl text-cream mb-3">
              Run this tool
            </h2>
            <p className="text-cream/60 text-sm mb-6">
              Sign in to use this tool and save your progress across devices. No spam, no sales pitches.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => signIn('google', { callbackUrl: appToolPath })}
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </div>
            <p className="text-xs text-cream/40 mt-4">
              Your data is saved securely. We only use your email to identify your account.
            </p>
          </>
        )}
      </div>
    </>
  )
}
