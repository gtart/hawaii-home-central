'use client'

import { useEffect, useState } from 'react'
import { ImportFromUrlPanel } from './ImportFromUrlPanel'
import { BookmarkletButton } from './BookmarkletButton'
import type { OptionImageV3, RoomV3, RoomTypeV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP } from '@/data/finish-decisions'

interface ImportResult {
  name: string
  notes: string
  sourceUrl: string
  selectedImages: OptionImageV3[]
}

type DialogStep = 'choose-method' | 'url-capture' | 'placement'

export function SaveFromWebDialog({
  onImport,
  onClose,
  rooms,
  currentRoomId,
  currentDecisionId,
  onImportToDecision,
}: {
  /** Legacy: direct import into current decision (used when no rooms context) */
  onImport: (result: ImportResult) => void
  onClose: () => void
  rooms?: RoomV3[]
  currentRoomId?: string
  currentDecisionId?: string
  onImportToDecision?: (targetRoomId: string, targetDecisionId: string | null, newTitle: string | undefined, result: ImportResult) => void
}) {
  const [step, setStep] = useState<DialogStep>('choose-method')
  const [urlSectionOpen, setUrlSectionOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [capturedResult, setCapturedResult] = useState<ImportResult | null>(null)

  // Placement state
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(currentRoomId || null)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(currentDecisionId || null)
  const [newSelectionTitle, setNewSelectionTitle] = useState('')
  const [placementMode, setPlacementMode] = useState<'existing' | 'new'>('existing')
  const [changingDestination, setChangingDestination] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const hasPlacement = rooms && rooms.length > 0 && onImportToDecision
  const selectedRoom = rooms?.find((r) => r.id === selectedRoomId)

  // When URL capture completes
  function handleUrlCapture(result: ImportResult) {
    if (hasPlacement) {
      setCapturedResult(result)
      setStep('placement')
    } else {
      // Legacy fallback: no rooms context, import directly
      onImport(result)
    }
  }

  // Final save with placement
  function handleSave() {
    if (!capturedResult || !selectedRoomId || !onImportToDecision) return

    if (placementMode === 'new' && newSelectionTitle.trim()) {
      onImportToDecision(selectedRoomId, null, newSelectionTitle.trim(), capturedResult)
    } else if (placementMode === 'existing' && selectedDecisionId) {
      onImportToDecision(selectedRoomId, selectedDecisionId, undefined, capturedResult)
    } else {
      // No selection chosen → uncategorized
      onImportToDecision(selectedRoomId, null, undefined, capturedResult)
    }
    onClose()
  }

  const hasDefaultDestination = currentRoomId && currentDecisionId && !changingDestination
  const defaultRoom = rooms?.find((r) => r.id === currentRoomId)
  const defaultDecision = defaultRoom?.decisions.find((d) => d.id === currentDecisionId)

  const canSave = !!selectedRoomId && (
    placementMode === 'new' ? !!newSelectionTitle.trim() : true
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-basalt-50 border-t sm:border border-cream/15 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-4 z-10 rounded-t-xl">
          <div>
            <h2 className="text-lg font-medium text-cream">
              {step === 'placement' ? 'Save to...' : 'Save to HHC'}
            </h2>
            {step === 'placement' && capturedResult && (
              <p className="text-xs text-cream/40 mt-0.5 truncate max-w-[280px]">
                {capturedResult.name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0 ml-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* ── Step: Choose Method ── */}
          {step === 'choose-method' && (
            <div className="space-y-5">
              {/* Bookmarklet section — primary */}
              <div className="bg-sandstone/5 border border-sandstone/15 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-sandstone">Recommended</span>
                </div>
                <p className="text-sm text-cream/70 mb-3">
                  Captures images from any site — even ones that block automated fetching.
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-sandstone/20 text-sandstone text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">1</span>
                    <div>
                      <p className="text-xs text-cream/60 mb-1.5">Drag to your bookmarks bar:</p>
                      <BookmarkletButton compact />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-sandstone/20 text-sandstone text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">2</span>
                    <p className="text-xs text-cream/60">
                      Visit a product page and click it — images come back here automatically
                    </p>
                  </div>
                </div>
              </div>

              {/* URL section — secondary, collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setUrlSectionOpen(!urlSectionOpen)}
                  className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream/70 transition-colors w-full"
                >
                  <span className="text-xs text-cream/30">{urlSectionOpen ? '▼' : '▶'}</span>
                  Quick Import — Paste URL
                  <span className="text-[10px] text-cream/25 ml-auto">Some sites may block this</span>
                </button>

                {urlSectionOpen && (
                  <div className="mt-3">
                    {/* Blocked callout */}
                    {blocked && (
                      <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                        <p className="text-xs text-amber-400 font-medium mb-1">
                          This site blocked automated fetching.
                        </p>
                        <p className="text-[11px] text-cream/40">
                          Use the bookmarklet above to capture what you see — it works on any page.
                        </p>
                      </div>
                    )}

                    <ImportFromUrlPanel
                      mode="create-idea"
                      onImport={handleUrlCapture}
                      onCancel={onClose}
                      onBlocked={() => setBlocked(true)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step: Placement ── */}
          {step === 'placement' && hasPlacement && (
            <div className="space-y-4">
              {/* Default destination summary (when invoked from a decision page) */}
              {hasDefaultDestination && defaultRoom && defaultDecision && (
                <div className="bg-basalt rounded-lg p-3 border border-cream/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-cream/40">Destination</p>
                      <p className="text-sm text-cream/80 mt-0.5">
                        {defaultRoom.name} → {defaultDecision.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChangingDestination(true)}
                      className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Room + Selection pickers (shown when no default or changing) */}
              {(!hasDefaultDestination || changingDestination) && rooms && (
                <div className="space-y-4">
                  {/* Room picker */}
                  <div>
                    <label className="block text-xs text-cream/50 mb-2">
                      Room <span className="text-cream/30">(required)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {rooms.map((room) => {
                        const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'
                        const isActive = selectedRoomId === room.id
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(room.id)
                              setSelectedDecisionId(null)
                              setPlacementMode('existing')
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all ${
                              isActive
                                ? 'border-sandstone bg-sandstone/10'
                                : 'border-cream/10 hover:border-cream/25 bg-basalt'
                            }`}
                          >
                            <span className="text-sm">{emoji}</span>
                            <div className="min-w-0">
                              <p className={`text-xs font-medium truncate ${isActive ? 'text-sandstone' : 'text-cream'}`}>
                                {room.name}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selection picker */}
                  {selectedRoom && (
                    <div>
                      <label className="block text-xs text-cream/50 mb-2">
                        Selection
                      </label>

                      {/* Mode toggle */}
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setPlacementMode('existing')}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                            placementMode === 'existing'
                              ? 'bg-sandstone/20 text-sandstone'
                              : 'bg-cream/10 text-cream/50 hover:text-cream/70'
                          }`}
                        >
                          Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPlacementMode('new'); setSelectedDecisionId(null) }}
                          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                            placementMode === 'new'
                              ? 'bg-sandstone/20 text-sandstone'
                              : 'bg-cream/10 text-cream/50 hover:text-cream/70'
                          }`}
                        >
                          + New
                        </button>
                      </div>

                      {placementMode === 'existing' ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                            {selectedRoom.decisions
                              .filter((d) => d.systemKey !== 'uncategorized')
                              .map((decision) => {
                                const isActive = selectedDecisionId === decision.id
                                return (
                                  <button
                                    key={decision.id}
                                    type="button"
                                    onClick={() => setSelectedDecisionId(isActive ? null : decision.id)}
                                    className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${
                                      isActive
                                        ? 'border-sandstone bg-sandstone/10'
                                        : 'border-cream/10 hover:border-cream/25 bg-basalt'
                                    }`}
                                  >
                                    <p className={`text-xs font-medium truncate ${isActive ? 'text-sandstone' : 'text-cream'}`}>
                                      {decision.title}
                                    </p>
                                  </button>
                                )
                              })}
                          </div>
                          {!selectedDecisionId && (
                            <p className="text-[11px] text-cream/30 mt-1.5">
                              No selection? Idea will go to Uncategorized.
                            </p>
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={newSelectionTitle}
                          onChange={(e) => setNewSelectionTitle(e.target.value)}
                          placeholder="e.g. Vanity, Backsplash..."
                          autoFocus
                          className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('choose-method'); setCapturedResult(null) }}
                  className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save Idea
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
