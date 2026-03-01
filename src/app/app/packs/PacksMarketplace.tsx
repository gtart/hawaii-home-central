'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { applyKitToRoom } from '@/lib/finish-decision-kits'
import type { FinishDecisionsPayloadV3, RoomTypeV3, RoomV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP, ROOM_TYPE_OPTIONS_V3 } from '@/data/finish-decisions'
import { cn } from '@/lib/utils'

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
    className: 'bg-cream/10 text-cream/50 border-cream/20',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase',
        badge.className
      )}
      title={badge.micro}
    >
      {badge.label}
    </span>
  )
}

function roomTypeLabel(type: RoomTypeV3): string {
  return ROOM_TYPE_OPTIONS_V3.find((o) => o.value === type)?.label || type
}

export function PacksMarketplace({ kits }: { kits: FinishDecisionKit[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Context params — where user came from
  const returnTo = searchParams.get('returnTo')
  const contextRoomId = searchParams.get('roomId')
  const contextRoomName = searchParams.get('roomName')

  const { state, setState, isLoaded } = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })

  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeV3 | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ text: string; kitId: string } | null>(null)
  const [applyNowModal, setApplyNowModal] = useState<{ kitId: string; kitLabel: string } | null>(null)
  const [applyNowRoomId, setApplyNowRoomId] = useState<string>('')

  const v3State = isLoaded && state.version === 3 ? (state as FinishDecisionsPayloadV3) : { version: 3 as const, rooms: [] as RoomV3[], ownedKitIds: [] as string[] }
  const rooms = v3State.rooms || []

  const ownedKitIds: string[] = v3State.ownedKitIds || []
  const canApplyContext = !!contextRoomId && isLoaded && rooms.length > 0

  function doAcquire(kitId: string) {
    setState((prev: any) => {
      const p = prev as FinishDecisionsPayloadV3
      const existing = p.ownedKitIds || []
      if (existing.includes(kitId)) return prev
      return { ...p, ownedKitIds: [...existing, kitId] }
    })
  }

  function applyKitToRoomById(kitId: string, roomId: string): { ok: boolean; reason?: string; message?: string } {
    if (!isLoaded) return { ok: false, reason: 'Tool state is still loading. Try again in a moment.' }
    const kit = kits.find((k) => k.id === kitId)
    if (!kit) return { ok: false, reason: 'Pack not found.' }
    const targetRoom = rooms.find((r) => r.id === roomId)
    if (!targetRoom) return { ok: false, reason: `Room not found. It may have been deleted.` }

    const result = applyKitToRoom(targetRoom, kit)
    setState((prev: any) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r: RoomV3) =>
        r.id === roomId ? result.room : r
      ),
    }))

    const msg = `Applied "${kit.label}" to ${targetRoom.name} — +${result.addedDecisionCount} decisions, +${result.addedOptionCount} options`
    return { ok: true, message: msg }
  }

  function acquireKit(kitId: string) {
    doAcquire(kitId)
    const kit = kits.find((k) => k.id === kitId)

    if (contextRoomId) {
      // Context mode: auto-apply and navigate back
      const result = applyKitToRoomById(kitId, contextRoomId)
      if (!result.ok) {
        setToast({ text: result.reason || 'Could not apply pack.', kitId })
        setTimeout(() => setToast(null), 6000)
        return
      }
      // Store flash message for room page to pick up
      try { sessionStorage.setItem('hhc_pack_flash', result.message || '') } catch { /* ignore */ }
      router.push(`/app/tools/finish-decisions/room/${contextRoomId}`)
    } else {
      // General mode: show apply-now modal
      setApplyNowRoomId(rooms[0]?.id || '')
      setApplyNowModal({ kitId, kitLabel: kit?.label || 'Pack' })
    }
  }

  function handleApplyToBoard(kitId: string) {
    if (contextRoomId) {
      const result = applyKitToRoomById(kitId, contextRoomId)
      if (!result.ok) {
        setToast({ text: result.reason || 'Could not apply pack.', kitId })
        setTimeout(() => setToast(null), 6000)
        return
      }
      try { sessionStorage.setItem('hhc_pack_flash', result.message || '') } catch { /* ignore */ }
      router.push(`/app/tools/finish-decisions/room/${contextRoomId}`)
    } else {
      // General mode: show apply-now modal for owned packs too
      const kit = kits.find((k) => k.id === kitId)
      setApplyNowRoomId(rooms[0]?.id || '')
      setApplyNowModal({ kitId, kitLabel: kit?.label || 'Pack' })
    }
  }

  const filteredKits = useMemo(() => {
    let result = kits
    if (roomTypeFilter !== 'all') {
      result = result.filter(
        (k) => k.roomTypes.length === 0 || k.roomTypes.includes(roomTypeFilter)
      )
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (k) =>
          k.label.toLowerCase().includes(q) ||
          k.description.toLowerCase().includes(q) ||
          k.decisions.some((d) => d.title.toLowerCase().includes(q))
      )
    }
    return result
  }, [kits, roomTypeFilter, searchQuery])

  const availableRoomTypes = [...new Set(kits.flatMap((k) => k.roomTypes))]
  const backHref = returnTo || '/app/tools/finish-decisions'
  const backLabel = returnTo ? 'Back to board' : 'Decision Tracker'

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href={backHref}
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-4 inline-block"
        >
          &larr; {backLabel}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-2">
            Decision Packs
          </h1>
          <p className="text-cream/50 max-w-xl">
            Curated options to help you choose faster.
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="What are you deciding?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-basalt-50 border border-cream/15 rounded-lg px-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 transition-colors"
          />
        </div>

        {/* Room type filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
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
            <p className="text-cream/40 text-sm">
              {searchQuery ? 'No packs match your search.' : 'No packs match this filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredKits.map((kit) => {
              const isOwned = ownedKitIds.includes(kit.id)
              const totalOptions = kit.decisions.reduce(
                (s, d) => s + d.options.length, 0
              )

              return (
                <div
                  key={kit.id}
                  className="bg-basalt-50 rounded-card border border-cream/10 overflow-hidden flex flex-col"
                >
                  <Link href={`/app/packs/${kit.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}&roomId=${contextRoomId || ''}&roomName=${encodeURIComponent(contextRoomName || '')}` : ''}`} className="p-5 flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-cream font-medium">{kit.label}</h3>
                      <DisclosureBadge author={kit.author} />
                      {isOwned && (
                        <span className="px-1.5 py-0.5 bg-green-500/15 rounded text-[10px] text-green-400 font-medium">
                          In My Packs
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-cream/50 leading-relaxed mb-3">
                      {kit.description}
                    </p>
                    {kit.roomTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {kit.roomTypes.map((type) => (
                          <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream/5 rounded text-[11px] text-cream/40">
                            {ROOM_EMOJI_MAP[type] || ''} {roomTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-cream/30">
                      {kit.decisions.length} decision{kit.decisions.length !== 1 ? 's' : ''} &middot; {totalOptions} option{totalOptions !== 1 ? 's' : ''}
                    </p>
                  </Link>

                  {/* Card footer — single CTA */}
                  <div className="px-5 py-3 border-t border-cream/10 flex items-center justify-end">
                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => handleApplyToBoard(kit.id)}
                        className="px-4 py-1.5 bg-sandstone/15 text-sandstone text-xs font-medium rounded-lg hover:bg-sandstone/25 transition-colors"
                      >
                        Apply
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acquireKit(kit.id)}
                        disabled={!!contextRoomId && !canApplyContext}
                        className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {!!contextRoomId && !canApplyContext ? 'Loading…' : 'Get pack'}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-cream/70 flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-cream/30 hover:text-cream/60 transition-colors"
          >
            &times;
          </button>
        </div>
      )}

      {/* Apply Now modal — general mode (no contextRoomId) */}
      {applyNowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setApplyNowModal(null)} />
          <div className="relative bg-basalt-50 border border-cream/15 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-medium text-cream mb-1">Apply this pack now?</h3>
            <p className="text-sm text-cream/50 mb-4">
              Choose a room to add &ldquo;{applyNowModal.kitLabel}&rdquo; decisions and options.
            </p>
            {rooms.length > 0 ? (
              <>
                <select
                  value={applyNowRoomId}
                  onChange={(e) => setApplyNowRoomId(e.target.value)}
                  className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50 mb-4"
                >
                  {rooms.filter((r) => r.systemKey !== 'global_uncategorized').map((r) => (
                    <option key={r.id} value={r.id}>
                      {ROOM_EMOJI_MAP[r.type as RoomTypeV3] || ''} {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setApplyNowModal(null)}
                    className="px-4 py-1.5 text-sm text-cream/50 hover:text-cream/70 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (applyNowRoomId) {
                        const result = applyKitToRoomById(applyNowModal.kitId, applyNowRoomId)
                        setApplyNowModal(null)
                        if (!result.ok) {
                          setToast({ text: result.reason || 'Could not apply pack.', kitId: applyNowModal.kitId })
                          setTimeout(() => setToast(null), 6000)
                          return
                        }
                        try { sessionStorage.setItem('hhc_pack_flash', result.message || '') } catch { /* ignore */ }
                        router.push(`/app/tools/finish-decisions/room/${applyNowRoomId}`)
                      }
                    }}
                    disabled={!applyNowRoomId}
                    className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-cream/40 mb-4">
                No rooms yet. Create a room in the Decision Tracker first.
              </div>
            )}
            {rooms.length === 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setApplyNowModal(null)}
                  className="px-4 py-1.5 text-sm text-cream/50 hover:text-cream/70 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
