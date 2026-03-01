'use client'

import { useState, useEffect } from 'react'
import type { Board, BoardAccess, BoardAccessLevel } from '@/data/mood-boards'

interface ToolMember {
  email: string
  name: string | null
  image: string | null
}

interface Props {
  board: Board
  toolMembers: ToolMember[]
  currentUserEmail: string
  currentUserName: string | null
  projectId: string
  isOwner: boolean
  onUpdate: (visibility: 'everyone' | 'invite-only', access: BoardAccess[]) => void
  onClose: () => void
  /** Open Share & Export modal with this board pre-selected */
  onManagePublicLinks: () => void
  /** Number of active public links for this board */
  publicLinkCount: number
}

function AvatarCircle({ name, email }: { name: string | null; email: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase()

  return (
    <span
      className="w-7 h-7 rounded-full bg-cream/10 flex items-center justify-center text-[11px] font-medium text-cream/60 shrink-0"
      title={name || email}
    >
      {initials}
    </span>
  )
}

export function BoardSettingsSheet({
  board,
  toolMembers,
  currentUserEmail,
  currentUserName,
  projectId,
  isOwner,
  onUpdate,
  onClose,
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
    (m) => m.email !== currentUserEmail && m.email !== board.createdBy
  )

  // Members visible in "Shared with" row — depends on visibility mode
  const visibleMembers = visibility === 'everyone'
    ? otherMembers
    : otherMembers.filter(m => accessList.some(a => a.email === m.email))

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

          {/* Shared with — avatar row */}
          <div>
            <p className="text-xs text-cream/40 mb-2">Shared with</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <AvatarCircle name={currentUserName} email={currentUserEmail} />
              {visibleMembers.map((m) => (
                <AvatarCircle key={m.email} name={m.name} email={m.email} />
              ))}
              {visibleMembers.length === 0 && (
                <span className="text-xs text-cream/30">(Only you)</span>
              )}
            </div>
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
                    Only you can see it (unless you add exceptions below).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Private allowlist — checkbox rows for each tool member */}
          {visibility === 'invite-only' && otherMembers.length > 0 && (
            <div>
              <p className="text-sm text-cream/70 mb-3">Allow access to this board</p>
              <div className="space-y-1">
                {otherMembers.map((m) => {
                  const entry = accessList.find(a => a.email === m.email)
                  const isAllowed = !!entry
                  return (
                    <label
                      key={m.email}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cream/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={() =>
                          isAllowed ? handleRemoveMember(m.email) : handleAddMember(m.email)
                        }
                        className="accent-sandstone"
                      />
                      <AvatarCircle name={m.name} email={m.email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cream/60 truncate">{m.name || m.email}</p>
                        {m.name && (
                          <p className="text-[11px] text-cream/30 truncate">{m.email}</p>
                        )}
                      </div>
                      {isAllowed && (
                        <select
                          value={entry!.level}
                          onChange={(e) =>
                            handleChangeLevel(m.email, e.target.value as BoardAccessLevel)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs bg-basalt-50 border border-cream/15 text-cream/60 rounded px-2 py-0.5"
                        >
                          <option value="view">view</option>
                          <option value="edit">edit</option>
                        </select>
                      )}
                    </label>
                  )
                })}
              </div>
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
