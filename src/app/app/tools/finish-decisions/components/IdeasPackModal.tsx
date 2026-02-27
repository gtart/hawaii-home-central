'use client'

import { useState } from 'react'
import type { RoomTypeV3 } from '@/data/finish-decisions'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForRoomType, findKitsForDecisionTitle } from '@/lib/finish-decision-kits'

const AUTHOR_LABELS: Record<string, string> = {
  hhc: 'HHC',
  designer: 'Designer',
  vendor: 'Vendor',
}

export function IdeasPackModal({
  roomType,
  roomName,
  decisionTitle,
  appliedKitIds,
  onApply,
  onClose,
  kits = [],
}: {
  roomType: RoomTypeV3
  roomName: string
  /** If set, modal is in decision-level mode (only show kits matching this title) */
  decisionTitle?: string
  appliedKitIds: string[]
  onApply: (kit: FinishDecisionKit) => void
  onClose: () => void
  kits?: FinishDecisionKit[]
}) {
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)

  const availableKits = decisionTitle
    ? findKitsForDecisionTitle(kits, decisionTitle, roomType)
    : findKitsForRoomType(kits, roomType)

  const selectedKit = availableKits.find((k) => k.id === selectedKitId)

  function handleApply() {
    if (!selectedKit) return
    onApply(selectedKit)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt border border-cream/15 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-cream/10">
          <h2 className="text-lg font-medium text-cream">
            {decisionTitle ? `Ideas for "${decisionTitle}"` : `Idea Packs for ${roomName}`}
          </h2>
          <p className="text-xs text-cream/40 mt-1">
            {decisionTitle
              ? 'Adds ideas to this decision so you have options to compare.'
              : 'Adds starter decisions and ideas to this room.'}
          </p>
        </div>

        {/* Kit list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {availableKits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-cream/40 text-sm">
                No ideas packs available for this {decisionTitle ? 'decision' : 'room type'}.
              </p>
            </div>
          ) : (
            availableKits.map((kit) => {
              const isApplied = appliedKitIds.includes(kit.id)
              const isSelected = selectedKitId === kit.id

              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => setSelectedKitId(isSelected ? null : kit.id)}
                  disabled={isApplied}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isApplied
                      ? 'border-cream/5 bg-cream/5 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'border-sandstone bg-sandstone/5'
                        : 'border-transparent bg-basalt-50 hover:border-cream/15'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cream font-medium text-sm">{kit.label}</span>
                    <span className="px-1.5 py-0.5 bg-cream/10 rounded text-[10px] text-cream/50 uppercase">
                      {AUTHOR_LABELS[kit.author] || kit.author}
                    </span>
                    {isApplied && (
                      <span className="px-1.5 py-0.5 bg-sandstone/20 rounded text-[10px] text-sandstone">
                        Applied
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cream/50 leading-relaxed">{kit.description}</p>
                  <p className="text-[11px] text-cream/30 mt-1.5">
                    {kit.decisions.length} decision{kit.decisions.length !== 1 ? 's' : ''},{' '}
                    {kit.decisions.reduce((s, d) => s + d.options.length, 0)} idea{kit.decisions.reduce((s, d) => s + d.options.length, 0) !== 1 ? 's' : ''}
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
            {decisionTitle ? 'Add Ideas' : 'Add to Room'}
          </button>
        </div>
      </div>
    </div>
  )
}
