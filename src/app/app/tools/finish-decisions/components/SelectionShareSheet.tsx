'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SelectionV4, SelectionVisibility, SelectionAccess } from '@/data/finish-decisions'

interface ToolMember {
  email: string
  name: string | null
  image: string | null
}

interface ShareTokenEntry {
  id: string
  token: string
  includePhotos: boolean
  includeNotes: boolean
  includeComments: boolean
  createdAt: string
}

interface SelectionShareSheetProps {
  selection: SelectionV4
  currentUserEmail: string
  isOwner: boolean
  projectId: string
  collectionId: string
  onUpdateVisibility: (visibility: SelectionVisibility, access: SelectionAccess[]) => void
  onClose: () => void
}

export function SelectionShareSheet({
  selection,
  currentUserEmail,
  isOwner,
  projectId,
  collectionId,
  onUpdateVisibility,
  onClose,
}: SelectionShareSheetProps) {
  const [tab, setTab] = useState<'access' | 'links'>('access')
  const [visibility, setVisibility] = useState<SelectionVisibility>(selection.visibility || 'workspace')
  const [accessList, setAccessList] = useState<SelectionAccess[]>(selection.access || [])
  const [addEmail, setAddEmail] = useState('')
  const [toolMembers, setToolMembers] = useState<ToolMember[]>([])

  // Public links state
  const [shareTokens, setShareTokens] = useState<ShareTokenEntry[]>([])
  const [linkCreating, setLinkCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load workspace collaborators
  useEffect(() => {
    if (!projectId) return
    fetch(`/api/projects/${projectId}/tools/finish_decisions/share`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.access) return
        const members = (data.access as { email?: string; name?: string; image?: string }[])
          .filter((a) => a.email)
          .map((a) => ({ email: a.email!, name: a.name ?? null, image: a.image ?? null }))
        setToolMembers(members)
      })
      .catch(() => {})
  }, [projectId])

  // Load existing share tokens for this selection
  const loadTokens = useCallback(() => {
    if (!collectionId) return
    fetch(`/api/collections/${collectionId}/share-token`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!Array.isArray(data)) return
        // Filter to tokens scoped to this selection
        const scoped = data.filter((t: any) => {
          const scope = t.scope || t.settings?.scope
          return scope?.mode === 'selected' && scope?.selectionIds?.includes(selection.id)
        })
        setShareTokens(scoped.map((t: any) => ({
          id: t.id,
          token: t.token,
          includePhotos: t.includePhotos ?? true,
          includeNotes: t.includeNotes ?? false,
          includeComments: t.includeComments ?? true,
          createdAt: t.createdAt,
        })))
      })
      .catch(() => {})
  }, [collectionId, selection.id])

  useEffect(() => { loadTokens() }, [loadTokens])

  function handleVisibilityChange(v: SelectionVisibility) {
    setVisibility(v)
    const newAccess = v === 'restricted' ? accessList : []
    onUpdateVisibility(v, newAccess)
  }

  function addCollaborator(email: string) {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || accessList.some((a) => a.email.toLowerCase() === trimmed)) return
    const updated = [...accessList, { email: trimmed, level: 'view' as const }]
    setAccessList(updated)
    setAddEmail('')
    if (visibility === 'restricted') {
      onUpdateVisibility('restricted', updated)
    }
  }

  function removeCollaborator(email: string) {
    const updated = accessList.filter((a) => a.email.toLowerCase() !== email.toLowerCase())
    setAccessList(updated)
    if (visibility === 'restricted') {
      onUpdateVisibility('restricted', updated)
    }
  }

  function updateCollaboratorLevel(email: string, level: 'edit' | 'view') {
    const updated = accessList.map((a) =>
      a.email.toLowerCase() === email.toLowerCase() ? { ...a, level } : a
    )
    setAccessList(updated)
    if (visibility === 'restricted') {
      onUpdateVisibility('restricted', updated)
    }
  }

  async function createPublicLink() {
    setLinkCreating(true)
    try {
      const res = await fetch(`/api/collections/${collectionId}/share-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            includeNotes: false,
            includeComments: true,
            includePhotos: true,
            scope: {
              mode: 'selected',
              selectionIds: [selection.id],
              selectionLabels: [selection.title],
            },
          },
        }),
      })
      if (res.ok) {
        loadTokens()
      }
    } catch { /* silent */ }
    finally { setLinkCreating(false) }
  }

  async function revokeToken(tokenId: string) {
    try {
      await fetch(`/api/collections/${collectionId}/share-token`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      })
      setShareTokens((prev) => prev.filter((t) => t.id !== tokenId))
    } catch { /* silent */ }
  }

  function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/share/finish_decisions/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Members not in access list (for quick-add)
  const availableMembers = toolMembers.filter(
    (m) =>
      m.email.toLowerCase() !== currentUserEmail.toLowerCase() &&
      !accessList.some((a) => a.email.toLowerCase() === m.email.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-stone border border-cream/15 rounded-t-xl md:rounded-xl shadow-xl w-full max-w-md mx-0 md:mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-cream/15 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-cream">Share &ldquo;{selection.title}&rdquo;</h3>
            <button type="button" onClick={onClose} className="text-cream/45 hover:text-cream/70 transition-colors text-xl leading-none">&times;</button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTab('access')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'access' ? 'bg-cream/10 text-cream' : 'text-cream/55 hover:text-cream/70'
              }`}
            >
              Access
            </button>
            <button
              type="button"
              onClick={() => setTab('links')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'links' ? 'bg-cream/10 text-cream' : 'text-cream/55 hover:text-cream/70'
              }`}
            >
              Public links{shareTokens.length > 0 ? ` (${shareTokens.length})` : ''}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {tab === 'access' && (
            <div className="space-y-5">
              {/* Visibility toggle */}
              {isOwner && (
                <div>
                  <label className="block text-sm text-cream/80 mb-2">Who can see this selection</label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={visibility === 'workspace'}
                        onChange={() => handleVisibilityChange('workspace')}
                        className="mt-0.5 accent-sandstone"
                      />
                      <div>
                        <p className="text-sm text-cream">All workspace collaborators</p>
                        <p className="text-xs text-cream/55">Anyone with access to this Selections workspace can view</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={visibility === 'restricted'}
                        onChange={() => handleVisibilityChange('restricted')}
                        className="mt-0.5 accent-sandstone"
                      />
                      <div>
                        <p className="text-sm text-cream">Restricted</p>
                        <p className="text-xs text-cream/55">Only you and people you add below can see this selection</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Read-only visibility label for non-owners */}
              {!isOwner && (
                <div>
                  <label className="block text-sm text-cream/80 mb-1">Visibility</label>
                  <p className="text-sm text-cream/65">
                    {visibility === 'restricted' ? 'Restricted — only invited collaborators' : 'Shared with all workspace collaborators'}
                  </p>
                </div>
              )}

              {/* Collaborator list (when restricted) */}
              {visibility === 'restricted' && (
                <div>
                  <label className="block text-sm text-cream/80 mb-2">People with access</label>

                  {/* Current user (creator/owner — always listed) */}
                  <div className="flex items-center gap-3 py-2 border-b border-cream/10">
                    <div className="w-7 h-7 rounded-full bg-sandstone/20 flex items-center justify-center text-xs text-sandstone font-medium shrink-0">
                      {currentUserEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cream truncate">{currentUserEmail}</p>
                    </div>
                    <span className="text-[10px] text-cream/45 uppercase">Owner</span>
                  </div>

                  {/* Access list */}
                  {accessList.map((entry) => (
                    <div key={entry.email} className="flex items-center gap-3 py-2 border-b border-cream/10">
                      <div className="w-7 h-7 rounded-full bg-cream/10 flex items-center justify-center text-xs text-cream/65 font-medium shrink-0">
                        {entry.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cream truncate">{entry.email}</p>
                      </div>
                      {isOwner && (
                        <>
                          <select
                            value={entry.level}
                            onChange={(e) => updateCollaboratorLevel(entry.email, e.target.value as 'edit' | 'view')}
                            className="text-[10px] bg-basalt border border-cream/15 rounded px-1.5 py-0.5 text-cream/70 focus:outline-none"
                          >
                            <option value="view">View</option>
                            <option value="edit">Edit</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeCollaborator(entry.email)}
                            className="text-cream/35 hover:text-red-400 transition-colors text-sm"
                          >
                            &times;
                          </button>
                        </>
                      )}
                      {!isOwner && (
                        <span className="text-[10px] text-cream/45 uppercase">{entry.level}</span>
                      )}
                    </div>
                  ))}

                  {/* Add collaborator */}
                  {isOwner && (
                    <div className="mt-3">
                      {availableMembers.length > 0 && (
                        <div className="mb-2">
                          <p className="text-[10px] text-cream/45 uppercase tracking-wider mb-1">Workspace members</p>
                          <div className="flex flex-wrap gap-1">
                            {availableMembers.map((m) => (
                              <button
                                key={m.email}
                                type="button"
                                onClick={() => addCollaborator(m.email)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-stone-200 hover:bg-cream/10 text-cream/65 hover:text-cream/80 rounded-lg transition-colors"
                              >
                                <span className="text-sandstone">+</span>
                                {m.name || m.email.split('@')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={addEmail}
                          onChange={(e) => setAddEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); addCollaborator(addEmail) }
                          }}
                          placeholder="Add by email..."
                          className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-sandstone/40"
                        />
                        <button
                          type="button"
                          onClick={() => addCollaborator(addEmail)}
                          disabled={!addEmail.trim()}
                          className="px-3 py-1.5 text-xs bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'links' && (
            <div className="space-y-4">
              <p className="text-sm text-cream/65">
                Public links let anyone view this selection without signing in. Links are read-only.
              </p>

              {/* Existing tokens */}
              {shareTokens.map((t) => {
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/finish_decisions/${t.token}`
                return (
                  <div key={t.id} className="bg-basalt border border-cream/15 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-cream/80 break-all font-mono">{url}</p>
                    <div className="flex items-center gap-2 text-[10px] text-cream/45">
                      {t.includePhotos && <span>Photos</span>}
                      {t.includeComments && <span>Comments</span>}
                      {t.includeNotes && <span>Notes</span>}
                      <span className="ml-auto">
                        {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyLink(t.token, t.id)}
                        className="flex-1 py-1.5 text-xs bg-stone-200 hover:bg-cream/10 text-cream/70 rounded-lg transition-colors"
                      >
                        {copiedId === t.id ? 'Copied!' : 'Copy link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeToken(t.id)}
                        className="px-3 py-1.5 text-xs text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Create new link */}
              <button
                type="button"
                onClick={createPublicLink}
                disabled={linkCreating}
                className="w-full py-2.5 text-sm bg-stone-200 hover:bg-cream/10 text-cream/70 hover:text-cream/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {linkCreating ? 'Creating...' : 'Create public link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
