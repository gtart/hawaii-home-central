'use client'

import { useState, useEffect, useCallback } from 'react'
import { PublishShareModal } from './PublishShareModal'

interface ShareTokenEntry {
  id: string
  token: string
  includeNotes: boolean
  locations: string[]
  assignees: string[]
  createdAt: string
}

interface Props {
  toolKey: string
  locations: string[]
  assignees: string[]
}

export function ManageShareLinks({ toolKey, locations, assignees }: Props) {
  const [tokens, setTokens] = useState<ShareTokenEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/${toolKey}/share-token`)
      if (!res.ok) return
      const data = await res.json()
      setTokens(data.tokens)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [toolKey])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  async function handleRevoke(tokenId: string) {
    if (!confirm('Revoke this public link? Anyone with it will no longer be able to view your fix list.')) return

    await fetch(`/api/tools/${toolKey}/share-token`, {
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

  return (
    <div className="bg-basalt-50 rounded-card p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-cream">Public Links</h3>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="text-xs px-3 py-1.5 bg-sandstone/10 text-sandstone rounded-full hover:bg-sandstone/20 transition-colors"
        >
          + New Link
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-cream/30">Loading...</p>
      ) : tokens.length === 0 ? (
        <p className="text-xs text-cream/40">
          No public links. Create one to share a read-only view.
        </p>
      ) : (
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

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Notes badge */}
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    t.includeNotes
                      ? 'bg-amber-400/15 text-amber-400'
                      : 'bg-cream/10 text-cream/40'
                  }`}>
                    {t.includeNotes
                      ? 'Private notes visible to viewer'
                      : 'Private notes hidden from viewer'}
                  </span>

                  {/* Filter pills */}
                  {t.locations.length === 0 && t.assignees.length === 0 ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cream/5 text-cream/30">
                      Full list — no filters
                    </span>
                  ) : (
                    <>
                      {t.locations.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cream/10 text-cream/50">
                          📍 {t.locations.join(' · ')}
                        </span>
                      )}
                      {t.assignees.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cream/10 text-cream/50">
                          👤 {t.assignees.join(' · ')}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Bottom row: timestamp + revoke */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cream/30">
                    {new Date(t.createdAt).toLocaleDateString()}{' '}
                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      )}

      {showCreate && (
        <PublishShareModal
          toolKey={toolKey}
          locations={locations}
          assignees={assignees}
          onClose={() => setShowCreate(false)}
          onCreated={() => loadTokens()}
        />
      )}
    </div>
  )
}
