'use client'

import { useState, useEffect, useCallback } from 'react'
import { PublishShareModal } from './PublishShareModal'

interface ShareTokenEntry {
  id: string
  token: string
  includeNotes: boolean
  createdAt: string
}

interface Props {
  toolKey: string
}

export function ManageShareLinks({ toolKey }: Props) {
  const [tokens, setTokens] = useState<ShareTokenEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

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
    if (!confirm('Revoke this public link? Anyone with it will no longer be able to view your punchlist.')) return

    await fetch(`/api/tools/${toolKey}/share-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    })
    loadTokens()
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
        <div className="space-y-2">
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-basalt">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    t.includeNotes
                      ? 'bg-amber-400/15 text-amber-400'
                      : 'bg-cream/10 text-cream/40'
                  }`}>
                    {t.includeNotes ? 'Notes included' : 'No notes'}
                  </span>
                  <span className="text-xs text-cream/30">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(t.id)}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-3"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <PublishShareModal
          toolKey={toolKey}
          onClose={() => setShowCreate(false)}
          onCreated={() => loadTokens()}
        />
      )}
    </div>
  )
}
