'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShareTokenEntry {
  id: string
  token: string
  boardId: string | null
  boardName: string | null
  createdAt: string
}

interface Props {
  boardId: string
  boardName: string
  isOwner: boolean
}

export function BoardShareLinks({ boardId, boardName, isOwner }: Props) {
  const [tokens, setTokens] = useState<ShareTokenEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/tools/mood_boards/share-token')
      if (!res.ok) return
      const data = await res.json()
      // Filter to tokens for this board only
      setTokens(
        (data.tokens as ShareTokenEntry[]).filter(
          (t) => t.boardId === boardId
        )
      )
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [boardId])

  useEffect(() => {
    if (isOwner) loadTokens()
    else setLoading(false)
  }, [isOwner, loadTokens])

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/tools/mood_boards/share-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNotes: false,
          boardId,
          boardName,
        }),
      })
      if (res.ok) {
        loadTokens()
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(tokenId: string) {
    if (!confirm('Revoke this public link? Anyone with it will no longer be able to view this board.')) return
    await fetch('/api/tools/mood_boards/share-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    })
    loadTokens()
  }

  async function handleCopy(token: ShareTokenEntry) {
    const url = `${window.location.origin}/share/mood_boards/${token.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(token.id)
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      // fallback
    }
  }

  if (!isOwner) return null

  return (
    <div className="bg-basalt-50 rounded-xl p-4 border border-cream/10 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-cream">Share this Board</h4>
        {tokens.length === 0 && !loading && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="text-xs px-3 py-1.5 bg-sandstone/10 text-sandstone rounded-full hover:bg-sandstone/20 transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Public Link'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-cream/30">Loading...</p>
      ) : tokens.length === 0 ? (
        <p className="text-xs text-cream/40">
          Create a public link to share a read-only view of this board with anyone.
        </p>
      ) : (
        <div className="space-y-3">
          {tokens.map((t) => {
            const url = typeof window !== 'undefined'
              ? `${window.location.origin}/share/mood_boards/${t.token}`
              : `/share/mood_boards/${t.token}`

            return (
              <div key={t.id} className="px-3 py-3 rounded-lg bg-basalt space-y-2">
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

          {/* Allow creating additional links */}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="text-xs text-sandstone/60 hover:text-sandstone transition-colors"
          >
            {creating ? 'Creating...' : '+ New Link'}
          </button>
        </div>
      )}
    </div>
  )
}
