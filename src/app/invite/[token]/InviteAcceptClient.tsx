'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TOOL_LABELS, TOOL_PATHS } from '@/lib/tool-registry'

interface InviteDetails {
  projectName: string
  toolKey: string
  level: 'VIEW' | 'EDIT'
  invitedBy: string
  email: string
  expiresAt: string
}

export function InviteAcceptClient() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invites/${token}`)
      if (!res.ok) {
        const data = await res.json()
        // If invite was already accepted (e.g. user pressed Back), show success state
        if (res.status === 410 && data.status === 'ACCEPTED') {
          setAccepted(true)
          return
        }
        setError(data.error || 'Invalid invite')
        return
      }
      setInvite(await res.json())
    }
    load()
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    setError('')

    const res = await fetch(`/api/invites/${token}`, { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 401) {
        // Not signed in — redirect to login, then back here
        router.push(`/login?callbackUrl=/invite/${token}`)
        return
      }
      setError(data.error || 'Failed to accept invite')
      setAccepting(false)
      return
    }

    setAccepted(true)
    // Switch to the shared project and redirect to the tool
    await fetch('/api/projects/current', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: data.projectId }),
    })

    const toolPath = TOOL_PATHS[data.toolKey] || '/app'
    setTimeout(() => router.replace(toolPath), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {error && !invite ? (
          <div className="bg-basalt-50 border border-cream/10 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-xl font-medium text-cream mb-2">Invite Not Available</h1>
            <p className="text-cream/50 text-sm mb-6">{error}</p>
            <Link href="/app" className="text-sandstone hover:text-sandstone-light text-sm">
              Go to Home Project Tools
            </Link>
          </div>
        ) : !invite ? (
          <div className="text-center text-cream/30 text-sm">Loading invite...</div>
        ) : accepted ? (
          <div className="bg-basalt-50 border border-cream/10 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl font-medium text-cream mb-2">You&apos;re in!</h1>
            {invite ? (
              <p className="text-cream/50 text-sm">Redirecting to {TOOL_LABELS[invite.toolKey] || 'the tool'}...</p>
            ) : (
              <Link href="/app" className="text-sandstone hover:text-sandstone-light text-sm">
                Go to Home Project Tools
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-basalt-50 border border-cream/10 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-sandstone/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" />
                  <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-xl font-medium text-cream mb-1">You&apos;ve been invited</h1>
              <p className="text-cream/50 text-sm">
                {invite.invitedBy} invited you to collaborate on {TOOL_LABELS[invite.toolKey] || 'a tool'}
              </p>
            </div>

            <div className="bg-basalt rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cream/40">Project</span>
                <span className="text-cream">{invite.projectName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/40">Tool</span>
                <span className="text-cream">{TOOL_LABELS[invite.toolKey] || invite.toolKey}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/40">Access</span>
                <span className="text-cream">
                  {invite.level === 'EDIT' ? 'Can edit' : 'View only'}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 mb-4 text-center">{error}</p>
            )}

            <button
              type="button"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
            >
              {accepting ? 'Accepting...' : 'Accept Invite'}
            </button>

            <p className="text-xs text-cream/30 text-center mt-4">
              This invite was sent to {invite.email}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
