'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ScopePicker, type ScopeOption } from './ScopePicker'
export type { ScopeOption }
import { ManageShareLinks } from './ManageShareLinks'

// ============================================================================
// Types
// ============================================================================

type Tab = 'people' | 'link' | 'export'

interface AccessEntry {
  id: string
  userId: string
  name: string | null
  email: string | null
  image: string | null
  level: 'VIEW' | 'EDIT'
}

interface InviteEntry {
  id: string
  email: string
  level: 'VIEW' | 'EDIT'
  status: string
  token: string
  expiresAt: string
}

export interface UnifiedShareModalProps {
  projectId: string
  toolKey: string
  toolLabel: string
  onClose: () => void
  collectionId?: string
  collectionName?: string
  isOwner: boolean
  // Export config
  scopes: ScopeOption[]
  scopeLabel: string
  buildExportUrl: (opts: {
    projectId: string
    includeNotes: boolean
    includeComments: boolean
    includePhotos: boolean
    scopeMode: 'all' | 'selected'
    selectedScopeIds: string[]
  }) => string
  extraExportControls?: React.ReactNode
  renderTokenBadges?: (token: { statuses?: string[]; locations?: string[]; assignees?: string[] }) => React.ReactNode
  initialTab?: Tab
  initialSelectedScopeIds?: string[]
  customLinkTab?: React.ReactNode
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedShareModal({
  projectId,
  toolKey,
  toolLabel,
  onClose,
  collectionId,
  collectionName,
  isOwner,
  scopes,
  scopeLabel,
  buildExportUrl,
  extraExportControls,
  renderTokenBadges,
  initialTab,
  initialSelectedScopeIds,
  customLinkTab,
}: UnifiedShareModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab || 'people')

  const title = collectionId
    ? (collectionName ? `Share "${collectionName}"` : `Share ${toolLabel}`)
    : `Share ${toolLabel}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header with tabs */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-cream">{title}</h2>
            <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-basalt rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setTab('people')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                tab === 'people'
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              People
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setTab('link')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  tab === 'link'
                    ? 'bg-sandstone/20 text-sandstone font-medium'
                    : 'text-cream/50 hover:text-cream/70'
                }`}
              >
                Read-Only Link
              </button>
            )}
            <button
              type="button"
              onClick={() => setTab('export')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                tab === 'export'
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 py-5">
          {tab === 'people' && (
            <PeopleTab
              projectId={projectId}
              toolKey={toolKey}
              toolLabel={toolLabel}
              collectionId={collectionId}
              collectionName={collectionName}
              isOwner={isOwner}
            />
          )}
          {tab === 'link' && (
            customLinkTab || (
              <LinkTab
                toolKey={toolKey}
                projectId={projectId}
                scopes={scopes}
                scopeLabel={scopeLabel}
                renderTokenBadges={renderTokenBadges}
                initialSelectedScopeIds={initialSelectedScopeIds}
                collectionId={collectionId}
              />
            )
          )}
          {tab === 'export' && (
            <ExportTab
              toolKey={toolKey}
              toolLabel={toolLabel}
              projectId={projectId}
              scopes={scopes}
              scopeLabel={scopeLabel}
              buildExportUrl={buildExportUrl}
              extraExportControls={extraExportControls}
              onClose={onClose}
              initialSelectedScopeIds={initialSelectedScopeIds}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// People Tab (from ShareToolModal)
// ============================================================================

function PeopleTab({
  projectId,
  toolKey,
  toolLabel,
  collectionId,
  collectionName,
  isOwner,
}: {
  projectId: string
  toolKey: string
  toolLabel: string
  collectionId?: string
  collectionName?: string
  isOwner: boolean
}) {
  const [access, setAccess] = useState<AccessEntry[]>([])
  const [invites, setInvites] = useState<InviteEntry[]>([])
  const [editShareCount, setEditShareCount] = useState(0)
  const [maxEditShares, setMaxEditShares] = useState(3)
  const [isLoading, setIsLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [level, setLevel] = useState<'EDIT' | 'VIEW'>('EDIT')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadData = useCallback(async () => {
    try {
      if (collectionId) {
        const res = await fetch(`/api/collections/${collectionId}/share`)
        if (!res.ok) return
        const data = await res.json()
        setAccess((data.members ?? []).map((m: { id: string; userId: string; role: string; user: { name: string | null; email: string | null; image: string | null } }) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          level: m.role === 'EDITOR' ? 'EDIT' : 'VIEW',
        } as AccessEntry)))
        setInvites((data.invites ?? []).map((i: { id: string; email: string; role: string; status: string; token: string; expiresAt: string }) => ({
          id: i.id,
          email: i.email,
          level: i.role === 'EDITOR' ? 'EDIT' : 'VIEW',
          status: i.status,
          token: i.token,
          expiresAt: i.expiresAt,
        } as InviteEntry)))
        setEditShareCount((data.members ?? []).filter((m: { role: string }) => m.role === 'EDITOR').length)
        setMaxEditShares(10)
      } else {
        const res = await fetch(`/api/projects/${projectId}/tools/${toolKey}/share`)
        if (!res.ok) return
        const data = await res.json()
        setAccess(data.access)
        setInvites(data.invites)
        setEditShareCount(data.editShareCount)
        setMaxEditShares(data.maxEditShares)
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [projectId, toolKey, collectionId])

  useEffect(() => { loadData() }, [loadData])

  const handleInvite = async () => {
    setError('')
    setSuccessMsg('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address')
      return
    }

    setSending(true)
    try {
      const url = collectionId
        ? `/api/collections/${collectionId}/share`
        : `/api/projects/${projectId}/tools/${toolKey}/share`
      const body = collectionId
        ? { email: trimmed, role: level === 'EDIT' ? 'EDITOR' : 'VIEWER' }
        : { email: trimmed, level }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to send invite')
        return
      }

      const data = await res.json()
      if (collectionId) {
        setSuccessMsg(data.addedDirectly ? 'Added' : 'Invite sent')
      } else {
        const inviteUrl = `${window.location.origin}/invite/${data.invite.token}`
        try {
          await navigator.clipboard.writeText(inviteUrl)
          setSuccessMsg(`Invite link copied${data.emailQueued ? ' · Email sent' : ''}`)
        } catch {
          setSuccessMsg('Invite created')
        }
      }
      setTimeout(() => setSuccessMsg(''), 4000)
      setEmail('')
      loadData()
    } catch {
      setError('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!confirm('Remove this person\'s access?')) return
    const url = collectionId
      ? `/api/collections/${collectionId}/share`
      : `/api/projects/${projectId}/tools/${toolKey}/share`
    await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadData()
  }

  const handleCancelInvite = async (inviteId: string) => {
    const url = collectionId
      ? `/api/collections/${collectionId}/share`
      : `/api/projects/${projectId}/tools/${toolKey}/share`
    await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    loadData()
  }

  const editSeatsUsed = editShareCount + invites.filter((i) => i.level === 'EDIT').length

  return (
    <div className="space-y-5">
      {collectionId && (
        <p className="text-xs text-cream/40">
          Access applies only to this {toolLabel}{collectionName ? `: ${collectionName}` : ''}.
        </p>
      )}

      {/* Invite form (owner only) */}
      {isOwner && (
        <div>
          <label className="block text-sm text-cream/70 mb-2">Invite by email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="name@example.com"
              className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as 'EDIT' | 'VIEW')}
              className="bg-basalt border border-cream/20 rounded-lg px-2 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
            >
              <option value="EDIT">Can edit</option>
              <option value="VIEW">View only</option>
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={sending}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
            >
              {sending ? '...' : 'Invite'}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-1.5">{error}</p>}
          {successMsg && <p className="text-sm text-emerald-400 mt-1.5">{successMsg}</p>}
          <p className="text-[11px] text-cream/30 mt-1.5">
            {editSeatsUsed} of {maxEditShares} edit seats used
          </p>
        </div>
      )}

      {/* Current access */}
      {isLoading ? (
        <div className="text-sm text-cream/30 text-center py-4">Loading...</div>
      ) : (
        <>
          {access.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-2">
                People with access
              </h3>
              <div className="space-y-1">
                {access.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cream/5">
                    <div className="w-8 h-8 rounded-full bg-cream/10 flex items-center justify-center text-xs text-cream/50 shrink-0">
                      {a.name?.charAt(0)?.toUpperCase() || a.email?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cream truncate">{a.name || a.email}</p>
                      {a.name && a.email && (
                        <p className="text-xs text-cream/40 truncate">{a.email}</p>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      a.level === 'EDIT' ? 'bg-sandstone/15 text-sandstone' : 'bg-cream/10 text-cream/50'
                    )}>
                      {a.level === 'EDIT' ? 'Can edit' : 'View only'}
                    </span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(a.userId)}
                        className="text-cream/30 hover:text-red-400 transition-colors"
                        title="Remove access"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-2">
                Pending invites
              </h3>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-cream/[0.03] border border-cream/8">
                    <div className="w-8 h-8 rounded-full bg-cream/5 flex items-center justify-center text-xs text-cream/30 shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cream/60 truncate">{inv.email}</p>
                      <p className="text-xs text-cream/30">
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      inv.level === 'EDIT' ? 'bg-sandstone/15 text-sandstone' : 'bg-cream/10 text-cream/50'
                    )}>
                      {inv.level === 'EDIT' ? 'Can edit' : 'View only'}
                    </span>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-cream/30 hover:text-red-400 transition-colors"
                        title="Cancel invite"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {access.length === 0 && invites.length === 0 && (
            <p className="text-sm text-cream/30 text-center py-3">
              No one else has access yet
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// Link Tab (from ShareExportModal ShareTab)
// ============================================================================

function LinkTab({
  toolKey,
  projectId,
  scopes,
  scopeLabel,
  renderTokenBadges,
  initialSelectedScopeIds,
  collectionId,
}: {
  toolKey: string
  projectId: string
  scopes: ScopeOption[]
  scopeLabel: string
  renderTokenBadges?: UnifiedShareModalProps['renderTokenBadges']
  initialSelectedScopeIds?: string[]
  collectionId?: string
}) {
  const [showCreate, setShowCreate] = useState(!!initialSelectedScopeIds?.length)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-cream">Active Links</h3>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs px-3 py-1.5 bg-sandstone/10 text-sandstone rounded-full hover:bg-sandstone/20 transition-colors"
        >
          + New Link
        </button>
      </div>

      {showCreate && (
        <CreateShareLinkForm
          toolKey={toolKey}
          projectId={projectId}
          scopes={scopes}
          scopeLabel={scopeLabel}
          initialSelectedScopeIds={initialSelectedScopeIds}
          onCreated={() => {
            setShowCreate(false)
            window.dispatchEvent(new Event('share-token-created'))
          }}
          onCancel={() => setShowCreate(false)}
          collectionId={collectionId}
        />
      )}

      <ManageShareLinks
        toolKey={toolKey}
        projectId={projectId}
        renderBadges={renderTokenBadges as never}
        collectionId={collectionId}
      />

      <p className="text-xs text-cream/30 text-center">
        Public links expire after 14 days. Anyone with a link can view a read-only version.
      </p>
    </div>
  )
}

// ============================================================================
// Export Tab (from ShareExportModal ExportTab)
// ============================================================================

function ExportTab({
  toolKey,
  toolLabel,
  projectId,
  scopes,
  scopeLabel,
  buildExportUrl,
  extraExportControls,
  onClose,
  initialSelectedScopeIds,
}: {
  toolKey: string
  toolLabel: string
  projectId: string
  scopes: ScopeOption[]
  scopeLabel: string
  buildExportUrl: UnifiedShareModalProps['buildExportUrl']
  extraExportControls?: React.ReactNode
  onClose: () => void
  initialSelectedScopeIds?: string[]
}) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [scopeMode, setScopeMode] = useState<'all' | 'selected'>(initialSelectedScopeIds?.length ? 'selected' : 'all')
  const [selectedScopeIds, setSelectedScopeIds] = useState<Set<string>>(new Set(initialSelectedScopeIds || []))

  function handleExport() {
    const url = buildExportUrl({
      projectId,
      includeNotes,
      includeComments,
      includePhotos,
      scopeMode,
      selectedScopeIds: Array.from(selectedScopeIds),
    })
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="space-y-5">
      <ScopePicker
        label={scopeLabel}
        options={scopes}
        mode={scopeMode}
        selectedIds={selectedScopeIds}
        onModeChange={setScopeMode}
        onToggleId={(id) => {
          setSelectedScopeIds((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
          })
        }}
      />

      {extraExportControls}

      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
        <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} className="accent-sandstone" />
        <div>
          <p className="text-sm text-cream">Include notes</p>
          <p className="text-xs text-cream/40">Private notes on each item</p>
        </div>
      </label>
      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
        <input type="checkbox" checked={includeComments} onChange={(e) => setIncludeComments(e.target.checked)} className="accent-sandstone" />
        <div>
          <p className="text-sm text-cream">Include comments</p>
          <p className="text-xs text-cream/40">Discussion threads</p>
        </div>
      </label>
      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
        <input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} className="accent-sandstone" />
        <div>
          <p className="text-sm text-cream">Include photos</p>
          <p className="text-xs text-cream/40">Photo thumbnails</p>
        </div>
      </label>

      <button
        type="button"
        onClick={handleExport}
        className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
      >
        Open Print Preview
      </button>

      <p className="text-xs text-cream/30 text-center">
        Tip: In the print dialog, disable &ldquo;Headers and footers&rdquo; to remove the URL from the PDF.
      </p>
    </div>
  )
}

// ============================================================================
// Create Share Link Form (from ShareExportModal)
// ============================================================================

function CreateShareLinkForm({
  toolKey,
  projectId,
  scopes,
  scopeLabel,
  onCreated,
  onCancel,
  initialSelectedScopeIds,
  collectionId,
}: {
  toolKey: string
  projectId: string
  scopes: ScopeOption[]
  scopeLabel: string
  onCreated: () => void
  onCancel: () => void
  initialSelectedScopeIds?: string[]
  collectionId?: string
}) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [scopeMode, setScopeMode] = useState<'all' | 'selected'>(initialSelectedScopeIds?.length ? 'selected' : 'all')
  const [selectedScopeIds, setSelectedScopeIds] = useState<Set<string>>(new Set(initialSelectedScopeIds || []))
  const [creating, setCreating] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [shareConfirmText, setShareConfirmText] = useState('')

  const isRisky = (includeNotes || includePhotos) && scopeMode === 'all' && scopes.length >= 3

  async function handleCreate() {
    setCreating(true)
    try {
      const scopePayload = scopeMode === 'selected' && selectedScopeIds.size > 0
        ? {
            mode: 'selected',
            roomIds: Array.from(selectedScopeIds),
            roomLabels: scopes.filter((s) => selectedScopeIds.has(s.id)).map((s) => s.name),
            boardIds: Array.from(selectedScopeIds),
            boardLabels: scopes.filter((s) => selectedScopeIds.has(s.id)).map((s) => s.name),
          }
        : { mode: 'all' }

      const url = collectionId
        ? `/api/collections/${collectionId}/share-token`
        : `/api/tools/${toolKey}/share-token?projectId=${projectId}`
      const body = collectionId
        ? { settings: { includeNotes, includeComments, includePhotos, scope: scopePayload } }
        : { includeNotes, includeComments, includePhotos, scope: scopePayload }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) onCreated()
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-3 rounded-lg bg-basalt border border-cream/10 space-y-3">
      <p className="text-xs text-cream/50">Configure the new public link:</p>

      <ScopePicker
        label={scopeLabel}
        options={scopes}
        mode={scopeMode}
        selectedIds={selectedScopeIds}
        onModeChange={setScopeMode}
        onToggleId={(id) => {
          setSelectedScopeIds((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
          })
        }}
      />

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5" />
          <span className="text-xs text-cream/70">Notes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeComments} onChange={(e) => setIncludeComments(e.target.checked)} className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5" />
          <span className="text-xs text-cream/70">Comments</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5" />
          <span className="text-xs text-cream/70">Photos</span>
        </label>
      </div>

      {isRisky ? (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 space-y-2">
          <p className="text-red-400 text-xs font-medium">
            This link will expose {includeNotes ? 'notes' : ''}{includeNotes && includePhotos ? ' and ' : ''}{includePhotos ? 'photos' : ''} for all items with no filters.
          </p>
          <p className="text-red-400/70 text-xs">
            Type <span className="font-mono font-bold">SHARE</span> below to confirm.
          </p>
          <input
            type="text"
            value={shareConfirmText}
            onChange={(e) => setShareConfirmText(e.target.value)}
            placeholder="Type SHARE to confirm"
            className="w-full px-3 py-2 bg-basalt border border-red-400/30 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-red-400/50"
          />
        </div>
      ) : (
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-sandstone" />
          <span className="text-xs text-cream/60">I understand this creates a public link that anyone can view</span>
        </label>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleCreate}
          disabled={isRisky ? shareConfirmText !== 'SHARE' || creating : !confirmed || creating}
          className="text-xs px-3 py-1.5 bg-sandstone text-basalt rounded-md hover:bg-sandstone-light transition-colors disabled:opacity-50 font-medium"
        >
          {creating ? 'Creating...' : 'Create Link'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 text-cream/40 hover:text-cream/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
