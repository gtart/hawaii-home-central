'use client'

import { useState } from 'react'
import { ExportPDFModal } from './ExportPDFModal'
import { PublishShareModal } from './PublishShareModal'
import { ManageShareLinks } from './ManageShareLinks'

type Tab = 'export' | 'share'

interface Props {
  onClose: () => void
  locations: string[]
  assignees: string[]
  projectId: string
  isOwner: boolean
}

export function ShareExportModal({ onClose, locations, assignees, projectId, isOwner }: Props) {
  const [tab, setTab] = useState<Tab>('export')
  const [showPublishModal, setShowPublishModal] = useState(false)

  return (
    <>
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
              <ExportTabContent
                locations={locations}
                assignees={assignees}
                projectId={projectId}
                onClose={onClose}
              />
            ) : (
              <ShareTabContent
                projectId={projectId}
                locations={locations}
                assignees={assignees}
                onCreateNew={() => setShowPublishModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      {showPublishModal && (
        <PublishShareModal
          toolKey="punchlist"
          projectId={projectId}
          locations={locations}
          assignees={assignees}
          onClose={() => setShowPublishModal(false)}
          onCreated={() => setShowPublishModal(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Export tab — inline version of ExportPDFModal controls
// ---------------------------------------------------------------------------

import type { PunchlistStatus } from '../types'

const STATUS_CHECKS: { key: PunchlistStatus; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DONE', label: 'Done' },
]

type OrgMode = 'room_status' | 'status_room'

function ExportTabContent({
  locations,
  assignees,
  projectId,
  onClose,
}: {
  locations: string[]
  assignees: string[]
  projectId: string
  onClose: () => void
}) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [org, setOrg] = useState<OrgMode>('room_status')
  const [includedStatuses, setIncludedStatuses] = useState<Set<PunchlistStatus>>(new Set(['OPEN', 'ACCEPTED']))
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set())

  function toggleStatus(s: PunchlistStatus) {
    setIncludedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) { if (next.size > 1) next.delete(s) } else next.add(s)
      return next
    })
  }

  function handleExport() {
    const statuses = Array.from(includedStatuses).join(',')
    let url = `/app/tools/punchlist/report?projectId=${projectId}&includeNotes=${includeNotes}&includeComments=${includeComments}&includePhotos=${includePhotos}&org=${org}&statuses=${statuses}`
    if (selectedLocations.size > 0) url += `&locations=${encodeURIComponent(Array.from(selectedLocations).join(','))}`
    if (selectedAssignees.size > 0) url += `&assignees=${encodeURIComponent(Array.from(selectedAssignees).join(','))}`
    window.open(url, '_blank')
    onClose()
  }

  const chipClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
      active
        ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
        : 'border-cream/20 text-cream/40 hover:border-cream/30'
    }`

  return (
    <div className="space-y-5">
      {/* Organization mode */}
      <div>
        <p className="text-sm text-cream/70 mb-3">Organize report by</p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
            <input type="radio" name="org" checked={org === 'room_status'} onChange={() => setOrg('room_status')} className="accent-sandstone" />
            <div>
              <p className="text-sm text-cream">By Room, then Status</p>
              <p className="text-xs text-cream/40">Group items by location first</p>
            </div>
          </label>
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
            <input type="radio" name="org" checked={org === 'status_room'} onChange={() => setOrg('status_room')} className="accent-sandstone" />
            <div>
              <p className="text-sm text-cream">By Status, then Room</p>
              <p className="text-xs text-cream/40">Group items by status first</p>
            </div>
          </label>
        </div>
      </div>

      {/* Status inclusion */}
      <div>
        <p className="text-sm text-cream/70 mb-3">Include statuses</p>
        <div className="flex gap-2">
          {STATUS_CHECKS.map((s) => (
            <button key={s.key} type="button" onClick={() => toggleStatus(s.key)} className={chipClass(includedStatuses.has(s.key))}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location filter */}
      {locations.length >= 2 && (
        <div>
          <p className="text-sm text-cream/70 mb-1">
            Filter by Location <span className="text-cream/30 text-xs">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <button key={loc} type="button" onClick={() => setSelectedLocations((p) => { const n = new Set(p); n.has(loc) ? n.delete(loc) : n.add(loc); return n })} className={chipClass(selectedLocations.has(loc))}>
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assignee filter */}
      {assignees.length >= 2 && (
        <div>
          <p className="text-sm text-cream/70 mb-1">
            Filter by Assignee <span className="text-cream/30 text-xs">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {assignees.map((a) => (
              <button key={a} type="button" onClick={() => setSelectedAssignees((p) => { const n = new Set(p); n.has(a) ? n.delete(a) : n.add(a); return n })} className={chipClass(selectedAssignees.has(a))}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes + Comments */}
      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
        <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} className="accent-sandstone" />
        <div>
          <p className="text-sm text-cream">Include additional info</p>
          <p className="text-xs text-cream/40">Your private notes on each item</p>
        </div>
      </label>
      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
        <input type="checkbox" checked={includeComments} onChange={(e) => setIncludeComments(e.target.checked)} className="accent-sandstone" />
        <div>
          <p className="text-sm text-cream">Include comments</p>
          <p className="text-xs text-cream/40">Discussion threads on each item</p>
        </div>
      </label>
      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
        <input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} className="accent-sandstone" />
        <div>
          <p className="text-sm text-cream">Include photos</p>
          <p className="text-xs text-cream/40">Photo thumbnails attached to items</p>
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
// Share tab — manage existing links + create new
// ---------------------------------------------------------------------------

function ShareTabContent({
  projectId,
  locations,
  assignees,
  onCreateNew,
}: {
  projectId: string
  locations: string[]
  assignees: string[]
  onCreateNew: () => void
}) {
  return (
    <div>
      <ManageShareLinks toolKey="punchlist" projectId={projectId} locations={locations} assignees={assignees} />
      <p className="text-xs text-cream/30 mt-4 text-center">
        Public links expire after 14 days. Anyone with a link can view a read-only version.
      </p>
    </div>
  )
}
