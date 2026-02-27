'use client'

import { useState } from 'react'
import Link from 'next/link'
import type {
  PublicRoomV3,
  PublicDecisionV3,
  PublicOptionV3,
  PublicDecisionComment,
  PublicOptionImage,
  StatusV3,
  RoomTypeV3,
} from '@/data/finish-decisions'
import { STATUS_CONFIG_V3, ROOM_EMOJI_MAP } from '@/data/finish-decisions'

interface Props {
  payload: Record<string, unknown>
  projectName: string
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
  scope?: Record<string, unknown> | null
}

export function PublicFinishDecisionsView({
  payload,
  projectName,
  includeNotes,
  includeComments,
  includePhotos,
  scope,
}: Props) {
  const rooms = ((payload?.rooms as PublicRoomV3[]) || [])

  const totalDecisions = rooms.reduce((sum, r) => sum + r.decisions.length, 0)
  const scopeLabels = scope?.roomLabels as string[] | undefined
  const isScoped = scope?.mode === 'selected' && scopeLabels && scopeLabels.length > 0

  return (
    <div className="min-h-screen bg-basalt text-cream">
      {/* Header */}
      <header className="border-b border-cream/10 px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-sandstone/10 text-sandstone/70 border border-sandstone/15 mb-2">
              Finish Selections
            </span>
            <h1 className="font-serif text-3xl md:text-4xl text-sandstone">{projectName}</h1>
            <p className="text-sm text-cream/50 mt-1">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} &middot; {totalDecisions} decision{totalDecisions !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/" className="text-xs text-cream/30 hover:text-cream/50 transition-colors mt-1">
            Hawaii Home Central
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Banners */}
        {includeNotes && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs mb-4 bg-amber-400/10 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Notes are included in this shared view
          </div>
        )}

        {isScoped && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs mb-4 bg-sandstone/10 text-sandstone/80">
            <span className="w-2 h-2 rounded-full bg-sandstone/60 shrink-0" />
            Showing selected rooms: {scopeLabels!.join(', ')}
          </div>
        )}

        {/* Room sections */}
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cream/30 text-sm">No rooms to display.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {rooms.map((room) => (
              <RoomSection
                key={room.id}
                room={room}
                includeNotes={includeNotes}
                includeComments={includeComments}
                includePhotos={includePhotos}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-cream/5 text-center">
          <p className="text-cream/20 text-xs">
            Shared from{' '}
            <Link href="/" className="text-sandstone/50 hover:text-sandstone transition-colors">
              Hawaii Home Central
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Room Section
// ---------------------------------------------------------------------------

function RoomSection({
  room,
  includeNotes,
  includeComments,
  includePhotos,
}: {
  room: PublicRoomV3
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
}) {
  const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '🏠'

  // Count by status
  const statusCounts: Partial<Record<StatusV3, number>> = {}
  for (const d of room.decisions) {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{emoji}</span>
        <h2 className="text-lg font-medium text-cream">{room.name}</h2>
        <span className="text-xs text-cream/30 ml-1">
          {room.decisions.length} decision{room.decisions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.entries(statusCounts) as [StatusV3, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG_V3[status]
          return (
            <span
              key={status}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${cfg.pillClass}`}
            >
              {count} {cfg.label}
            </span>
          )
        })}
      </div>

      {/* Decisions */}
      {room.decisions.length === 0 ? (
        <p className="text-cream/30 text-xs">No decisions in this room.</p>
      ) : (
        <div className="space-y-3">
          {room.decisions.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              includeNotes={includeNotes}
              includeComments={includeComments}
              includePhotos={includePhotos}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

function DecisionCard({
  decision,
  includeNotes,
  includeComments,
  includePhotos,
}: {
  decision: PublicDecisionV3
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG_V3[decision.status]
  const selectedOption = decision.options.find((o) => o.isSelected)
  const optionCount = decision.options.length

  const hasDetails = !!(
    (includeNotes && decision.notes) ||
    (includeComments && decision.comments && decision.comments.length > 0) ||
    optionCount > 0
  )

  return (
    <div className="bg-basalt-50 rounded-xl border border-cream/10 overflow-hidden">
      {/* Main row */}
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-medium text-cream">{decision.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${cfg.pillClass}`}>
              {cfg.label}
            </span>
            {selectedOption && (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className="text-xs text-blue-300">{selectedOption.name}</span>
              </>
            )}
            {optionCount > 0 && (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className="text-xs text-cream/40">
                  {optionCount} option{optionCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
            {decision.dueDate && (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className="text-xs text-cream/40">
                  Due {new Date(decision.dueDate).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        {hasDetails && (
          <svg
            className={`w-4 h-4 text-cream/30 mt-1 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-4 border-t border-cream/5 pt-4">
          {/* Decision notes */}
          {includeNotes && decision.notes && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-1">Notes</p>
              <p className="text-xs text-cream/50 leading-relaxed whitespace-pre-wrap">{decision.notes}</p>
            </div>
          )}

          {/* Options */}
          {optionCount > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-2">
                Options ({optionCount})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {decision.options.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    option={opt}
                    includeNotes={includeNotes}
                    includePhotos={includePhotos}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {includeComments && decision.comments && decision.comments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-1">
                Comments ({decision.comments.length})
              </p>
              <div className="space-y-1.5">
                {decision.comments.map((c, i) => (
                  <CommentRow key={i} comment={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Option Card
// ---------------------------------------------------------------------------

function OptionCard({
  option,
  includeNotes,
  includePhotos,
}: {
  option: PublicOptionV3
  includeNotes: boolean
  includePhotos: boolean
}) {
  const heroUrl = includePhotos ? getOptionHeroUrl(option) : null

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        option.isSelected
          ? 'border-blue-400/30 bg-blue-500/5'
          : 'border-cream/10 bg-basalt'
      }`}
    >
      {heroUrl && (
        <img
          src={heroUrl}
          alt={option.name}
          className="w-full h-32 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-medium text-cream truncate">{option.name}</h4>
          {option.isSelected && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
              Selected
            </span>
          )}
        </div>
        {includeNotes && option.notes && (
          <p className="text-[11px] text-cream/40 mt-1 line-clamp-3">{option.notes}</p>
        )}
        {includePhotos && option.images && option.images.length > 1 && (
          <div className="flex gap-1 mt-2">
            {option.images.slice(1, 4).map((img) => (
              <img
                key={img.id}
                src={img.thumbnailUrl || img.url}
                alt=""
                className="w-8 h-8 rounded object-cover"
                loading="lazy"
              />
            ))}
            {option.images.length > 4 && (
              <span className="w-8 h-8 rounded bg-cream/10 flex items-center justify-center text-[10px] text-cream/40">
                +{option.images.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comment Row (anonymized — no authorName/authorEmail)
// ---------------------------------------------------------------------------

function CommentRow({ comment }: { comment: PublicDecisionComment }) {
  return (
    <div className="text-xs text-cream/50">
      <span className="text-cream/30">{new Date(comment.createdAt).toLocaleDateString()}</span>
      {comment.refOptionLabel && (
        <span className="text-cream/30"> &middot; re: {comment.refOptionLabel}</span>
      )}
      <span className="ml-1.5">{comment.text}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOptionHeroUrl(option: PublicOptionV3): string | null {
  if (!option.images || option.images.length === 0) return null
  const heroId = option.heroImageId
  const hero = heroId ? option.images.find((img: PublicOptionImage) => img.id === heroId) : null
  return hero?.url ?? option.images[0].url
}
