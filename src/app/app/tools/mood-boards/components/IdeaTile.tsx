'use client'

import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import type { Idea } from '@/data/mood-boards'

interface Props {
  idea: Idea
  onClick: () => void
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

export function IdeaTile({ idea, onClick }: Props) {
  const heroId = idea.heroImageId
  const heroImage = heroId
    ? idea.images.find((img) => img.id === heroId) ?? idea.images[0]
    : idea.images[0]
  const domain = idea.sourceUrl ? extractDomain(idea.sourceUrl) : ''
  const visibleTags = idea.tags.slice(0, 3)
  const overflowCount = idea.tags.length - 3

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-cream/10 overflow-hidden hover:border-cream/25 transition-colors bg-basalt-50 group"
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
                <span className="text-2xl opacity-20">{'\uD83D\uDDBC\uFE0F'}</span>
              </div>
            }
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <p className="text-sm font-medium text-cream line-clamp-2 leading-snug">
          {idea.name}
        </p>

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
            <span className="text-[11px] text-cream/40 truncate">{domain}</span>
          </div>
        )}

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
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
      </div>
    </button>
  )
}
