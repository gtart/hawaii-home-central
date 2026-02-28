'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShareTokenEntry {
  id: string
  token: string
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
  includeSourceUrl?: boolean
  locations?: string[]
  assignees?: string[]
  statuses?: string[]
  boardId?: string | null
  boardName?: string | null
  scope?: { mode?: string; roomIds?: string[]; roomLabels?: string[]; boardIds?: string[]; boardLabels?: string[] } | null
  createdAt: string
  expiresAt: string | null
}

interface Props {
  toolKey: string
  projectId: string
  /** Render tool-specific badges for a token row */
  renderBadges?: (token: ShareTokenEntry) => React.ReactNode
}

export type { ShareTokenEntry }

export function ManageShareLinks({ toolKey, projectId, renderBadges }: Props) {
  const [tokens, setTokens] = useState<ShareTokenEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/${toolKey}/share-token?projectId=${projectId}`)
      if (!res.ok) return
      const data = await res.json()
      setTokens(data.tokens)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [toolKey, projectId])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  // Re-fetch when a new token is created (ShareExportModal dispatches this event)
  useEffect(() => {
    const handler = () => loadTokens()
    window.addEventListener('share-token-created', handler)
    return () => window.removeEventListener('share-token-created', handler)
  }, [loadTokens])

  async function handleRevoke(tokenId: string) {
    if (!confirm('Revoke this public link? Anyone with it will no longer be able to view.')) return
    await fetch(`/api/tools/${toolKey}/share-token?projectId=${projectId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    })
    loadTokens()
  }

  async function handleCopy(token: ShareTokenEntry) {
    const url = `${window.location.origin}/share/${toolKey}/${token.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(token.id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      // fallback
    }
  }

  if (loading) {
    return <p className="text-xs text-cream/30">Loading links...</p>
  }

  if (tokens.length === 0) {
    return (
      <p className="text-xs text-cream/40">
        No public links yet. Create one to share a read-only view.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {tokens.map((t) => {
        const url = typeof window !== 'undefined'
          ? `${window.location.origin}/share/${toolKey}/${t.token}`
          : `/share/${toolKey}/${t.token}`

        return (
          <div key={t.id} className="px-3 py-3 rounded-lg bg-basalt space-y-2">
            {/* URL row */}
            <div className="flex items-center gap-2">
              <p className="text-xs text-cream/50 truncate flex-1 font-mono">{url}</p>
              <button
                type="button"
                onClick={() => handleCopy(t)}
                className="text-xs px-2 py-0.5 bg-sandstone/10 text-sandstone rounded hover:bg-sandstone/20 transition-colors shrink-0"
              >
                {copiedId === t.id ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Badges row — generic defaults + tool-specific via renderBadges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                t.includeNotes ? 'bg-amber-400/15 text-amber-400' : 'bg-cream/10 text-cream/40'
              }`}>
                Notes: {t.includeNotes ? 'Yes' : 'No'}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cream/10 text-cream/40">
                Photos: {t.includePhotos ? 'Yes' : 'No'}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cream/10 text-cream/40">
                Comments: {t.includeComments ? 'Yes' : 'No'}
              </span>
              {renderBadges?.(t)}
            </div>

            {/* Scope label */}
            {t.scope?.mode === 'selected' && (
              <div className="text-[10px] px-1.5 py-0.5 rounded bg-cream/5 text-cream/30 inline-block">
                Scoped: {(t.scope.roomLabels || t.scope.boardLabels || []).join(', ') || 'selected items'}
              </div>
            )}

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-cream/30">
                Created {new Date(t.createdAt).toLocaleDateString()}
                {t.expiresAt && (
                  <>
                    {' · '}
                    {new Date(t.expiresAt) < new Date() ? (
                      <span className="text-red-400">Expired</span>
                    ) : (
                      <>Expires {new Date(t.expiresAt).toLocaleDateString()}</>
                    )}
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleRevoke(t.id)}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
