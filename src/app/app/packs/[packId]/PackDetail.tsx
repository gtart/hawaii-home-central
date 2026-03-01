'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import type { FinishDecisionsPayloadV3, RoomTypeV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP, ROOM_TYPE_OPTIONS_V3 } from '@/data/finish-decisions'
import { cn } from '@/lib/utils'

const AUTHOR_LABELS: Record<string, { label: string; description: string; className: string }> = {
  hhc: {
    label: 'Editorial',
    description: 'Curated by the Hawaii Home Central editorial team.',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  },
  designer: {
    label: 'Designer',
    description: 'Created by a professional interior designer.',
    className: 'bg-blue-500/15 text-blue-300 border-blue-400/25',
  },
  vendor: {
    label: 'Sponsored',
    description: 'Paid placement by a vendor partner. Always labeled.',
    className: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  },
  affiliate: {
    label: 'Affiliate',
    description: 'Links may earn a commission.',
    className: 'bg-orange-500/15 text-orange-300 border-orange-400/25',
  },
  paid: {
    label: 'Paid pack',
    description: 'One-time purchase. Reuse anytime.',
    className: 'bg-purple-500/15 text-purple-300 border-purple-400/25',
  },
}

function roomTypeLabel(type: RoomTypeV3): string {
  return ROOM_TYPE_OPTIONS_V3.find((o) => o.value === type)?.label || type
}

export function PackDetail({
  packId,
  kits,
}: {
  packId: string
  kits: FinishDecisionKit[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const kit = kits.find((k) => k.id === packId)

  // Context params — where user came from
  const returnTo = searchParams.get('returnTo')
  const contextRoomId = searchParams.get('roomId')
  const contextRoomName = searchParams.get('roomName')

  const { state, setState, isLoaded } = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })

  const [toast, setToast] = useState<{ text: string } | null>(null)
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null)

  const ownedKitIds: string[] = isLoaded && state.version === 3
    ? (state as FinishDecisionsPayloadV3).ownedKitIds || []
    : []

  const isOwned = kit ? ownedKitIds.includes(kit.id) : false

  function acquireKit() {
    if (!kit) return
    setState((prev: any) => {
      const p = prev as FinishDecisionsPayloadV3
      const existing = p.ownedKitIds || []
      if (existing.includes(kit.id)) return prev
      return { ...p, ownedKitIds: [...existing, kit.id] }
    })
    setToast({ text: `"${kit.label}" added to My Packs!` })
    setTimeout(() => setToast(null), 6000)
  }

  function handleApplyToBoard() {
    if (!kit) return
    if (returnTo && contextRoomId) {
      router.push(`${returnTo}?openPacks=1&roomId=${contextRoomId}&highlightPackId=${kit.id}`)
    } else {
      router.push('/app/tools/finish-decisions?openPacks=1' + (kit ? `&highlightPackId=${kit.id}` : ''))
    }
  }

  if (!kit) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-cream/50 mb-4">Pack not found.</p>
          <Link
            href="/app/packs"
            className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
          >
            &larr; Browse all packs
          </Link>
        </div>
      </div>
    )
  }

  const totalIdeas = kit.decisions.reduce((s, d) => s + d.options.length, 0)
  const authorInfo = AUTHOR_LABELS[kit.author]

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href={returnTo ? `/app/packs?returnTo=${encodeURIComponent(returnTo)}&roomId=${contextRoomId || ''}&roomName=${encodeURIComponent(contextRoomName || '')}` : '/app/packs'}
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-6 inline-block"
        >
          &larr; All Decision Packs
        </Link>

        {/* Header card */}
        <div className="bg-basalt-50 rounded-card border border-cream/10 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="font-serif text-2xl md:text-3xl text-sandstone">
                  {kit.label}
                </h1>
                {authorInfo && (
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium uppercase',
                      authorInfo.className
                    )}
                  >
                    {authorInfo.label}
                  </span>
                )}
              </div>
              <p className="text-cream/60 leading-relaxed mb-4">
                {kit.description}
              </p>

              {/* Author disclosure */}
              {authorInfo && (
                <p className="text-[11px] text-cream/30 italic mb-4">
                  {authorInfo.description}
                </p>
              )}

              {/* Room type tags */}
              {kit.roomTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] text-cream/30 self-center mr-1">
                    Best for:
                  </span>
                  {kit.roomTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream/5 rounded text-xs text-cream/50"
                    >
                      {ROOM_EMOJI_MAP[type] || ''} {roomTypeLabel(type)}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-cream/80 font-medium">
                    {kit.decisions.length}
                  </span>
                  <span className="text-cream/40 ml-1">
                    decision{kit.decisions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  <span className="text-cream/80 font-medium">{totalIdeas}</span>
                  <span className="text-cream/40 ml-1">
                    curated idea{totalIdeas !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              {isOwned ? (
                <>
                  <button
                    type="button"
                    onClick={handleApplyToBoard}
                    className="px-6 py-2.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors text-sm text-center"
                  >
                    {contextRoomName ? `Apply to ${contextRoomName}` : 'Apply to a board'}
                  </button>
                  <span className="inline-flex items-center gap-1 text-[11px] text-green-400/70">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    In My Packs
                  </span>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={acquireKit}
                    className="px-6 py-2.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors text-sm"
                  >
                    Get Pack — Free
                  </button>
                  <span className="text-[11px] text-cream/30">
                    Always free. No commitment.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* What's inside */}
        <h2 className="text-lg font-medium text-cream mb-4">
          What&rsquo;s inside
        </h2>

        <div className="space-y-2">
          {kit.decisions.map((dec) => {
            const isExpanded = expandedDecision === dec.title
            return (
              <div
                key={dec.title}
                className="bg-basalt-50 rounded-lg border border-cream/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedDecision(isExpanded ? null : dec.title)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream/[0.02] transition-colors"
                >
                  <span className="text-cream/40 text-xs select-none">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className="flex-1 text-sm text-cream/80 font-medium">
                    {dec.title}
                  </span>
                  <span className="text-xs text-cream/30 shrink-0">
                    {dec.options.length} idea
                    {dec.options.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-cream/5">
                    <div className="space-y-3">
                      {dec.options.map((opt) => (
                        <div key={opt.name} className="pl-6">
                          <span className="text-sm text-cream/70 font-medium block">
                            {opt.name}
                          </span>
                          {opt.notes && (
                            <p className="text-xs text-cream/40 mt-0.5 leading-relaxed whitespace-pre-wrap">
                              {opt.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          {isOwned ? (
            <button
              type="button"
              onClick={handleApplyToBoard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              {contextRoomName ? `Apply to ${contextRoomName}` : 'Apply to your boards'}
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M5 12h14m-7-7 7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={acquireKit}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              Get This Pack — Free
            </button>
          )}
        </div>
      </div>

      {/* Toast with contextual CTA */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-cream/70 flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={() => {
              setToast(null)
              handleApplyToBoard()
            }}
            className="text-xs text-sandstone font-medium hover:text-sandstone-light transition-colors shrink-0"
          >
            {contextRoomName ? `Apply to ${contextRoomName}` : 'Apply'}
          </button>
        </div>
      )}
    </div>
  )
}
