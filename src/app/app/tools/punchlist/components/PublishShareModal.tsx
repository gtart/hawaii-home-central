'use client'

import { useState } from 'react'

interface Props {
  toolKey: string
  onClose: () => void
  onCreated: () => void
}

export function PublishShareModal({ toolKey, onClose, onCreated }: Props) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setError('')
    setCreating(true)

    try {
      const res = await fetch(`/api/tools/${toolKey}/share-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeNotes }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create link')
        return
      }

      const data = await res.json()
      const url = `${window.location.origin}/share/${toolKey}/${data.token}`
      setShareUrl(url)
      onCreated()
    } catch {
      setError('Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-cream/10 flex items-center justify-between">
          <h2 className="text-lg font-medium text-cream">Create Public Link</h2>
          <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {shareUrl ? (
            <>
              <div className="bg-basalt rounded-lg p-3">
                <p className="text-xs text-cream/40 mb-1">Public link</p>
                <p className="text-sm text-cream break-all">{shareUrl}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                includeNotes
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'bg-cream/5 text-cream/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${includeNotes ? 'bg-amber-400' : 'bg-cream/20'}`} />
                Additional Info: {includeNotes ? 'INCLUDED' : 'NOT INCLUDED'}
              </div>
            </>
          ) : (
            <>
              {/* Additional Information option */}
              <div>
                <p className="text-sm text-cream/70 mb-3">Include additional information in public view?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-cream/5"
                    style={{ borderColor: !includeNotes ? 'rgba(var(--sandstone-rgb, 196 164 132) / 0.4)' : 'rgba(var(--cream-rgb, 255 253 250) / 0.1)' }}
                  >
                    <input
                      type="radio"
                      name="includeNotes"
                      checked={!includeNotes}
                      onChange={() => setIncludeNotes(false)}
                      className="accent-sandstone"
                    />
                    <div>
                      <p className="text-sm text-cream">Do NOT include additional info</p>
                      <p className="text-xs text-cream/40">Safer for sharing with contractors</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-cream/5"
                    style={{ borderColor: includeNotes ? 'rgba(var(--sandstone-rgb, 196 164 132) / 0.4)' : 'rgba(var(--cream-rgb, 255 253 250) / 0.1)' }}
                  >
                    <input
                      type="radio"
                      name="includeNotes"
                      checked={includeNotes}
                      onChange={() => setIncludeNotes(true)}
                      className="accent-sandstone"
                    />
                    <div>
                      <p className="text-sm text-cream">Include additional info</p>
                      <p className="text-xs text-cream/40">Additional details will be visible to anyone with the link</p>
                    </div>
                  </label>
                </div>
              </div>

              {includeNotes && (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
                  <p className="text-amber-400 text-xs">
                    Additional information may contain private details. Make sure you&apos;re comfortable sharing them publicly.
                  </p>
                </div>
              )}

              {/* Confirmation */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 accent-sandstone"
                />
                <span className="text-sm text-cream/60">
                  I understand this creates a public link that anyone can view
                </span>
              </label>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="button"
                onClick={handleCreate}
                disabled={!confirmed || creating}
                className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Public Link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
