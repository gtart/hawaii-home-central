'use client'

import { useState, useEffect } from 'react'
import type { Board, BoardAccess, BoardAccessLevel } from '@/data/mood-boards'

interface Props {
  board: Board
  /** Emails of people who already have tool-level access (candidates for board access) */
  toolMembers: string[]
  currentUserEmail: string
  projectId: string
  isOwner: boolean
  onUpdate: (visibility: 'everyone' | 'invite-only', access: BoardAccess[]) => void
  onClose: () => void
  /** Open the tool-level invite modal (ShareToolModal) */
  onOpenInvite: () => void
  /** Open Share & Export modal with this board pre-selected */
  onManagePublicLinks: () => void
  /** Number of active public links for this board */
  publicLinkCount: number
}

export function BoardSettingsSheet({
  board,
  toolMembers,
  currentUserEmail,
  projectId,
  isOwner,
  onUpdate,
  onClose,
  onOpenInvite,
  onManagePublicLinks,
  publicLinkCount,
}: Props) {
  const [visibility, setVisibility] = useState<'everyone' | 'invite-only'>(
    board.visibility || 'everyone'
  )
  const [accessList, setAccessList] = useState<BoardAccess[]>(
    board.access || []
  )

  // Tool members who are NOT the current user and NOT the board creator
  const otherMembers = toolMembers.filter(
    (email) => email !== currentUserEmail && email !== board.createdBy
  )
  const hasCollaborators = otherMembers.length > 0

  // Members available to add to the allowlist (not already in access list)
  const availableMembers = otherMembers.filter(
    (email) => !accessList.some((a) => a.email === email)
  )

  // Lock body scroll + ESC to close
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  function handleAddMember(email: string) {
    if (!email.trim() || accessList.some((a) => a.email === email)) return
    setAccessList((prev) => [...prev, { email: email.trim(), level: 'view' }])
  }

  function handleRemoveMember(email: string) {
    setAccessList((prev) => prev.filter((a) => a.email !== email))
  }

  function handleChangeLevel(email: string, level: BoardAccessLevel) {
    setAccessList((prev) =>
      prev.map((a) => (a.email === email ? { ...a, level } : a))
    )
  }

  function handleSave() {
    onUpdate(visibility, visibility === 'invite-only' ? accessList : [])
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet — right panel on desktop, bottom sheet on mobile */}
      <div className="fixed z-50 inset-x-0 bottom-0 sm:inset-y-0 sm:inset-x-auto sm:right-0 sm:w-96 bg-basalt-50 border-t sm:border-t-0 sm:border-l border-cream/10 flex flex-col max-h-[80vh] sm:max-h-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream/10 shrink-0">
          <h3 className="text-base font-medium text-cream">Board Settings</h3>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Board name */}
          <div>
            <p className="text-xs text-cream/40 mb-1">Board</p>
            <p className="text-sm text-cream font-medium">{board.name}</p>
            {board.createdBy && (
              <p className="text-[11px] text-cream/30 mt-0.5">
                Created by {board.createdBy === currentUserEmail ? 'you' : board.createdBy}
              </p>
            )}
          </div>

          {/* Visibility toggle */}
          <div>
            <p className="text-sm text-cream/70 mb-3">Visibility</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'everyone'}
                  onChange={() => setVisibility('everyone')}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">Shared with collaborators</p>
                  <p className="text-xs text-cream/40">
                    Anyone you&apos;ve invited to Mood Boards can see this board.
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'invite-only'}
                  onChange={() => setVisibility('invite-only')}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">Private board</p>
                  <p className="text-xs text-cream/40">
                    Only you can see it (unless you add exceptions).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Collaborator state — shown for both visibility modes */}
          {!hasCollaborators ? (
            <div className="bg-basalt rounded-lg px-4 py-3">
              <p className="text-sm text-cream/50 mb-2">No collaborators yet.</p>
              <p className="text-xs text-cream/30 mb-3">
                Invited people can view all boards unless a board is marked Private.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenInvite()
                }}
                className="text-xs px-3 py-1.5 bg-sandstone/10 text-sandstone rounded-lg hover:bg-sandstone/20 transition-colors font-medium inline-flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" strokeLinecap="round" />
                  <line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round" />
                </svg>
                Invite someone
              </button>
            </div>
          ) : visibility === 'invite-only' ? (
            /* Access list — only shown in private mode when collaborators exist */
            <div>
              <p className="text-sm text-cream/70 mb-3">Exceptions (can still see this board)</p>

              {/* Creator (always has access) */}
              {board.createdBy && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-basalt mb-2">
                  <span className="flex-1 text-sm text-cream/60 truncate">
                    {board.createdBy === currentUserEmail ? 'You (creator)' : board.createdBy}
                  </span>
                  <span className="text-xs text-cream/30 px-2 py-0.5 rounded bg-cream/5">
                    edit
                  </span>
                </div>
              )}

              {/* Access list entries */}
              {accessList.map((entry) => (
                <div key={entry.email} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-basalt mb-2">
                  <span className="flex-1 text-sm text-cream/60 truncate">{entry.email}</span>
                  <select
                    value={entry.level}
                    onChange={(e) => handleChangeLevel(entry.email, e.target.value as BoardAccessLevel)}
                    className="text-xs bg-basalt-50 border border-cream/15 text-cream/60 rounded px-2 py-0.5"
                  >
                    <option value="view">view</option>
                    <option value="edit">edit</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(entry.email)}
                    className="text-cream/30 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add member */}
              {availableMembers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-cream/30 mb-1.5">Add from collaborators</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableMembers.map((email) => (
                      <button
                        key={email}
                        type="button"
                        onClick={() => handleAddMember(email)}
                        className="text-xs px-2.5 py-1 rounded-full border border-cream/15 text-cream/50 hover:border-sandstone/40 hover:text-sandstone transition-colors"
                      >
                        + {email}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Shared mode: simple confirmation */
            <div className="bg-basalt rounded-lg px-4 py-3">
              <p className="text-xs text-cream/40">
                {otherMembers.length} collaborator{otherMembers.length !== 1 ? 's' : ''} can see this board.
              </p>
            </div>
          )}

          {/* Public links — compact status + manage button (owners only) */}
          {isOwner && projectId && (
            <div className="border-t border-cream/10 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cream/70">Public links</p>
                  <p className="text-xs text-cream/40 mt-0.5">
                    {publicLinkCount > 0
                      ? `${publicLinkCount} active link${publicLinkCount !== 1 ? 's' : ''}`
                      : 'None'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onManagePublicLinks()
                  }}
                  className="text-xs px-3 py-1.5 bg-sandstone/10 text-sandstone rounded-lg hover:bg-sandstone/20 transition-colors font-medium"
                >
                  Manage public links
                </button>
              </div>
              <p className="text-[10px] text-cream/25 mt-2">
                Public links are read-only and expire after 14 days.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-cream/10 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            Save Settings
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-cream/60 hover:text-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
