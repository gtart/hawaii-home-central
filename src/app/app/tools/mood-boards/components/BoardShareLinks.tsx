'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShareTokenEntry {
  id: string
  token: string
  boardId: string | null
  boardName: string | null
  includePhotos: boolean
  includeComments: boolean
  includeNotes: boolean
  includeSourceUrl: boolean
  createdAt: string
}

interface Props {
  boardId: string
  boardName: string
  projectId: string
  isOwner: boolean
}

const FLAG_LABELS: { key: keyof ShareFlags; label: string }[] = [
  { key: 'includePhotos', label: 'Photos' },
  { key: 'includeNotes', label: 'Notes' },
  { key: 'includeComments', label: 'Comments' },
  { key: 'includeSourceUrl', label: 'Source URLs' },
]

interface ShareFlags {
  includePhotos: boolean
  includeNotes: boolean
  includeComments: boolean
  includeSourceUrl: boolean
}

function flagSummary(t: ShareTokenEntry): string {
  const parts: string[] = []
  if (t.includePhotos) parts.push('Photos')
  if (t.includeNotes) parts.push('Notes')
  if (t.includeComments) parts.push('Comments')
  if (t.includeSourceUrl) parts.push('Source URLs')
  return parts.length > 0 ? parts.join(' + ') : 'Names & tags only'
}

export function BoardShareLinks({ boardId, boardName, projectId, isOwner }: Props) {
  const [tokens, setTokens] = useState<ShareTokenEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [flags, setFlags] = useState<ShareFlags>({
    includePhotos: true,
    includeNotes: false,
    includeComments: false,
    includeSourceUrl: false,
  })

  const loadTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/tools/mood_boards/share-token?projectId=${projectId}`)
      if (!res.ok) return
      const data = await res.json()
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
  }, [boardId, projectId])

  useEffect(() => {
    if (isOwner) loadTokens()
    else setLoading(false)
  }, [isOwner, loadTokens])

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch(`/api/tools/mood_boards/share-token?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flags,
          boardId,
          boardName,
        }),
      })
      if (res.ok) {
        setShowForm(false)
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
    await fetch(`/api/tools/mood_boards/share-token?projectId=${projectId}`, {
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
        {!showForm && !loading && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs px-3 py-1.5 bg-sandstone/10 text-sandstone rounded-full hover:bg-sandstone/20 transition-colors"
          >
            {tokens.length === 0 ? 'Create Public Link' : '+ New Link'}
          </button>
        )}
      </div>

      {/* Create link form */}
      {showForm && (
        <div className="mb-4 p-3 rounded-lg bg-basalt border border-cream/10 space-y-3">
          <p className="text-xs text-cream/50">Choose what to include in the public link:</p>
          <div className="space-y-2">
            {FLAG_LABELS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={() => setFlags((f) => ({ ...f, [key]: !f[key] }))}
                  className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5"
                />
                <span className="text-xs text-cream/70">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="text-xs px-3 py-1.5 bg-sandstone text-basalt rounded-md hover:bg-sandstone-light transition-colors disabled:opacity-50 font-medium"
            >
              {creating ? 'Creating...' : 'Create Link'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 text-cream/40 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-cream/30">Loading...</p>
      ) : tokens.length === 0 && !showForm ? (
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
                    {flagSummary(t)}{' · '}
                    {new Date(t.createdAt).toLocaleDateString()}
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
    </div>
  )
}
