'use client'

import { useState } from 'react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import type { Idea, IdeaReaction, ReactionType } from '@/data/mood-boards'
import { REACTION_CONFIG } from '@/data/mood-boards'

interface Props {
  idea: Idea
  onClick: () => void
  commentCount?: number
  reactions?: IdeaReaction[]
  onQuickRename?: (ideaId: string, newName: string) => void
  onQuickDelete?: (ideaId: string) => void
  readOnly?: boolean
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function faviconUrl(url: string): string {
  try {
    const host = new URL(url).origin
    return `https://www.google.com/s2/favicons?domain=${host}&sz=16`
  } catch {
    return ''
  }
}

// Muted gradient palettes for text-only tiles
const TEXT_GRADIENTS = [
  'bg-gradient-to-br from-stone-700 to-stone-900',
  'bg-gradient-to-br from-slate-700 to-slate-900',
  'bg-gradient-to-br from-zinc-700 to-zinc-900',
  'bg-gradient-to-br from-amber-900 to-stone-900',
  'bg-gradient-to-br from-emerald-900 to-stone-900',
  'bg-gradient-to-br from-sky-900 to-slate-900',
  'bg-gradient-to-br from-violet-900 to-slate-900',
  'bg-gradient-to-br from-rose-900 to-stone-900',
]

export function IdeaTile({
  idea,
  onClick,
  commentCount = 0,
  reactions = [],
  onQuickRename,
  onQuickDelete,
  readOnly = false,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(idea.name)

  const heroId = idea.heroImageId
  const heroImage = heroId
    ? idea.images.find((img) => img.id === heroId) ?? idea.images[0]
    : idea.images[0]
  const domain = idea.sourceUrl ? extractDomain(idea.sourceUrl) : ''
  const visibleTags = idea.tags.slice(0, 3)
  const overflowCount = idea.tags.length - 3
  const isTextOnly = !heroImage

  // Count reactions by type
  const reactionCounts: Partial<Record<ReactionType, number>> = {}
  for (const r of reactions) {
    reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1
  }

  const hasEngagement =
    commentCount > 0 || Object.values(reactionCounts).some((c) => c > 0)

  // Stable gradient based on idea id
  const gradientIndex = idea.id.charCodeAt(idea.id.length - 1) % TEXT_GRADIENTS.length
  const gradient = TEXT_GRADIENTS[gradientIndex]

  const hasQuickActions = !readOnly && (!!onQuickRename || !!onQuickDelete)

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== idea.name) {
      onQuickRename?.(idea.id, trimmed)
    }
    setRenaming(false)
  }

  return (
    <div className="relative group">
      <div
        data-testid="idea-tile"
        onClick={renaming ? undefined : onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!renaming && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onClick()
          }
        }}
        className="w-full text-left rounded-xl border border-cream/10 overflow-hidden hover:border-cream/25 transition-colors bg-basalt-50 cursor-pointer"
      >
        {/* Hero image */}
        {heroImage && (
          <div className="w-full">
            <ImageWithFallback
              src={`/api/image-proxy?url=${encodeURIComponent(heroImage.url)}`}
              alt={idea.name}
              className="w-full object-cover"
              fallback={
                <div className="w-full aspect-video flex items-center justify-center bg-basalt">
                  <span className="text-2xl opacity-20">
                    {'\uD83D\uDDBC\uFE0F'}
                  </span>
                </div>
              }
            />
          </div>
        )}

        {/* Text-only hero area */}
        {isTextOnly && (
          <div className={`w-full aspect-[4/3] ${gradient} flex flex-col items-center justify-center p-5 relative`}>
            <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M20%200L40%2020L20%2040L0%2020z%22%20fill%3D%22white%22%20fill-opacity%3D%221%22/%3E%3C/svg%3E')]" />
            <p className="font-serif text-lg text-white/90 text-center leading-snug line-clamp-3 relative z-10">
              {idea.name}
            </p>
            {idea.notes && (
              <p className="text-xs text-white/50 text-center mt-2 line-clamp-2 relative z-10 max-w-[90%]">
                {idea.notes}
              </p>
            )}
            <span className="absolute bottom-2 right-2.5 text-[10px] text-white/25 font-medium tracking-wide uppercase">Note</span>
          </div>
        )}

        {/* Content (below image, or metadata for text-only) */}
        <div className="p-3">
          {!isTextOnly && (
            renaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') {
                    setRenaming(false)
                    setRenameValue(idea.name)
                  }
                }}
                onBlur={handleRenameSubmit}
                autoFocus
                className="w-full text-sm font-medium bg-transparent text-cream border-b border-sandstone/30 focus:outline-none focus:border-sandstone pb-0.5"
              />
            ) : (
              <p className="text-sm font-medium text-cream line-clamp-2 leading-snug">
                {idea.name}
              </p>
            )
          )}

          {/* Source */}
          {domain && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faviconUrl(idea.sourceUrl)}
                alt=""
                width={12}
                height={12}
                className="w-3 h-3 rounded-sm"
              />
              <span className="text-[11px] text-cream/40 truncate">
                {domain}
              </span>
            </div>
          )}

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className={`flex items-center gap-1 ${isTextOnly ? '' : 'mt-2'} flex-wrap`}>
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] text-cream/50 bg-cream/5 rounded"
                >
                  {tag}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="text-[10px] text-cream/30">
                  +{overflowCount}
                </span>
              )}
            </div>
          )}

          {/* Reactions + comment count */}
          {hasEngagement && (
            <div className={`flex items-center gap-2.5 ${isTextOnly && visibleTags.length === 0 ? '' : 'mt-2'} text-[11px] text-cream/40`}>
              {(['love', 'like', 'dislike'] as ReactionType[]).map((type) => {
                const count = reactionCounts[type]
                if (!count) return null
                return (
                  <span key={type} className="flex items-center gap-0.5">
                    {REACTION_CONFIG[type].emoji} {count}
                  </span>
                )
              })}
              {commentCount > 0 && (
                <span className="flex items-center gap-0.5">
                  {'\uD83D\uDCAC'} {commentCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kebab menu overlay — visible on mobile, hover on desktop */}
      {hasQuickActions && !renaming && (
        <div className="absolute top-2 right-2 z-10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl py-1">
                {onQuickRename && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setRenaming(true)
                      setRenameValue(idea.name)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 transition-colors"
                  >
                    Rename
                  </button>
                )}
                {onQuickDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onQuickDelete(idea.id)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400/80 hover:bg-cream/5 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
