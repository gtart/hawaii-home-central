'use client'

import { useState } from 'react'
import { ScopePicker, type ScopeOption } from './ScopePicker'
import { ManageShareLinks } from './ManageShareLinks'

type Tab = 'export' | 'share'

export interface ShareExportFlag {
  key: string
  label: string
  description: string
  defaultValue: boolean
}

export interface ShareExportModalProps {
  toolKey: string
  toolLabel: string
  projectId: string
  isOwner: boolean
  onClose: () => void
  // Scope config
  scopes: ScopeOption[]
  scopeLabel: string // "Rooms" | "Boards" | "Locations"
  // Export config
  buildExportUrl: (opts: {
    projectId: string
    includeNotes: boolean
    includeComments: boolean
    includePhotos: boolean
    scopeMode: 'all' | 'selected'
    selectedScopeIds: string[]
  }) => string
  // Optional: additional tool-specific export controls
  extraExportControls?: React.ReactNode
  // Optional: tool-specific badge renderer for manage links
  renderTokenBadges?: (token: { statuses?: string[]; locations?: string[]; assignees?: string[] }) => React.ReactNode
}

export function ShareExportModal({
  toolKey,
  toolLabel,
  projectId,
  isOwner,
  onClose,
  scopes,
  scopeLabel,
  buildExportUrl,
  extraExportControls,
  renderTokenBadges,
}: ShareExportModalProps) {
  const [tab, setTab] = useState<Tab>('export')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header with tabs */}
        <div className="px-6 py-4 border-b border-cream/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-cream">Share &amp; Export</h2>
            <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1 bg-basalt rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setTab('export')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                tab === 'export'
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              Print / PDF
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setTab('share')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  tab === 'share'
                    ? 'bg-sandstone/20 text-sandstone font-medium'
                    : 'text-cream/50 hover:text-cream/70'
                }`}
              >
                Public Links
              </button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 py-5">
          {tab === 'export' ? (
            <ExportTab
              toolKey={toolKey}
              toolLabel={toolLabel}
              projectId={projectId}
              scopes={scopes}
              scopeLabel={scopeLabel}
              buildExportUrl={buildExportUrl}
              extraExportControls={extraExportControls}
              onClose={onClose}
            />
          ) : (
            <ShareTab
              toolKey={toolKey}
              projectId={projectId}
              scopes={scopes}
              scopeLabel={scopeLabel}
              renderTokenBadges={renderTokenBadges}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export Tab
// ---------------------------------------------------------------------------

function ExportTab({
  toolKey,
  toolLabel,
  projectId,
  scopes,
  scopeLabel,
  buildExportUrl,
  extraExportControls,
  onClose,
}: {
  toolKey: string
  toolLabel: string
  projectId: string
  scopes: ScopeOption[]
  scopeLabel: string
  buildExportUrl: ShareExportModalProps['buildExportUrl']
  extraExportControls?: React.ReactNode
  onClose: () => void
}) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [scopeMode, setScopeMode] = useState<'all' | 'selected'>('all')
  const [selectedScopeIds, setSelectedScopeIds] = useState<Set<string>>(new Set())

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
      {/* Scope picker */}
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

      {/* Tool-specific extra controls (e.g. punchlist status/org mode) */}
      {extraExportControls}

      {/* Include flags */}
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

// ---------------------------------------------------------------------------
// Share Tab
// ---------------------------------------------------------------------------

function ShareTab({
  toolKey,
  projectId,
  scopes,
  scopeLabel,
  renderTokenBadges,
}: {
  toolKey: string
  projectId: string
  scopes: ScopeOption[]
  scopeLabel: string
  renderTokenBadges?: ShareExportModalProps['renderTokenBadges']
}) {
  const [showCreate, setShowCreate] = useState(false)

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
          onCreated={() => {
            setShowCreate(false)
            // ManageShareLinks will refetch on its own via useEffect
            // Force re-mount to trigger reload
            window.dispatchEvent(new Event('share-token-created'))
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <ManageShareLinks
        toolKey={toolKey}
        projectId={projectId}
        renderBadges={renderTokenBadges as never}
      />

      <p className="text-xs text-cream/30 text-center">
        Public links expire after 14 days. Anyone with a link can view a read-only version.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Share Link Form (simplified inline version)
// ---------------------------------------------------------------------------

function CreateShareLinkForm({
  toolKey,
  projectId,
  scopes,
  scopeLabel,
  onCreated,
  onCancel,
}: {
  toolKey: string
  projectId: string
  scopes: ScopeOption[]
  scopeLabel: string
  onCreated: () => void
  onCancel: () => void
}) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [scopeMode, setScopeMode] = useState<'all' | 'selected'>('all')
  const [selectedScopeIds, setSelectedScopeIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [shareConfirmText, setShareConfirmText] = useState('')

  const isRisky = (includeNotes || includePhotos) &&
    scopeMode === 'all' &&
    scopes.length >= 3

  async function handleCreate() {
    setCreating(true)
    try {
      const scopePayload = scopeMode === 'selected' && selectedScopeIds.size > 0
        ? {
            mode: 'selected',
            roomIds: Array.from(selectedScopeIds),
            roomLabels: scopes
              .filter((s) => selectedScopeIds.has(s.id))
              .map((s) => s.name),
            boardIds: Array.from(selectedScopeIds),
            boardLabels: scopes
              .filter((s) => selectedScopeIds.has(s.id))
              .map((s) => s.name),
          }
        : { mode: 'all' }

      const res = await fetch(`/api/tools/${toolKey}/share-token?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNotes,
          includeComments,
          includePhotos,
          scope: scopePayload,
        }),
      })
      if (res.ok) {
        onCreated()
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-3 rounded-lg bg-basalt border border-cream/10 space-y-3">
      <p className="text-xs text-cream/50">Configure the new public link:</p>

      {/* Scope */}
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

      {/* Include flags */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeNotes}
            onChange={(e) => setIncludeNotes(e.target.checked)}
            className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5"
          />
          <span className="text-xs text-cream/70">Notes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeComments}
            onChange={(e) => setIncludeComments(e.target.checked)}
            className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5"
          />
          <span className="text-xs text-cream/70">Comments</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includePhotos}
            onChange={(e) => setIncludePhotos(e.target.checked)}
            className="rounded border-cream/20 bg-basalt text-sandstone focus:ring-sandstone/50 w-3.5 h-3.5"
          />
          <span className="text-xs text-cream/70">Photos</span>
        </label>
      </div>

      {/* Risky share confirmation */}
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
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-sandstone"
          />
          <span className="text-xs text-cream/60">
            I understand this creates a public link that anyone can view
          </span>
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
