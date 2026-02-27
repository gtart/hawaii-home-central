'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { useMoodBoardState } from '../useMoodBoardState'
import { REACTION_CONFIG } from '@/data/mood-boards'
import type { Idea, Board, MoodBoardComment, IdeaReaction, ReactionType } from '@/data/mood-boards'

export function MoodBoardReport() {
  const searchParams = useSearchParams()
  // Legacy single-board param (back-compat with old links)
  const singleBoardId = searchParams.get('board') || ''
  // Multi-board param from unified ShareExportModal
  const boardIdsParam = searchParams.get('boardIds') || ''
  const includeComments = searchParams.get('comments') === 'true' || searchParams.get('includeComments') === 'true'
  const includeReactions = searchParams.get('reactions') === 'true'
  const includeNotes = searchParams.get('includeNotes') !== 'false' // default true for legacy compat
  const includePhotos = searchParams.get('includePhotos') !== 'false' // default true for legacy compat
  const layout = searchParams.get('layout') || 'grid'

  const { payload, isLoaded } = useMoodBoardState()
  const { currentProject } = useProject()
  const [imagesReady, setImagesReady] = useState(false)

  // Resolve which boards to render
  const boards = useMemo(() => {
    if (singleBoardId) {
      // Legacy single-board mode
      const b = payload.boards.find((b) => b.id === singleBoardId)
      return b ? [b] : []
    }
    if (boardIdsParam) {
      // Multi-board: specific boards selected
      const ids = boardIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
      return payload.boards.filter((b) => ids.includes(b.id))
    }
    // All boards (excluding default/Uncategorized)
    return payload.boards.filter((b) => !(b as Board & { isDefault?: boolean }).isDefault)
  }, [payload.boards, singleBoardId, boardIdsParam])

  const isMultiBoard = boards.length > 1
  const totalIdeas = boards.reduce((sum, b) => sum + b.ideas.length, 0)

  // Wait for images to load before triggering print
  useEffect(() => {
    if (!isLoaded || boards.length === 0) return

    const images = document.querySelectorAll<HTMLImageElement>('.report-idea-img')
    if (images.length === 0 || !includePhotos) {
      setImagesReady(true)
      return
    }

    let loaded = 0
    const total = images.length

    function check() {
      loaded++
      if (loaded >= total) setImagesReady(true)
    }

    images.forEach((img) => {
      if (img.complete) {
        check()
      } else {
        img.addEventListener('load', check, { once: true })
        img.addEventListener('error', check, { once: true })
      }
    })

    // Safety fallback: trigger after 8 seconds regardless
    const timeout = setTimeout(() => setImagesReady(true), 8000)
    return () => clearTimeout(timeout)
  }, [isLoaded, boards, includePhotos])

  // Auto-trigger print when images are ready
  useEffect(() => {
    if (imagesReady) {
      const timeout = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timeout)
    }
  }, [imagesReady])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No boards found</p>
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break-avoid { page-break-inside: avoid; }
          .page-break-before { page-break-before: always; }
          .noise-overlay { display: none !important; }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 6px 32px;
            font-size: 9px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            background: white;
            text-align: center;
          }
          .report-content { padding-bottom: 40px; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-900 print:bg-white">
        {/* Screen-only toolbar */}
        <div className="no-print bg-basalt text-cream px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-sm text-cream/60 hover:text-cream transition-colors"
          >
            &larr; Back to Mood Boards
          </button>
          <div className="flex items-center gap-4">
            {!imagesReady && includePhotos && (
              <span className="text-xs text-cream/40 flex items-center gap-2">
                <span className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                Loading images...
              </span>
            )}
            <span className="text-xs text-cream/40 hidden sm:inline">
              Tip: Disable &ldquo;Headers and footers&rdquo; in print dialog to remove the URL
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-10 report-content">
          {/* Report header */}
          <div className="mb-8 pb-4 border-b-2 border-gray-200">
            <span className="text-sm font-medium text-gray-500">HawaiiHomeCentral.com</span>

            {currentProject && (
              <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{currentProject.name}</h1>
            )}

            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-gray-600">
                {isMultiBoard
                  ? `Mood Boards (${boards.length})`
                  : `Mood Board: ${boards[0].name}`}
              </p>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString()} &middot; {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Render each board */}
          {boards.map((board, idx) => {
            const boardComments = board.comments || []
            return (
              <div key={board.id} className={idx > 0 ? 'page-break-before mt-10' : ''}>
                {/* Board section header (only for multi-board) */}
                {isMultiBoard && (
                  <div className="mb-6 pb-2 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">{board.name}</h2>
                    <p className="text-sm text-gray-400">
                      {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Ideas */}
                {layout === 'grid' ? (
                  <GridLayout
                    ideas={board.ideas}
                    comments={boardComments}
                    includeComments={includeComments}
                    includeReactions={includeReactions}
                    includeNotes={includeNotes}
                    includePhotos={includePhotos}
                  />
                ) : (
                  <ListLayout
                    ideas={board.ideas}
                    comments={boardComments}
                    includeComments={includeComments}
                    includeReactions={includeReactions}
                    includeNotes={includeNotes}
                    includePhotos={includePhotos}
                  />
                )}
              </div>
            )
          })}

          {/* In-flow footer (screen view) */}
          <div className="mt-12 pt-4 border-t border-gray-200 text-center no-print">
            <p className="text-xs text-gray-400">Created at HawaiiHomeCentral.com</p>
          </div>
        </div>

        {/* Print-only repeating footer */}
        <div className="print-footer print-only">
          Created at HawaiiHomeCentral.com &middot; {currentProject?.name || ''} &middot; {new Date().toLocaleDateString()}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Grid Layout — 2-up per row
// ---------------------------------------------------------------------------

function GridLayout({
  ideas,
  comments,
  includeComments,
  includeReactions,
  includeNotes,
  includePhotos,
}: {
  ideas: Idea[]
  comments: MoodBoardComment[]
  includeComments: boolean
  includeReactions: boolean
  includeNotes: boolean
  includePhotos: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          comments={comments.filter((c) => c.refIdeaId === idea.id)}
          includeComments={includeComments}
          includeReactions={includeReactions}
          includeNotes={includeNotes}
          includePhotos={includePhotos}
          compact
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// List Layout — one per row
// ---------------------------------------------------------------------------

function ListLayout({
  ideas,
  comments,
  includeComments,
  includeReactions,
  includeNotes,
  includePhotos,
}: {
  ideas: Idea[]
  comments: MoodBoardComment[]
  includeComments: boolean
  includeReactions: boolean
  includeNotes: boolean
  includePhotos: boolean
}) {
  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          comments={comments.filter((c) => c.refIdeaId === idea.id)}
          includeComments={includeComments}
          includeReactions={includeReactions}
          includeNotes={includeNotes}
          includePhotos={includePhotos}
          compact={false}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual Idea Card
// ---------------------------------------------------------------------------

function getHeroUrl(idea: Idea): string | null {
  if (idea.images.length === 0) return null
  const heroId = idea.heroImageId
  const hero = heroId ? idea.images.find((img) => img.id === heroId) : null
  return hero?.url ?? idea.images[0].url
}

function IdeaCard({
  idea,
  comments,
  includeComments,
  includeReactions,
  includeNotes,
  includePhotos,
  compact,
}: {
  idea: Idea
  comments: MoodBoardComment[]
  includeComments: boolean
  includeReactions: boolean
  includeNotes: boolean
  includePhotos: boolean
  compact: boolean
}) {
  const heroUrl = includePhotos ? getHeroUrl(idea) : null

  return (
    <div className="page-break-avoid border border-gray-200 rounded-lg overflow-hidden">
      {/* Image */}
      {heroUrl && (
        <div className={compact ? 'aspect-[4/3]' : 'aspect-[16/9]'}>
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(heroUrl)}`}
            alt={idea.name}
            className="report-idea-img w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm">{idea.name}</h3>

        {includeNotes && idea.notes && (
          <p className="text-xs text-gray-600 mt-1">{idea.notes}</p>
        )}

        {idea.sourceUrl && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            Source: {idea.sourceTitle || idea.sourceUrl}
          </p>
        )}

        {idea.tags.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Tags: {idea.tags.join(', ')}
          </p>
        )}

        {/* Reactions */}
        {includeReactions && idea.reactions && idea.reactions.length > 0 && (
          <ReactionSummary reactions={idea.reactions} />
        )}

        {/* Additional images */}
        {includePhotos && idea.images.length > 1 && (
          <div className="flex gap-1 mt-2">
            {idea.images.slice(1, compact ? 3 : 5).map((img) => (
              <img
                key={img.id}
                src={`/api/image-proxy?url=${encodeURIComponent(img.url)}`}
                alt=""
                className="report-idea-img w-12 h-12 object-cover rounded"
                loading="eager"
              />
            ))}
            {idea.images.length > (compact ? 3 : 5) && (
              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                +{idea.images.length - (compact ? 3 : 5)}
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {includeComments && comments.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">
              Comments ({comments.length})
            </p>
            {comments.map((c) => (
              <p key={c.id} className="text-xs text-gray-500 mb-0.5">
                <span className="font-medium">{c.authorName}</span>{' '}
                ({new Date(c.createdAt).toLocaleDateString()}): {c.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reaction Summary
// ---------------------------------------------------------------------------

function ReactionSummary({ reactions }: { reactions: IdeaReaction[] }) {
  const counts: Record<string, number> = {}
  for (const r of reactions) {
    counts[r.reaction] = (counts[r.reaction] || 0) + 1
  }

  const parts = (Object.keys(counts) as ReactionType[]).map(
    (type) => `${counts[type]} ${REACTION_CONFIG[type]?.label || type}`
  )

  return (
    <p className="text-xs text-gray-500 mt-1">
      {parts.join(', ')}
    </p>
  )
}
