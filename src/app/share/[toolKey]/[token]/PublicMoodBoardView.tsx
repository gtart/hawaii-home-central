'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PublicBoard, PublicIdea, PublicMoodBoardComment } from '@/data/mood-boards'
import { REACTION_CONFIG } from '@/data/mood-boards'

interface Props {
  payload: Record<string, unknown>
  projectName: string
  includePhotos: boolean
  includeComments: boolean
}

export function PublicMoodBoardView({ payload, projectName, includePhotos, includeComments }: Props) {
  const boards = (payload?.boards as PublicBoard[]) || []
  const board = boards[0] // share links are scoped to a single board

  if (!board) {
    return (
      <div className="min-h-screen bg-basalt flex items-center justify-center">
        <p className="text-cream/50">No board data found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-basalt text-cream">
      {/* Header */}
      <div className="border-b border-cream/10 px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/" className="text-xs text-cream/30 hover:text-cream/50 transition-colors">
              HawaiiHomeCentral.com
            </Link>
            <span className="text-cream/20">/</span>
            <span className="text-xs text-cream/40">{projectName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-sandstone">{board.name}</h1>
          <p className="text-sm text-cream/50 mt-1">
            {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Ideas grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {board.ideas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cream/30 text-sm">This board has no ideas yet.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {board.ideas.map((idea, i) => (
              <PublicIdeaCard
                key={idea.id}
                idea={idea}
                comments={includeComments ? (board.comments || []).filter((c) => c.refIdeaId === idea.id) : []}
                includePhotos={includePhotos}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-cream/10 px-4 sm:px-6 py-6 mt-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-cream/30">
            Shared from{' '}
            <Link href="/" className="text-sandstone/50 hover:text-sandstone transition-colors">
              Hawaii Home Central
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public Idea Card — works with sanitized PublicIdea (missing fields are safe)
// ---------------------------------------------------------------------------

function PublicIdeaCard({
  idea,
  comments,
  includePhotos,
}: {
  idea: PublicIdea
  comments: PublicMoodBoardComment[]
  includePhotos: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const heroUrl = includePhotos ? getHeroUrl(idea) : null
  const hasDetail = !!(idea.notes || idea.sourceUrl || (idea.tags && idea.tags.length > 0) ||
    (idea.reactions && idea.reactions.length > 0) || comments.length > 0)

  return (
    <div className="break-inside-avoid mb-3">
      <div
        className="rounded-xl border border-cream/10 overflow-hidden bg-basalt-50 cursor-pointer hover:border-cream/20 transition-colors"
        onClick={() => hasDetail && setExpanded(!expanded)}
      >
        {/* Image */}
        {heroUrl && (
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(heroUrl)}`}
            alt={idea.name}
            className="w-full object-cover"
            loading="lazy"
          />
        )}

        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-cream">{idea.name}</h3>

          {/* Reaction badges (aggregate counts only, no PII) */}
          {idea.reactions && idea.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {idea.reactions.map((r) => (
                <span
                  key={r.reaction}
                  className="text-[11px] px-1.5 py-0.5 rounded-full bg-cream/5 text-cream/50"
                >
                  {REACTION_CONFIG[r.reaction]?.emoji} {r.count}
                </span>
              ))}
            </div>
          )}

          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-cream/10 space-y-2">
              {idea.notes && (
                <p className="text-xs text-cream/60">{idea.notes}</p>
              )}

              {idea.sourceUrl && (
                <p className="text-xs text-cream/40 truncate">
                  Source: {idea.sourceTitle || idea.sourceUrl}
                </p>
              )}

              {idea.tags && idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream/5 text-cream/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {comments.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-[10px] text-cream/30 font-medium">
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </p>
                  {comments.slice(0, 3).map((c, i) => (
                    <p key={i} className="text-[11px] text-cream/50">
                      {c.text}
                    </p>
                  ))}
                  {comments.length > 3 && (
                    <p className="text-[10px] text-cream/25">
                      +{comments.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Expand indicator */}
          {hasDetail && !expanded && (
            <p className="text-[10px] text-cream/25 mt-1">Tap for details</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getHeroUrl(idea: PublicIdea): string | null {
  if (!idea.images || idea.images.length === 0) return null
  const heroId = idea.heroImageId
  const hero = heroId ? idea.images.find((img) => img.id === heroId) : null
  return hero?.url ?? idea.images[0].url
}

