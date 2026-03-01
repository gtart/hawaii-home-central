'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { RoomTypeV3, RoomV3 } from '@/data/finish-decisions'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForRoomType, findKitsForDecisionTitle } from '@/lib/finish-decision-kits'
import { cn } from '@/lib/utils'

// ── Disclosure badges ──

const DISCLOSURE_BADGES: Record<string, { label: string; micro?: string; className: string }> = {
  hhc: {
    label: 'Editorial',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  },
  designer: {
    label: 'Designer',
    className: 'bg-blue-500/15 text-blue-300 border-blue-400/25',
  },
  vendor: {
    label: 'Sponsored',
    micro: 'Paid placement. Always labeled.',
    className: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  },
  affiliate: {
    label: 'Affiliate',
    micro: 'Links may earn a commission.',
    className: 'bg-orange-500/15 text-orange-300 border-orange-400/25',
  },
  paid: {
    label: 'Paid pack',
    micro: 'One-time purchase. Reuse anytime.',
    className: 'bg-purple-500/15 text-purple-300 border-purple-400/25',
  },
}

function DisclosureBadge({ author }: { author: string }) {
  const badge = DISCLOSURE_BADGES[author] || {
    label: author,
    className: 'bg-cream/10 text-cream/50',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase',
        badge.className
      )}
      title={badge.micro}
    >
      {badge.label}
    </span>
  )
}

// ── Tabs ──

type ModalTab = 'recommended' | 'my-packs' | 'browse'

export function IdeasPackModal({
  roomType,
  roomName,
  decisionTitle,
  appliedKitIds,
  decisionAppliedKitIds,
  ownedKitIds = [],
  onApply,
  onAcquireKit,
  onRemoveKit,
  onClose,
  kits = [],
  // Destination picker props
  rooms,
  selectedRoomId,
  onSelectRoomId,
  showDestinationPicker = false,
}: {
  roomType: RoomTypeV3
  roomName: string
  decisionTitle?: string
  appliedKitIds: string[]
  /** In decision mode, kit IDs that already have options in this decision (from option.origin.kitId) */
  decisionAppliedKitIds?: string[]
  ownedKitIds?: string[]
  onApply: (kit: FinishDecisionKit, targetRoomId?: string) => void
  onAcquireKit?: (kitId: string) => void
  onRemoveKit?: (kitId: string) => void
  onClose: () => void
  kits?: FinishDecisionKit[]
  // Destination picker
  rooms?: RoomV3[]
  selectedRoomId?: string
  onSelectRoomId?: (id: string) => void
  showDestinationPicker?: boolean
}) {
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ModalTab>('recommended')
  const [showAllInRecommended, setShowAllInRecommended] = useState(false)

  // Decision-level mode: only show kits matching this title
  const isDecisionMode = !!decisionTitle

  // Active room type for filtering (may change with destination picker)
  const activeRoomType = useMemo(() => {
    if (showDestinationPicker && rooms && selectedRoomId) {
      const r = rooms.find((r) => r.id === selectedRoomId)
      return (r?.type as RoomTypeV3) || roomType
    }
    return roomType
  }, [showDestinationPicker, rooms, selectedRoomId, roomType])

  const activeRoomName = useMemo(() => {
    if (showDestinationPicker && rooms && selectedRoomId) {
      const r = rooms.find((r) => r.id === selectedRoomId)
      return r?.name || roomName
    }
    return roomName
  }, [showDestinationPicker, rooms, selectedRoomId, roomName])

  const activeAppliedKitIds = useMemo(() => {
    if (showDestinationPicker && rooms && selectedRoomId) {
      const r = rooms.find((r) => r.id === selectedRoomId)
      return r?.appliedKitIds || []
    }
    return appliedKitIds
  }, [showDestinationPicker, rooms, selectedRoomId, appliedKitIds])

  // Compute kit lists per tab
  const fittingKits = isDecisionMode
    ? findKitsForDecisionTitle(kits, decisionTitle!, activeRoomType)
    : findKitsForRoomType(kits, activeRoomType)

  const ownedKits = kits.filter((k) => ownedKitIds.includes(k.id))
  const allKits = kits

  const getTabKits = (): FinishDecisionKit[] => {
    switch (activeTab) {
      case 'recommended':
        return showAllInRecommended ? allKits : fittingKits
      case 'my-packs':
        return ownedKits
      case 'browse':
        return allKits
      default:
        return fittingKits
    }
  }

  const tabKits = getTabKits()
  const selectedKit = tabKits.find((k) => k.id === selectedKitId)

  function handleApply() {
    if (!selectedKit) return
    const targetId = showDestinationPicker ? selectedRoomId : undefined
    onApply(selectedKit, targetId)
    onClose()
  }

  function handleRemove() {
    if (!selectedKit || !onRemoveKit) return
    onRemoveKit(selectedKit.id)
    onClose()
  }

  function handleGetPack() {
    if (!selectedKit || !onAcquireKit) return
    onAcquireKit(selectedKit.id)
  }

  // In decision mode, use decision-level applied state (from option.origin.kitId)
  const effectiveAppliedKitIds = isDecisionMode && decisionAppliedKitIds
    ? decisionAppliedKitIds
    : activeAppliedKitIds

  // CTA text depends on state
  function getApplyLabel(kit: FinishDecisionKit): string {
    const isApplied = effectiveAppliedKitIds.includes(kit.id)
    if (isDecisionMode) {
      return isApplied ? 'Re-sync options' : 'Add Options'
    }
    return isApplied ? 'Re-sync pack' : 'Apply to this board'
  }

  const TABS: { key: ModalTab; label: string; count: number }[] = isDecisionMode
    ? [{ key: 'recommended', label: 'Matching', count: fittingKits.length }]
    : [
        { key: 'recommended', label: 'Recommended', count: fittingKits.length },
        { key: 'my-packs', label: 'My Packs', count: ownedKits.length },
        { key: 'browse', label: 'Browse all', count: allKits.length },
      ]

  // Smart-sorted rooms for destination picker
  const sortedRooms = useMemo(() => {
    if (!rooms || !selectedKit) return rooms || []
    const kitRoomTypes = selectedKit.roomTypes
    return [...rooms].sort((a, b) => {
      const aFits = kitRoomTypes.length === 0 || kitRoomTypes.includes(a.type as RoomTypeV3)
      const bFits = kitRoomTypes.length === 0 || kitRoomTypes.includes(b.type as RoomTypeV3)
      if (aFits && !bFits) return -1
      if (!aFits && bFits) return 1
      return a.name.localeCompare(b.name)
    })
  }, [rooms, selectedKit])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt border-t sm:border border-cream/15 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-cream/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-cream">
              {decisionTitle ? `Options for \u201c${decisionTitle}\u201d` : 'Decision Packs'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-cream/40 hover:text-cream transition-colors p-1 -mr-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-cream/40 mt-1">
            {decisionTitle
              ? 'Adds curated options to this decision so you have more to compare.'
              : 'Decision Packs add curated options to your decisions\u2014so you can compare and choose faster.'}
          </p>

          {/* Destination line */}
          {!isDecisionMode && (
            <div className="mt-2">
              {showDestinationPicker && rooms && onSelectRoomId ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-cream/40">Apply to:</span>
                  <select
                    value={selectedRoomId || ''}
                    onChange={(e) => onSelectRoomId(e.target.value)}
                    className="bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-1 text-xs text-cream focus:outline-none focus:border-sandstone/50 max-w-[200px]"
                  >
                    {(selectedKit ? sortedRooms : rooms).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-cream/30">
                  Applying to: <span className="text-cream/50 font-medium">{activeRoomName}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabs (only in room mode with multiple tabs) */}
        {TABS.length > 1 && (
          <div className="px-5 pt-2 flex gap-1 border-b border-cream/10">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key)
                  setSelectedKitId(null)
                  setShowAllInRecommended(false)
                }}
                className={cn(
                  'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.key
                    ? 'border-sandstone text-sandstone'
                    : 'border-transparent text-cream/50 hover:text-cream/70'
                )}
              >
                {tab.label}
                <span className="ml-1 text-[10px] opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Kit list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {tabKits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-cream/40 text-sm">
                {activeTab === 'my-packs'
                  ? "You don\u2019t own any Decision Packs yet."
                  : `No Decision Packs available for this ${decisionTitle ? 'decision' : 'room type'}.`}
              </p>
              {activeTab === 'my-packs' && (
                <div className="flex flex-col items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('browse')}
                    className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                  >
                    Browse available packs
                  </button>
                  <Link
                    href={selectedRoomId
                      ? `/app/packs?returnTo=${encodeURIComponent('/app/tools/finish-decisions')}&roomId=${selectedRoomId}&roomName=${encodeURIComponent(activeRoomName)}`
                      : '/app/packs'}
                    onClick={onClose}
                    className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
                  >
                    Visit the Packs marketplace
                  </Link>
                </div>
              )}
            </div>
          ) : (
            tabKits.map((kit) => {
              const isApplied = effectiveAppliedKitIds.includes(kit.id)
              const isOwned = ownedKitIds.includes(kit.id)
              const isSelected = selectedKitId === kit.id
              const fits = fittingKits.some((k) => k.id === kit.id)

              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => setSelectedKitId(isSelected ? null : kit.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-sandstone bg-sandstone/5'
                      : 'border-transparent bg-basalt-50 hover:border-cream/15'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-cream font-medium text-sm">{kit.label}</span>
                    <DisclosureBadge author={kit.author} />
                    {isApplied && (
                      <span className="px-1.5 py-0.5 bg-sandstone/20 rounded text-[10px] text-sandstone">
                        Applied
                      </span>
                    )}
                    {isOwned && !isApplied && (
                      <span className="px-1.5 py-0.5 bg-cream/10 rounded text-[10px] text-cream/40">
                        Owned
                      </span>
                    )}
                    {!fits && activeTab !== 'recommended' && (
                      <span className="px-1.5 py-0.5 bg-cream/5 rounded text-[10px] text-cream/30">
                        Other rooms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream/50 leading-relaxed">{kit.description}</p>
                  <p className="text-[11px] text-cream/30 mt-1.5">
                    {kit.decisions.length} decision{kit.decisions.length !== 1 ? 's' : ''},{' '}
                    {kit.decisions.reduce((s, d) => s + d.options.length, 0)} option
                    {kit.decisions.reduce((s, d) => s + d.options.length, 0) !== 1 ? 's' : ''}
                  </p>

                  {/* Expanded preview when selected */}
                  {isSelected && (() => {
                    // In decision mode, highlight the matching decision within the pack
                    const matchTitle = decisionTitle?.toLowerCase().trim()
                    // Sort: matching decision first when in decision mode
                    const sortedDecs = isDecisionMode && matchTitle
                      ? [...kit.decisions].sort((a, b) => {
                          const aMatch = a.title.toLowerCase().trim() === matchTitle
                          const bMatch = b.title.toLowerCase().trim() === matchTitle
                          if (aMatch && !bMatch) return -1
                          if (!aMatch && bMatch) return 1
                          return 0
                        })
                      : kit.decisions

                    return (
                      <div className="mt-3 pt-3 border-t border-cream/10 space-y-2">
                        {sortedDecs.map((dec) => {
                          const isMatchingDec = isDecisionMode && matchTitle && dec.title.toLowerCase().trim() === matchTitle
                          return (
                            <div
                              key={dec.title}
                              className={cn(
                                isMatchingDec && 'bg-sandstone/10 -mx-2 px-2 py-1.5 rounded-lg border border-sandstone/20'
                              )}
                            >
                              <span className={cn(
                                'text-xs font-medium',
                                isMatchingDec ? 'text-sandstone' : 'text-cream/60'
                              )}>
                                {dec.title}
                                {isMatchingDec && (
                                  <span className="ml-1.5 text-[10px] text-sandstone/60 font-normal">
                                    — matches your decision
                                  </span>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dec.options.map((opt) => (
                                  <span
                                    key={opt.name}
                                    className={cn(
                                      'inline-block px-2 py-0.5 rounded text-[11px]',
                                      isMatchingDec ? 'bg-sandstone/15 text-sandstone/70' : 'bg-cream/10 text-cream/50'
                                    )}
                                  >
                                    {opt.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </button>
              )
            })
          )}

          {/* "Show all" link in Recommended tab */}
          {activeTab === 'recommended' && !showAllInRecommended && !isDecisionMode && allKits.length > fittingKits.length && (
            <button
              type="button"
              onClick={() => setShowAllInRecommended(true)}
              className="w-full text-center py-2 text-xs text-cream/40 hover:text-cream/60 transition-colors"
            >
              Show all packs ({allKits.length})
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-cream/10">
          {/* Get pack + Remove row (when kit selected) */}
          {selectedKit && !isDecisionMode && (
            <div className="flex items-center gap-2 mb-3">
              {onAcquireKit && !ownedKitIds.includes(selectedKit.id) && (
                <button
                  type="button"
                  onClick={handleGetPack}
                  className="text-xs text-sandstone hover:text-sandstone-light transition-colors font-medium"
                >
                  Get pack
                </button>
              )}
              {onRemoveKit && activeAppliedKitIds.includes(selectedKit.id) && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-auto"
                >
                  Remove from this board
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedKit}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {selectedKit ? getApplyLabel(selectedKit) : (decisionTitle ? 'Add Options' : 'Apply to this board')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
