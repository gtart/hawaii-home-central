'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface AccessEntry {
  id: string
  userId: string
  name: string | null
  email: string | null
  image: string | null
  level: 'VIEW' | 'EDIT'
  createdAt: string
}

interface InviteEntry {
  id: string
  email: string
  level: 'VIEW' | 'EDIT'
  status: string
  token: string
  expiresAt: string
  createdAt: string
}

interface ShareToolModalProps {
  projectId: string
  toolKey: string
  onClose: () => void
}

const TOOL_LABELS: Record<string, string> = {
  before_you_sign: 'Contract Checklist',
  finish_decisions: 'Finish Selections',
  punchlist: 'Fix List',
  mood_boards: 'Mood Boards',
}

export function ShareToolModal({ projectId, toolKey, onClose }: ShareToolModalProps) {
  const [access, setAccess] = useState<AccessEntry[]>([])
  const [invites, setInvites] = useState<InviteEntry[]>([])
  const [editShareCount, setEditShareCount] = useState(0)
  const [maxEditShares, setMaxEditShares] = useState(3)
  const [isLoading, setIsLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [level, setLevel] = useState<'EDIT' | 'VIEW'>('EDIT')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [emailQueued, setEmailQueued] = useState(false)

  const toolLabel = TOOL_LABELS[toolKey] || toolKey

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tools/${toolKey}/share`)
      if (!res.ok) return
      const data = await res.json()
      setAccess(data.access)
      setInvites(data.invites)
      setEditShareCount(data.editShareCount)
      setMaxEditShares(data.maxEditShares)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [projectId, toolKey])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInvite = async () => {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tools/${toolKey}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, level }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send invite')
        return
      }

      const data = await res.json()
      setEmailQueued(!!data.emailQueued)
      // Copy invite link to clipboard
      const inviteUrl = `${window.location.origin}/invite/${data.invite.token}`
      try {
        await navigator.clipboard.writeText(inviteUrl)
        setCopiedToken(data.invite.token)
        setTimeout(() => { setCopiedToken(null); setEmailQueued(false) }, 4000)
      } catch {
        // fallback: select for manual copy
      }

      setEmail('')
      loadData()
    } catch {
      setError('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!confirm('Remove this person\'s access?')) return

    await fetch(`/api/projects/${projectId}/tools/${toolKey}/share`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadData()
  }

  const handleCancelInvite = async (inviteId: string) => {
    await fetch(`/api/projects/${projectId}/tools/${toolKey}/share`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    loadData()
  }

  const editSeatsUsed = editShareCount + invites.filter((i) => i.level === 'EDIT').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-cream">Share {toolLabel}</h2>
            <p className="text-xs text-cream/40 mt-0.5">
              You can invite up to {maxEditShares} collaborators · {editSeatsUsed} of {maxEditShares} used
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Invite form */}
          <div>
            <label className="block text-sm text-cream/70 mb-2">Invite by email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="name@example.com"
                className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
              />
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as 'EDIT' | 'VIEW')}
                className="bg-basalt border border-cream/20 rounded-lg px-2 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
              >
                <option value="EDIT">Can edit</option>
                <option value="VIEW">View only</option>
              </select>
              <button
                type="button"
                onClick={handleInvite}
                disabled={sending}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
              >
                {sending ? '...' : 'Invite'}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400 mt-1.5">{error}</p>
            )}
            {copiedToken && (
              <p className="text-sm text-emerald-400 mt-1.5">
                Invite link copied to clipboard{emailQueued ? ' · Email sent' : ''}
              </p>
            )}
          </div>

          {/* Current access */}
          {isLoading ? (
            <div className="text-sm text-cream/30 text-center py-4">Loading...</div>
          ) : (
            <>
              {access.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-2">
                    People with access
                  </h3>
                  <div className="space-y-1">
                    {access.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cream/5">
                        <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center text-xs text-cream/50 shrink-0">
                          {a.name?.charAt(0)?.toUpperCase() || a.email?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cream truncate">{a.name || a.email}</p>
                          {a.name && a.email && (
                            <p className="text-xs text-cream/40 truncate">{a.email}</p>
                          )}
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          a.level === 'EDIT' ? 'bg-sandstone/15 text-sandstone' : 'bg-cream/10 text-cream/50'
                        )}>
                          {a.level === 'EDIT' ? 'Can edit' : 'View only'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRevoke(a.userId)}
                          className="text-cream/30 hover:text-red-400 transition-colors"
                          title="Remove access"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invites.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-2">
                    Pending invites
                  </h3>
                  <div className="space-y-2">
                    {invites.map((inv) => {
                      const inviteUrl = typeof window !== 'undefined'
                        ? `${window.location.origin}/invite/${inv.token}`
                        : `/invite/${inv.token}`

                      return (
                        <div key={inv.id} className="rounded-lg bg-cream/[0.03] border border-cream/8 overflow-hidden">
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-8 h-8 rounded-full bg-cream/5 flex items-center justify-center text-xs text-cream/30 shrink-0">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-cream/60 truncate">{inv.email}</p>
                              <p className="text-xs text-cream/30">
                                Expires {new Date(inv.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              inv.level === 'EDIT' ? 'bg-sandstone/15 text-sandstone' : 'bg-cream/10 text-cream/50'
                            )}>
                              {inv.level === 'EDIT' ? 'Can edit' : 'View only'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCancelInvite(inv.id)}
                              className="text-cream/30 hover:text-red-400 transition-colors"
                              title="Cancel invite"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                              </svg>
                            </button>
                          </div>
                          {/* Persistent invite link */}
                          <div className="px-3 pb-2.5 flex items-center gap-2">
                            <p className="text-[11px] text-cream/30 truncate flex-1 font-mono select-all">{inviteUrl}</p>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(inviteUrl)
                                  setCopiedToken(inv.token)
                                  setTimeout(() => setCopiedToken(null), 2500)
                                } catch { /* ignore */ }
                              }}
                              className="text-[11px] px-2 py-0.5 bg-sandstone/10 text-sandstone rounded hover:bg-sandstone/20 transition-colors shrink-0"
                            >
                              {copiedToken === inv.token ? 'Copied!' : 'Copy link'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {access.length === 0 && invites.length === 0 && (
                <p className="text-sm text-cream/30 text-center py-3">
                  No one else has access yet
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
