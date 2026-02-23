'use client'

import { useState } from 'react'
import type { OptionV3, DecisionV3 } from '@/data/finish-decisions'

interface CommentPayload {
  text: string
  authorName: string
  authorEmail: string
  refOptionId?: string
  refOptionLabel?: string
}

interface Props {
  option: OptionV3
  decision: DecisionV3
  readOnly: boolean
  userEmail: string
  userName: string
  onUpdate: (updates: Partial<OptionV3>) => void
  onDelete: () => void
  onSelect: () => void
  onUpdateDecision: (updates: Partial<DecisionV3>) => void
  onAddComment: (comment: CommentPayload) => void
  onClose: () => void
}

export function IdeaCardModal({
  option,
  decision,
  readOnly,
  userEmail,
  userName,
  onUpdate,
  onDelete,
  onSelect,
  onUpdateDecision,
  onAddComment,
  onClose,
}: Props) {
  const [newUrl, setNewUrl] = useState('')
  const [commentText, setCommentText] = useState('')

  // ---- Derived state ----
  const votes = option.votes ?? {}
  const myVote = votes[userEmail]
  const upCount = Object.values(votes).filter((v) => v === 'up').length
  const downCount = Object.values(votes).filter((v) => v === 'down').length

  const myPick = decision.picksByUser?.[userEmail]
  const isMyPick = myPick === option.id
  const pickCount = Object.values(decision.picksByUser ?? {}).filter((v) => v === option.id).length

  // ---- Handlers ----
  function handleVote(dir: 'up' | 'down') {
    if (readOnly) return
    const current = votes[userEmail]
    const next = { ...votes }
    if (current === dir) {
      delete next[userEmail]
    } else {
      next[userEmail] = dir
    }
    onUpdate({ votes: next })
  }

  function handlePick() {
    if (readOnly) return
    const current = decision.picksByUser ?? {}
    const next = { ...current }
    if (isMyPick) {
      next[userEmail] = null
    } else {
      next[userEmail] = option.id
    }
    onUpdateDecision({ picksByUser: next })
  }

  function handleAddUrl() {
    if (!newUrl.trim()) return
    onUpdate({
      urls: [...option.urls, { id: crypto.randomUUID(), url: newUrl.trim() }],
    })
    setNewUrl('')
  }

  function handleRemoveUrl(urlId: string) {
    onUpdate({ urls: option.urls.filter((u) => u.id !== urlId) })
  }

  function handlePostComment() {
    if (!commentText.trim()) return
    onAddComment({
      text: commentText.trim(),
      authorName: userName,
      authorEmail: userEmail,
      refOptionId: option.id,
      refOptionLabel: option.name || 'Untitled idea',
    })
    setCommentText('')
  }

  function handleDelete() {
    if (confirm('Delete this idea?')) {
      onDelete()
      onClose()
    }
  }

  const isValidUrl = (url: string) => /^https?:\/\/.+/i.test(url)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet / Modal */}
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-5 py-4 flex items-center gap-3 z-10">
          <input
            type="text"
            value={option.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            readOnly={readOnly}
            placeholder="Idea name..."
            className="flex-1 bg-transparent text-cream text-base font-medium placeholder:text-cream/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* Image preview */}
          {option.kind === 'image' && option.imageUrl && (
            <div className="rounded-lg overflow-hidden bg-basalt">
              <img
                src={option.imageUrl}
                alt={option.name || 'Idea image'}
                className="w-full max-h-56 object-contain"
              />
            </div>
          )}

          {/* Notes */}
          {(!readOnly || option.notes) && (
            <div>
              <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
              <textarea
                value={option.notes}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                readOnly={readOnly}
                rows={3}
                placeholder="Specs, details, notes..."
                className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 resize-none"
              />
            </div>
          )}

          {/* URLs */}
          <div>
            <label className="block text-sm text-cream/70 mb-2">Links</label>
            {option.urls.length > 0 && (
              <div className="space-y-2 mb-2">
                {option.urls.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 bg-basalt px-3 py-2 rounded-lg">
                    <a
                      href={u.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sandstone hover:text-sandstone-light text-sm flex-1 truncate"
                    >
                      {u.url}
                    </a>
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveUrl(u.id)}
                        className="text-cream/40 hover:text-cream/70 text-xs shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                  placeholder="https://..."
                  className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!newUrl.trim() || !isValidUrl(newUrl)}
                  className="px-3 py-2 bg-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/20 transition-colors disabled:opacity-30"
                >
                  Add
                </button>
              </div>
            )}
            {newUrl && !isValidUrl(newUrl) && (
              <p className="text-yellow-500 text-xs mt-1">URL should start with http:// or https://</p>
            )}
          </div>

          {/* Actions: Final + Voting + Pick */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-cream/10">

            {/* Mark Final */}
            {!readOnly ? (
              <button
                type="button"
                onClick={onSelect}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  option.isSelected
                    ? 'bg-sandstone text-basalt'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20'
                }`}
              >
                {option.isSelected ? '✓ Final' : 'Mark Final'}
              </button>
            ) : option.isSelected ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-sandstone text-basalt">
                Final
              </span>
            ) : null}

            {/* Vote buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleVote('up')}
                disabled={readOnly}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                  myVote === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20 disabled:opacity-50'
                }`}
              >
                👍 {upCount > 0 && <span>{upCount}</span>}
              </button>
              <button
                type="button"
                onClick={() => handleVote('down')}
                disabled={readOnly}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                  myVote === 'down'
                    ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20 disabled:opacity-50'
                }`}
              >
                👎 {downCount > 0 && <span>{downCount}</span>}
              </button>
            </div>

            {/* My pick */}
            <button
              type="button"
              onClick={handlePick}
              disabled={readOnly}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                isMyPick
                  ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                  : 'bg-cream/10 text-cream/60 hover:bg-cream/20 disabled:opacity-50'
              }`}
            >
              ⭐ {isMyPick ? 'My pick' : 'Pick this'}
              {pickCount > 0 && (
                <span className="ml-0.5 text-cream/40">{pickCount}</span>
              )}
            </button>
          </div>

          {/* Comment on this idea */}
          {!readOnly && (
            <div className="pt-1 border-t border-cream/10">
              <label className="block text-xs text-cream/40 mb-2">Comment on this idea</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 400))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment() }}
                  placeholder="Add a comment referencing this idea..."
                  className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                />
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                  className="px-3 py-2 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors disabled:opacity-30"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Delete */}
          {!readOnly && (
            <div className="pt-1 border-t border-cream/10">
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-400/60 hover:text-red-400 text-sm transition-colors"
              >
                Delete idea
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
