'use client'

import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'

interface SignInPillProps {
  appToolPath: string
  label?: string
  toolName?: string
}

export function SignInPill({ appToolPath, label = 'Sign in to get started', toolName }: SignInPillProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="h-9 w-56 rounded-full bg-cream/5 animate-pulse" />
    )
  }

  if (session?.user) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-sandstone/20 bg-basalt-50 px-4 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sandstone" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-sm text-cream/50">
          Also available as an interactive tool
        </span>
        <span className="text-cream/20">&middot;</span>
        <Link
          href={appToolPath}
          className="text-sm text-sandstone hover:text-sandstone-light transition-colors font-medium"
        >
          {toolName ? `Open ${toolName}` : 'Open tool'} &rarr;
        </Link>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google', { callbackUrl: appToolPath })}
      className="inline-flex items-center gap-2.5 rounded-full border border-cream/15 bg-basalt-50 px-4 py-2 text-sm text-cream/60 hover:border-sandstone/40 hover:text-cream transition-colors cursor-pointer"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {label}
    </button>
  )
}
