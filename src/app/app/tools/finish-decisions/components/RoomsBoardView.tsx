'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RoomV3, RoomTypeV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP } from '@/data/finish-decisions'
import { relativeTime } from '@/lib/relativeTime'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { isGlobalUnsorted, findUncategorizedDecision } from '@/lib/decisionHelpers'
import { RoomCoverPickerModal } from './RoomCoverPickerModal'

/** Stateful image with emoji fallback — no blank tiles */
function RoomCoverImage({ src, alt, emoji }: { src: string; alt: string; emoji: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-basalt to-basalt-50">
        <span className="text-5xl opacity-30">{emoji}</span>
      </div>
    )
  }
  return (
    <img
      src={displayUrl(src)}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setFailed(true)}
    />
  )
}

function getRoomCoverUrl(room: RoomV3): string | null {
  // 1. Explicit cover image
  if (room.coverImage?.url) return room.coverImage.url

  // 2. Fall back to most recent idea with an image
  let latestUrl: string | null = null
  let latestTime = ''
  for (const d of room.decisions) {
    for (const opt of d.options) {
      const hero = getHeroImage(opt)
      const src = hero?.thumbnailUrl || hero?.url || opt.thumbnailUrl || opt.imageUrl
      if (src && opt.updatedAt > latestTime) {
        latestUrl = src
        latestTime = opt.updatedAt
      }
    }
  }
  return latestUrl
}

function getRoomStats(room: RoomV3) {
  const decisions = room.decisions.filter((d) => d.systemKey !== 'uncategorized')
  const deciding = decisions.filter((d) => d.status === 'deciding').length
  const selected = decisions.filter((d) => d.status === 'selected').length
  const ordered = decisions.filter((d) => d.status === 'ordered').length
  const done = decisions.filter((d) => d.status === 'done').length

  // Last updated
  let lastUpdated = room.updatedAt
  for (const d of room.decisions) {
    if (d.updatedAt > lastUpdated) lastUpdated = d.updatedAt
  }

  // Comments
  let totalComments = 0
  let lastComment: { authorName: string; createdAt: string; text: string; decisionTitle: string } | null = null
  for (const d of room.decisions) {
    const comments = d.comments || []
    totalComments += comments.length
    for (const c of comments) {
      if (c.authorEmail !== '' && (!lastComment || c.createdAt > lastComment.createdAt)) {
        lastComment = { authorName: c.authorName, createdAt: c.createdAt, text: c.text, decisionTitle: d.title }
      }
    }
  }

  // Next due
  const today = new Date().toISOString().slice(0, 10)
  const futureDues = decisions
    .filter((d) => d.dueDate && d.dueDate >= today && d.status !== 'done')
    .map((d) => d.dueDate!)
    .sort()
  const nextDue = futureDues[0] || null

  return { total: decisions.length, deciding, selected, ordered, done, lastUpdated, totalComments, lastComment, nextDue }
}

type SortKey = 'created' | 'updated' | 'due' | 'inProgress' | 'comments'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created', label: 'Date added' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'due', label: 'Next due date' },
  { key: 'inProgress', label: 'Most in-progress' },
  { key: 'comments', label: 'Most comments' },
]

function truncate(text: string, max = 50): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

export function RoomsBoardView({
  rooms,
  onUpdateRoom,
  onQuickAdd,
  onAddRoom,
  readOnly = false,
}: {
  rooms: RoomV3[]
  onUpdateRoom: (roomId: string, updates: Partial<RoomV3>) => void
  onQuickAdd: (roomId: string) => void
  onAddRoom?: () => void
  readOnly?: boolean
}) {
  const router = useRouter()
  const [coverPickerRoom, setCoverPickerRoom] = useState<RoomV3 | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('created')

  const navigateToRoom = (roomId: string) => {
    router.push(`/app/tools/finish-decisions/room/${roomId}`)
  }

  // Sort rooms: pin Global Unsorted first, then by chosen metric
  const sortedRooms = [...rooms].sort((a, b) => {
    const aGlobal = isGlobalUnsorted(a) ? 0 : 1
    const bGlobal = isGlobalUnsorted(b) ? 0 : 1
    if (aGlobal !== bGlobal) return aGlobal - bGlobal

    const statsA = getRoomStats(a)
    const statsB = getRoomStats(b)

    switch (sortKey) {
      case 'created':
        return a.createdAt.localeCompare(b.createdAt)
      case 'updated':
        return statsB.lastUpdated.localeCompare(statsA.lastUpdated)
      case 'due': {
        // Rooms with a due date first, sorted ascending; no-due last
        if (statsA.nextDue && !statsB.nextDue) return -1
        if (!statsA.nextDue && statsB.nextDue) return 1
        if (statsA.nextDue && statsB.nextDue) return statsA.nextDue.localeCompare(statsB.nextDue)
        return 0
      }
      case 'inProgress':
        return statsB.deciding - statsA.deciding
      case 'comments':
        return statsB.totalComments - statsA.totalComments
      default:
        return 0
    }
  })

  return (
    <>
      {/* Sort selector */}
      {rooms.filter((r) => !isGlobalUnsorted(r)).length > 1 && (
        <div className="flex items-center justify-end gap-2 mb-3">
          <span className="text-[11px] text-cream/30">Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-basalt-50 text-cream/60 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedRooms.map((room) => {
          const isUnsortedRoom = isGlobalUnsorted(room)
          const unsortedCount = isUnsortedRoom
            ? (findUncategorizedDecision(room)?.options.length ?? 0)
            : 0

          // Global Unsorted card — visible even when empty with helper text
          if (isUnsortedRoom) {
            return (
              <div
                key={room.id}
                data-testid="unsorted-room-card"
                role={unsortedCount > 0 ? 'button' : undefined}
                tabIndex={unsortedCount > 0 ? 0 : undefined}
                onClick={() => { if (unsortedCount > 0) navigateToRoom(room.id) }}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && unsortedCount > 0) { e.preventDefault(); navigateToRoom(room.id) } }}
                className={`bg-basalt-50 rounded-xl overflow-hidden border-2 border-dashed transition-all ${
                  unsortedCount > 0
                    ? 'border-amber-500/30 hover:border-amber-500/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50'
                    : 'border-cream/10'
                }`}
              >
                <div className="px-4 py-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${unsortedCount > 0 ? 'bg-amber-500/10' : 'bg-cream/5'}`}>
                    <svg className={`w-5 h-5 ${unsortedCount > 0 ? 'text-amber-400' : 'text-cream/20'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium ${unsortedCount > 0 ? 'text-amber-300' : 'text-cream/30'}`}>Unsorted</h3>
                    <p className="text-[11px] text-cream/30">
                      {unsortedCount > 0
                        ? `${unsortedCount} option${unsortedCount !== 1 ? 's' : ''} to sort into rooms`
                        : 'Saved-from-web items land here until you sort them'}
                    </p>
                  </div>
                  {unsortedCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-full">
                      {unsortedCount}
                    </span>
                  )}
                </div>
              </div>
            )
          }

          // Regular room card
          const coverUrl = getRoomCoverUrl(room)
          const stats = getRoomStats(room)
          const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'
          const roomUnsorted = findUncategorizedDecision(room)
          const roomUnsortedCount = roomUnsorted ? roomUnsorted.options.length : 0

          return (
            <div
              key={room.id}
              data-testid="room-card"
              role="button"
              tabIndex={0}
              onClick={() => navigateToRoom(room.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigateToRoom(room.id) } }}
              className="bg-basalt-50 rounded-xl overflow-hidden border border-cream/10 hover:border-cream/25 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sandstone/50"
            >
              {/* Title row — above image */}
              <div className="px-3 pt-3 pb-1.5 flex items-center gap-1.5">
                <span className="text-sm">{emoji}</span>
                <h3 className="text-base font-semibold text-cream truncate">{room.name}</h3>
                {roomUnsortedCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-medium rounded-full">
                    {roomUnsortedCount} unsorted
                  </span>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onQuickAdd(room.id) }}
                    className="ml-auto text-[11px] text-sandstone hover:text-sandstone-light transition-colors font-medium shrink-0"
                  >
                    + Decision
                  </button>
                )}
              </div>

              {/* Cover image */}
              <div className="relative h-36 bg-basalt overflow-hidden">
                {coverUrl ? (
                  <>
                    <RoomCoverImage src={coverUrl} alt={room.name} emoji={emoji} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-basalt to-basalt-50">
                    <span className="text-5xl opacity-30">{emoji}</span>
                  </div>
                )}

                {/* Set cover button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCoverPickerRoom(room) }}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    title="Set cover"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Card body */}
              <div className="px-3 pb-3 pt-2">
                {/* Status counts */}
                <div className="flex flex-wrap gap-x-2 text-[11px] text-cream/40 mb-2">
                  <span>{stats.total} decision{stats.total !== 1 ? 's' : ''}</span>
                  {stats.deciding > 0 && <span>{stats.deciding} deciding</span>}
                  {stats.ordered > 0 && <span>{stats.ordered} ordered</span>}
                  {stats.done > 0 && <span>{stats.done} done</span>}
                </div>

                {/* Last updated */}
                <p className="text-[10px] text-cream/25 mb-1">
                  Updated {relativeTime(stats.lastUpdated)}
                </p>

                {/* Next due */}
                {stats.nextDue && (
                  <p className="text-[10px] text-cream/25 mb-1">
                    Next due: {new Date(stats.nextDue + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}

                {/* Comment summary */}
                {stats.totalComments > 0 && (
                  <div className="text-[10px] text-cream/25">
                    <span>💬 {stats.totalComments}</span>
                    {stats.lastComment && (
                      <p className="mt-0.5 text-cream/35 line-clamp-1">
                        &ldquo;{truncate(stats.lastComment.text, 50)}&rdquo;
                        {' — '}{stats.lastComment.authorName.split(' ')[0]}, {relativeTime(stats.lastComment.createdAt)}
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          )
        })}

        {/* Add a Room tile */}
        {!readOnly && onAddRoom && (
          <button
            type="button"
            onClick={onAddRoom}
            className="bg-basalt-50/50 rounded-xl overflow-hidden border-2 border-dashed border-cream/15 hover:border-sandstone/40 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[200px] focus:outline-none focus:ring-2 focus:ring-sandstone/50"
          >
            <div className="w-12 h-12 rounded-full bg-cream/5 group-hover:bg-sandstone/10 flex items-center justify-center transition-colors mb-3">
              <svg className="w-6 h-6 text-cream/30 group-hover:text-sandstone transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-medium text-cream/40 group-hover:text-sandstone transition-colors">Add a Room</span>
          </button>
        )}
      </div>


      {/* Cover picker modal */}
      {coverPickerRoom && (
        <RoomCoverPickerModal
          room={coverPickerRoom}
          onSetCover={(cover) => {
            onUpdateRoom(coverPickerRoom.id, { coverImage: cover, updatedAt: new Date().toISOString() })
            setCoverPickerRoom(null)
          }}
          onRemoveCover={() => {
            onUpdateRoom(coverPickerRoom.id, { coverImage: undefined, updatedAt: new Date().toISOString() })
            setCoverPickerRoom(null)
          }}
          onClose={() => setCoverPickerRoom(null)}
        />
      )}
    </>
  )
}
