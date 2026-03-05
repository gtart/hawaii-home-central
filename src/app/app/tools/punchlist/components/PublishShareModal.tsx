'use client'

import { useState } from 'react'
interface Props {
  toolKey: string
  projectId: string
  locations: string[]
  assignees: string[]
  onClose: () => void
  onCreated: () => void
  collectionId?: string
}

const STATUS_CHECKS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'ACCEPTED', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
  { key: '__unassigned__', label: 'Unassigned' },
]

const PRIORITY_CHECKS = [
  { key: 'HIGH', label: 'High' },
  { key: 'MED', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
  { key: '__unassigned__', label: 'Unassigned' },
]

export function PublishShareModal({ toolKey, projectId, locations, assignees, onClose, onCreated, collectionId }: Props) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [includePhotos, setIncludePhotos] = useState(true)
  const [includedStatuses, setIncludedStatuses] = useState<Set<string>>(new Set())
  const [includedPriorities, setIncludedPriorities] = useState<Set<string>>(new Set())
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)
  const [shareConfirmText, setShareConfirmText] = useState('')
  const [creating, setCreating] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  function toggleInSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const chipClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
      active
        ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
        : 'border-cream/20 text-cream/40 hover:border-cream/30'
    }`

  async function handleCreate() {
    setError('')
    setCreating(true)

    try {
      const settings = {
        includeNotes,
        includeComments,
        includePhotos,
        statuses: Array.from(includedStatuses),
        priorities: Array.from(includedPriorities),
        locations: Array.from(selectedLocations),
        assignees: Array.from(selectedAssignees),
      }
      const fetchUrl = collectionId
        ? `/api/collections/${collectionId}/share-token`
        : `/api/tools/${toolKey}/share-token?projectId=${projectId}`
      const fetchBody = collectionId ? { settings } : settings
      const res = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fetchBody),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to create link')
        return
      }

      const data = await res.json()
      const url = data.url || `${window.location.origin}/share/${toolKey}/${data.token}`
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

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-1.5">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                  includeNotes ? 'bg-amber-400/10 text-amber-400' : 'bg-cream/5 text-cream/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${includeNotes ? 'bg-amber-400' : 'bg-cream/20'}`} />
                  Additional Info: {includeNotes ? 'INCLUDED' : 'NOT INCLUDED'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-cream/5 text-cream/40`}>
                  <span className={`w-2 h-2 rounded-full ${includePhotos ? 'bg-emerald-400' : 'bg-cream/20'}`} />
                  Photos: {includePhotos ? 'INCLUDED' : 'NOT INCLUDED'}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-cream/5 text-cream/40">
                  <span className={`w-2 h-2 rounded-full ${includeComments ? 'bg-emerald-400' : 'bg-cream/20'}`} />
                  Comments: {includeComments ? 'INCLUDED' : 'NOT INCLUDED'}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-cream/5 text-cream/40">
                  <span className="w-2 h-2 rounded-full bg-cream/20" />
                  Statuses: {Array.from(includedStatuses).filter((s) => s !== '__unassigned__').join(', ') || 'All'}
                </div>
              </div>
              {(includedPriorities.size > 0 || selectedLocations.size > 0 || selectedAssignees.size > 0) ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {includedPriorities.size > 0 && (
                    <span className="px-2 py-1 bg-cream/10 text-cream/50 rounded">
                      Priority: {Array.from(includedPriorities).map((p) => p === '__unassigned__' ? 'Unassigned' : p).join(', ')}
                    </span>
                  )}
                  {selectedLocations.size > 0 && (
                    <span className="px-2 py-1 bg-cream/10 text-cream/50 rounded">
                      Locations: {Array.from(selectedLocations).map((l) => l === '__unassigned__' ? 'Unassigned' : l).join(', ')}
                    </span>
                  )}
                  {selectedAssignees.size > 0 && (
                    <span className="px-2 py-1 bg-cream/10 text-cream/50 rounded">
                      Assignees: {Array.from(selectedAssignees).map((a) => a === '__unassigned__' ? 'Unassigned' : a).join(', ')}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-cream/30 text-center">All items included (no filters)</p>
              )}
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

              {/* Photos toggle */}
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">Include photos</p>
                  <p className="text-xs text-cream/40">Photos attached to items will be visible</p>
                </div>
              </label>

              {/* Comments toggle */}
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">Include comments</p>
                  <p className="text-xs text-cream/40">Discussion threads on each item</p>
                </div>
              </label>

              {/* Filter pills — same multi-select pattern as Fix List page */}
              <div>
                <p className="text-sm text-cream/70 mb-2">
                  Filter what to share{' '}
                  <span className="text-cream/30 text-xs">(none selected = all)</span>
                </p>

                {/* Status */}
                <div className="mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-1">Status</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {STATUS_CHECKS.map((s) => (
                      <button key={s.key} type="button" onClick={() => toggleInSet(setIncludedStatuses, s.key)} className={chipClass(includedStatuses.has(s.key))}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-1">Priority</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PRIORITY_CHECKS.map((p) => (
                      <button key={p.key} type="button" onClick={() => toggleInSet(setIncludedPriorities, p.key)} className={chipClass(includedPriorities.has(p.key))}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-1">Location</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <button type="button" onClick={() => toggleInSet(setSelectedLocations, '__unassigned__')} className={chipClass(selectedLocations.has('__unassigned__'))}>
                      Unassigned
                    </button>
                    {locations.map((loc) => (
                      <button key={loc} type="button" onClick={() => toggleInSet(setSelectedLocations, loc)} className={chipClass(selectedLocations.has(loc))}>
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-1">Assignee</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <button type="button" onClick={() => toggleInSet(setSelectedAssignees, '__unassigned__')} className={chipClass(selectedAssignees.has('__unassigned__'))}>
                      Unassigned
                    </button>
                    {assignees.map((a) => (
                      <button key={a} type="button" onClick={() => toggleInSet(setSelectedAssignees, a)} className={chipClass(selectedAssignees.has(a))}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risky share: broad scope with sensitive data */}
              {(() => {
                const isRisky = (includeNotes || includePhotos) &&
                  includedStatuses.size === 0 &&
                  includedPriorities.size === 0 &&
                  selectedLocations.size === 0 &&
                  selectedAssignees.size === 0

                return isRisky ? (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 space-y-2">
                    <p className="text-red-400 text-xs font-medium">
                      This link will expose {includeNotes ? 'notes' : ''}{includeNotes && includePhotos ? ' and ' : ''}{includePhotos ? 'photos' : ''} for ALL items with no filters.
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
                    <span className="text-sm text-cream/60">
                      I understand this creates a public link that anyone can view
                    </span>
                  </label>
                )
              })()}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="button"
                onClick={handleCreate}
                disabled={(() => {
                  const isRisky = (includeNotes || includePhotos) &&
                    includedStatuses.size === 3 &&
                    selectedLocations.size === 0 &&
                    selectedAssignees.size === 0
                  if (isRisky) return shareConfirmText !== 'SHARE' || creating
                  return !confirmed || creating
                })()}
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
