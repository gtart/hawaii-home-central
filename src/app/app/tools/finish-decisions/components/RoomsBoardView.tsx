'use client'

import { useState } from 'react'
import type { RoomV3, RoomTypeV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP } from '@/data/finish-decisions'
import { relativeTime } from '@/lib/relativeTime'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { RoomCoverPickerModal } from './RoomCoverPickerModal'

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
  let lastComment: { authorName: string; createdAt: string } | null = null
  for (const d of room.decisions) {
    const comments = d.comments || []
    totalComments += comments.length
    for (const c of comments) {
      if (c.authorEmail !== '' && (!lastComment || c.createdAt > lastComment.createdAt)) {
        lastComment = { authorName: c.authorName, createdAt: c.createdAt }
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

export function RoomsBoardView({
  rooms,
  onUpdateRoom,
  onSelectRoom,
  onQuickAdd,
  readOnly = false,
}: {
  rooms: RoomV3[]
  onUpdateRoom: (roomId: string, updates: Partial<RoomV3>) => void
  onSelectRoom: (roomId: string) => void
  onQuickAdd: (roomId: string) => void
  readOnly?: boolean
}) {
  const [coverPickerRoom, setCoverPickerRoom] = useState<RoomV3 | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const coverUrl = getRoomCoverUrl(room)
          const stats = getRoomStats(room)
          const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'

          return (
            <div
              key={room.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRoom(room.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRoom(room.id) } }}
              className="bg-basalt-50 rounded-xl overflow-hidden border border-cream/10 hover:border-cream/25 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sandstone/50"
            >
              {/* Cover image */}
              <div className="relative h-40 bg-basalt overflow-hidden">
                {coverUrl ? (
                  <>
                    <img
                      src={displayUrl(coverUrl)}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
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
              <div className="px-4 py-3">
                {/* Room name */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{emoji}</span>
                  <h3 className="text-sm font-medium text-cream truncate">{room.name}</h3>
                </div>

                {/* Status counts */}
                <div className="flex flex-wrap gap-x-2 text-[11px] text-cream/40 mb-2">
                  <span>{stats.total} selection{stats.total !== 1 ? 's' : ''}</span>
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
                  <p className="text-[10px] text-cream/25">
                    💬 {stats.totalComments}
                    {stats.lastComment && (
                      <span> · {stats.lastComment.authorName.split(' ')[0]} {relativeTime(stats.lastComment.createdAt)}</span>
                    )}
                  </p>
                )}

                {/* Quick actions */}
                {!readOnly && (
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-cream/5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onQuickAdd(room.id) }}
                      className="text-[11px] text-sandstone hover:text-sandstone-light transition-colors font-medium"
                    >
                      + Selection
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCoverPickerRoom(room) }}
                      className="text-[11px] text-cream/30 hover:text-cream/60 transition-colors ml-auto"
                    >
                      Set cover
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
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
