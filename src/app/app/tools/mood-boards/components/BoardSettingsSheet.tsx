'use client'

import { useState } from 'react'
import type { Board, BoardAccess, BoardAccessLevel } from '@/data/mood-boards'

interface Props {
  board: Board
  /** Emails of people who already have tool-level access (candidates for board access) */
  toolMembers: string[]
  currentUserEmail: string
  onUpdate: (visibility: 'everyone' | 'invite-only', access: BoardAccess[]) => void
  onClose: () => void
}

export function BoardSettingsSheet({
  board,
  toolMembers,
  currentUserEmail,
  onUpdate,
  onClose,
}: Props) {
  const [visibility, setVisibility] = useState<'everyone' | 'invite-only'>(
    board.visibility || 'everyone'
  )
  const [accessList, setAccessList] = useState<BoardAccess[]>(
    board.access || []
  )
  const [addEmail, setAddEmail] = useState('')

  const isCreator = board.createdBy === currentUserEmail

  // Filter tool members to those not already in the access list and not the creator
  const availableMembers = toolMembers.filter(
    (email) =>
      email !== currentUserEmail &&
      email !== board.createdBy &&
      !accessList.some((a) => a.email === email)
  )

  function handleAddMember(email: string) {
    if (!email.trim() || accessList.some((a) => a.email === email)) return
    setAccessList((prev) => [...prev, { email: email.trim(), level: 'view' }])
    setAddEmail('')
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
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

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
            <p className="text-sm text-cream/70 mb-3">Who can see this board?</p>
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
                  <p className="text-sm text-cream">Everyone with tool access</p>
                  <p className="text-xs text-cream/40">
                    Anyone invited to Mood Boards can see this board
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
                  <p className="text-sm text-cream">Only people I choose</p>
                  <p className="text-xs text-cream/40">
                    People with Mood Boards access who aren&apos;t listed won&apos;t see this board
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Access list — only shown in invite-only mode */}
          {visibility === 'invite-only' && (
            <div>
              <p className="text-sm text-cream/70 mb-3">People with access</p>

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
              {availableMembers.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs text-cream/30 mb-1.5">Add from tool members</p>
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
              ) : (
                <p className="text-xs text-cream/30 mt-3">
                  All tool members have been added. Invite more people to Mood Boards first.
                </p>
              )}
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
