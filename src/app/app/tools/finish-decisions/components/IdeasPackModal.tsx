'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForDecisionTitle } from '@/lib/finish-decision-kits'
import { ROOM_TYPE_OPTIONS_V3 } from '@/data/finish-decisions'
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
    className: 'bg-cream/10 text-cream/65',
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
  decisionTitle,
  appliedKitIds,
  decisionAppliedKitIds,
  ownedKitIds = [],
  onApply,
  onAcquireKit,
  onRemoveKit,
  onClose,
  kits = [],
}: {
  decisionTitle?: string
  appliedKitIds: string[]
  decisionAppliedKitIds?: string[]
  ownedKitIds?: string[]
  onApply: (kit: FinishDecisionKit) => void
  onAcquireKit?: (kitId: string) => void
  onRemoveKit?: (kitId: string) => void
  onClose: () => void
  kits?: FinishDecisionKit[]
}) {
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ModalTab>('recommended')
  const [showAllInRecommended, setShowAllInRecommended] = useState(false)
  const [roomFilter, setRoomFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Decision-level mode: only show kits matching this title
  const isDecisionMode = !!decisionTitle

  // In workspace mode, all kits are "fitting" (no room type filter)
  const fittingKits = isDecisionMode
    ? findKitsForDecisionTitle(kits, decisionTitle!, 'other')
    : kits

  const ownedKits = kits.filter((k) => ownedKitIds.includes(k.id))
  const allKits = kits

  const getTabKits = (): FinishDecisionKit[] => {
    let base: FinishDecisionKit[]
    switch (activeTab) {
      case 'recommended':
        base = showAllInRecommended ? allKits : fittingKits
        break
      case 'my-packs':
        base = ownedKits
        break
      case 'browse':
        base = allKits
        break
      default:
        base = fittingKits
    }
    // Apply room filter (workspace mode only)
    if (roomFilter && !isDecisionMode) {
      base = base.filter((k) => k.roomTypes.includes(roomFilter as never) || k.roomTypes.length === 0)
    }
    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      base = base.filter((k) =>
        k.label.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q) ||
        k.decisions.some((d) => d.title.toLowerCase().includes(q))
      )
    }
    return base
  }

  // Room types that exist in available kits
  const availableRoomTypes = !isDecisionMode
    ? ROOM_TYPE_OPTIONS_V3.filter((rt) => kits.some((k) => k.roomTypes.includes(rt.value as never)))
    : []

  const tabKits = getTabKits()
  const selectedKit = tabKits.find((k) => k.id === selectedKitId)

  function handleApply() {
    if (!selectedKit) return
    onApply(selectedKit)
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
    : appliedKitIds

  // CTA text depends on state
  function getApplyLabel(kit: FinishDecisionKit): string {
    const isApplied = effectiveAppliedKitIds.includes(kit.id)
    if (isDecisionMode) {
      return isApplied ? 'Re-sync options' : 'Add Options'
    }
    return isApplied ? 'Re-sync pack' : 'Apply to this list'
  }

  const TABS: { key: ModalTab; label: string; count: number }[] = isDecisionMode
    ? [{ key: 'recommended', label: 'Matching', count: fittingKits.length }]
    : [
        { key: 'recommended', label: 'All Packs', count: fittingKits.length },
        { key: 'my-packs', label: 'My Packs', count: ownedKits.length },
      ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt border-t sm:border border-cream/15 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-cream/15">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-cream">
              {decisionTitle ? `Options for \u201c${decisionTitle}\u201d` : 'Add an Idea Pack'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-cream/55 hover:text-cream transition-colors p-1 -mr-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-cream/55 mt-1">
            {decisionTitle
              ? 'Adds curated options to this selection so you have more to compare.'
              : 'Quick-start your room with selections you\u2019ll likely need\u2014plus curated options to compare.'}
          </p>
        </div>

        {/* Tabs */}
        {TABS.length > 1 && (
          <div className="px-5 pt-2 flex gap-1 border-b border-cream/15">
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
                    : 'border-transparent text-cream/65 hover:text-cream/80'
                )}
              >
                {tab.label}
                <span className="ml-1 text-[10px] opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search + room filter (workspace mode only) */}
        {!isDecisionMode && (
          <div className="px-5 pt-3 space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packs by name or selection..."
              className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-sandstone/40"
            />
            {availableRoomTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoomFilter(null)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                    !roomFilter
                      ? 'bg-sandstone/25 text-sandstone ring-1 ring-sandstone/40'
                      : 'bg-cream/8 text-cream/65 hover:text-cream/80'
                  )}
                >
                  All rooms
                </button>
                {availableRoomTypes.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setRoomFilter(roomFilter === rt.value ? null : rt.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                      roomFilter === rt.value
                        ? 'bg-sandstone/25 text-sandstone ring-1 ring-sandstone/40'
                        : 'bg-cream/8 text-cream/65 hover:text-cream/80'
                    )}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Kit list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {tabKits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-cream/55 text-sm">
                {activeTab === 'my-packs'
                  ? "You don\u2019t own any Idea Packs yet."
                  : `No Idea Packs available${decisionTitle ? ' for this selection' : ''}.`}
              </p>
              {activeTab === 'my-packs' && (
                <div className="flex flex-col items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('recommended')}
                    className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                  >
                    Browse available packs
                  </button>
                  <Link
                    href="/app/packs"
                    onClick={onClose}
                    className="text-xs text-cream/55 hover:text-cream/70 transition-colors"
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

              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => setSelectedKitId(isSelected ? null : kit.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-all',
                    isSelected
                      ? 'border-sandstone bg-sandstone/5'
                      : 'border-transparent bg-stone hover:border-cream/15'
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
                      <span className="px-1.5 py-0.5 bg-cream/10 rounded text-[10px] text-cream/55">
                        Owned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream/65 leading-relaxed">{kit.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="text-[11px] text-cream/45">
                      {kit.decisions.length} selection{kit.decisions.length !== 1 ? 's' : ''},{' '}
                      {kit.decisions.reduce((s, d) => s + d.options.length, 0)} option
                      {kit.decisions.reduce((s, d) => s + d.options.length, 0) !== 1 ? 's' : ''}
                    </p>
                    {kit.roomTypes.length > 0 && (
                      <div className="flex gap-1">
                        {kit.roomTypes.map((rt) => {
                          const label = ROOM_TYPE_OPTIONS_V3.find((r) => r.value === rt)?.label
                          return label ? (
                            <span key={rt} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cream/6 text-[10px] text-cream/55">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {label}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>

                  {/* Expanded preview when selected */}
                  {isSelected && (() => {
                    const matchTitle = decisionTitle?.toLowerCase().trim()
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
                      <div className="mt-3 pt-3 border-t border-cream/15 space-y-2">
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
                                isMatchingDec ? 'text-sandstone' : 'text-cream/70'
                              )}>
                                {dec.title}
                                {isMatchingDec && (
                                  <span className="ml-1.5 text-[10px] text-sandstone/60 font-normal">
                                    — matches your selection
                                  </span>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dec.options.map((opt) => (
                                  <span
                                    key={opt.name}
                                    className={cn(
                                      'inline-block px-2 py-0.5 rounded text-[11px]',
                                      isMatchingDec ? 'bg-sandstone/15 text-sandstone/70' : 'bg-cream/10 text-cream/65'
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
              className="w-full text-center py-2 text-xs text-cream/55 hover:text-cream/70 transition-colors"
            >
              Show all packs ({allKits.length})
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-cream/15">
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
              {onRemoveKit && appliedKitIds.includes(selectedKit.id) && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-auto"
                >
                  Remove from this list
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-cream/70 hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedKit}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {selectedKit ? getApplyLabel(selectedKit) : (decisionTitle ? 'Add Options' : 'Apply to this list')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
