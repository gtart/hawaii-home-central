'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import type { FinishDecisionsPayloadV3, RoomTypeV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP, ROOM_TYPE_OPTIONS_V3 } from '@/data/finish-decisions'
import { cn } from '@/lib/utils'

const AUTHOR_LABELS: Record<string, { label: string; className: string }> = {
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
    className: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  },
}

function AuthorBadge({ author }: { author: string }) {
  const badge = AUTHOR_LABELS[author] || {
    label: author,
    className: 'bg-cream/10 text-cream/50 border-cream/20',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase',
        badge.className
      )}
    >
      {badge.label}
    </span>
  )
}

function roomTypeLabel(type: RoomTypeV3): string {
  return ROOM_TYPE_OPTIONS_V3.find((o) => o.value === type)?.label || type
}

export function PacksMarketplace({ kits }: { kits: FinishDecisionKit[] }) {
  const { state, setState, isLoaded } = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })

  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeV3 | 'all'>('all')
  const [toast, setToast] = useState<string | null>(null)

  const ownedKitIds: string[] = isLoaded && state.version === 3
    ? (state as FinishDecisionsPayloadV3).ownedKitIds || []
    : []

  function acquireKit(kitId: string) {
    setState((prev: any) => {
      const p = prev as FinishDecisionsPayloadV3
      const existing = p.ownedKitIds || []
      if (existing.includes(kitId)) return prev
      return { ...p, ownedKitIds: [...existing, kitId] }
    })
    const kit = kits.find((k) => k.id === kitId)
    setToast(`"${kit?.label}" added to My Packs!`)
    setTimeout(() => setToast(null), 4000)
  }

  const filteredKits = roomTypeFilter === 'all'
    ? kits
    : kits.filter(
        (k) => k.roomTypes.length === 0 || k.roomTypes.includes(roomTypeFilter)
      )

  // Room types that have kits
  const availableRoomTypes = [...new Set(kits.flatMap((k) => k.roomTypes))]

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href="/app/tools/finish-decisions"
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-4 inline-block"
        >
          &larr; Decision Tracker
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-2">
            Decision Packs
          </h1>
          <p className="text-cream/60 text-lg max-w-2xl">
            Curated starter ideas for every room in your project. Get a pack to
            instantly populate your decision boards with expert recommendations.
          </p>
        </div>

        {/* My Packs summary */}
        {ownedKitIds.length > 0 && (
          <div className="bg-basalt-50 rounded-card p-4 mb-6 border border-cream/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-cream/70">
                <span className="mr-1.5">✨</span>My Packs ({ownedKitIds.length})
              </h2>
              <Link
                href="/app/tools/finish-decisions"
                className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
              >
                Apply to a board &rarr;
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {kits
                .filter((k) => ownedKitIds.includes(k.id))
                .map((kit) => (
                  <div
                    key={kit.id}
                    className="shrink-0 bg-basalt rounded-lg border border-cream/10 px-3 py-2 w-48"
                  >
                    <span className="text-xs font-medium text-cream/80 block truncate">
                      {kit.label}
                    </span>
                    <span className="text-[10px] text-cream/40">
                      {kit.decisions.length} decisions &middot;{' '}
                      {kit.decisions.reduce((s, d) => s + d.options.length, 0)} ideas
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Room type filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[11px] text-cream/30 mr-1">Room type</span>
          <button
            type="button"
            onClick={() => setRoomTypeFilter('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              roomTypeFilter === 'all'
                ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                : 'bg-cream/10 text-cream/60 hover:text-cream/80'
            )}
          >
            All
          </button>
          {availableRoomTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRoomTypeFilter(type)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                roomTypeFilter === type
                  ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                  : 'bg-cream/10 text-cream/60 hover:text-cream/80'
              )}
            >
              {ROOM_EMOJI_MAP[type] || ''} {roomTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Pack grid */}
        {filteredKits.length === 0 ? (
          <div className="bg-basalt-50 rounded-card p-8 text-center">
            <p className="text-cream/40">No packs match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKits.map((kit) => {
              const isOwned = ownedKitIds.includes(kit.id)
              const totalIdeas = kit.decisions.reduce(
                (s, d) => s + d.options.length,
                0
              )

              return (
                <div
                  key={kit.id}
                  className="bg-basalt-50 rounded-card border border-cream/10 overflow-hidden flex flex-col"
                >
                  {/* Card header */}
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-cream font-medium">{kit.label}</h3>
                      <AuthorBadge author={kit.author} />
                      {isOwned && (
                        <span className="px-1.5 py-0.5 bg-green-500/15 rounded text-[10px] text-green-400 font-medium">
                          In My Packs
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-cream/50 leading-relaxed mb-3">
                      {kit.description}
                    </p>

                    {/* Room type tags */}
                    {kit.roomTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {kit.roomTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream/5 rounded text-[11px] text-cream/40"
                          >
                            {ROOM_EMOJI_MAP[type] || ''} {roomTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <p className="text-[11px] text-cream/30">
                      {kit.decisions.length} decision
                      {kit.decisions.length !== 1 ? 's' : ''} &middot;{' '}
                      {totalIdeas} curated idea{totalIdeas !== 1 ? 's' : ''}
                    </p>

                    {/* Decision preview */}
                    <div className="mt-3 space-y-1.5">
                      {kit.decisions.slice(0, 4).map((dec) => (
                        <div
                          key={dec.title}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="text-cream/40 font-medium truncate flex-1">
                            {dec.title}
                          </span>
                          <span className="text-cream/25 shrink-0">
                            {dec.options.length} idea
                            {dec.options.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                      {kit.decisions.length > 4 && (
                        <p className="text-[11px] text-cream/25 italic">
                          +{kit.decisions.length - 4} more decisions
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-5 py-3 border-t border-cream/10 flex items-center justify-between">
                    <Link
                      href={`/app/packs/${kit.id}`}
                      className="text-xs text-cream/40 hover:text-cream/70 transition-colors"
                    >
                      View details
                    </Link>
                    {isOwned ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-green-400/60 font-medium">
                          In My Packs
                        </span>
                        <Link
                          href="/app/tools/finish-decisions"
                          className="px-3 py-1.5 bg-sandstone/15 text-sandstone text-xs font-medium rounded-lg hover:bg-sandstone/25 transition-colors"
                        >
                          Apply to a board
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acquireKit(kit.id)}
                        className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                      >
                        Get Pack — Free
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-2 max-w-xs">
          <svg
            className="w-4 h-4 text-green-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              d="M20 6L9 17l-5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm text-cream/70">{toast}</span>
        </div>
      )}
    </div>
  )
}
