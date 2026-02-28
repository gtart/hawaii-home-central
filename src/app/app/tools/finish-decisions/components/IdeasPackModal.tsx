'use client'

import { useState } from 'react'
import type { RoomTypeV3 } from '@/data/finish-decisions'
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
  ownedKitIds = [],
  onApply,
  onClose,
  kits = [],
}: {
  roomType: RoomTypeV3
  roomName: string
  decisionTitle?: string
  appliedKitIds: string[]
  ownedKitIds?: string[]
  onApply: (kit: FinishDecisionKit) => void
  onClose: () => void
  kits?: FinishDecisionKit[]
}) {
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ModalTab>('recommended')
  const [showAllInRecommended, setShowAllInRecommended] = useState(false)

  // Decision-level mode: only show kits matching this title
  const isDecisionMode = !!decisionTitle

  // Compute kit lists per tab
  const fittingKits = isDecisionMode
    ? findKitsForDecisionTitle(kits, decisionTitle!, roomType)
    : findKitsForRoomType(kits, roomType)

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
    onApply(selectedKit)
    onClose()
  }

  // CTA text depends on state
  function getApplyLabel(kit: FinishDecisionKit): string {
    const isApplied = appliedKitIds.includes(kit.id)
    if (isDecisionMode) {
      return isApplied ? 'Re-sync ideas' : 'Add Ideas'
    }
    return isApplied ? 'Re-sync pack' : 'Add to Room'
  }

  const TABS: { key: ModalTab; label: string; count: number }[] = isDecisionMode
    ? [{ key: 'recommended', label: 'Matching', count: fittingKits.length }]
    : [
        { key: 'recommended', label: 'Recommended', count: fittingKits.length },
        { key: 'my-packs', label: 'My Packs', count: ownedKits.length },
        { key: 'browse', label: 'Browse all', count: allKits.length },
      ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt border border-cream/15 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-cream/10">
          <h2 className="text-lg font-medium text-cream">
            {decisionTitle ? `Ideas for \u201c${decisionTitle}\u201d` : `Idea Packs for ${roomName}`}
          </h2>
          <p className="text-xs text-cream/40 mt-1">
            {decisionTitle
              ? 'Adds ideas to this decision so you have options to compare.'
              : 'Adds starter decisions and ideas to this room.'}
          </p>
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
                  ? "You don\u2019t own any Idea Packs yet."
                  : `No idea packs available for this ${decisionTitle ? 'decision' : 'room type'}.`}
              </p>
              {activeTab === 'my-packs' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="mt-2 text-xs text-sandstone hover:text-sandstone-light transition-colors"
                >
                  Browse Idea Packs
                </button>
              )}
            </div>
          ) : (
            tabKits.map((kit) => {
              const isApplied = appliedKitIds.includes(kit.id)
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
                    {kit.decisions.reduce((s, d) => s + d.options.length, 0)} idea
                    {kit.decisions.reduce((s, d) => s + d.options.length, 0) !== 1 ? 's' : ''}
                  </p>

                  {/* Expanded preview when selected */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-cream/10 space-y-2">
                      {kit.decisions.map((dec) => (
                        <div key={dec.title}>
                          <span className="text-xs text-cream/60 font-medium">{dec.title}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dec.options.map((opt) => (
                              <span
                                key={opt.name}
                                className="inline-block px-2 py-0.5 bg-cream/10 rounded text-[11px] text-cream/50"
                              >
                                {opt.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
        <div className="px-5 py-4 border-t border-cream/10 flex items-center justify-end gap-3">
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
            {selectedKit ? getApplyLabel(selectedKit) : (decisionTitle ? 'Add Ideas' : 'Add to Room')}
          </button>
        </div>
      </div>
    </div>
  )
}
