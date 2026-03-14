'use client'

import type { OptionV3, DecisionV3 } from '@/data/finish-decisions'
import { getAllImages, getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

function displayPrice(raw: string | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (/^\$/.test(trimmed)) return trimmed
  if (/^[\d,]+(\.\d{1,2})?$/.test(trimmed)) return `$${trimmed}`
  return trimmed
}

interface CompareModalProps {
  options: OptionV3[]
  decision: DecisionV3
  readOnly: boolean
  userEmail?: string
  onSelectOption: (id: string) => void
  onUpdateOption?: (optionId: string, updates: Partial<OptionV3>) => void
  onClose: () => void
}

export function CompareModal({
  options,
  decision,
  readOnly,
  userEmail,
  onSelectOption,
  onUpdateOption,
  onClose,
}: CompareModalProps) {
  const colCount = options.length

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-stone border border-cream/15 w-full md:max-w-4xl md:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-stone border-b border-cream/15 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-medium text-cream">
            Compare {colCount} Options
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/55 hover:text-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Drag handle on mobile */}
        <div className="md:hidden flex justify-center py-1">
          <div className="w-8 h-1 rounded-full bg-cream/35" />
        </div>

        {/* Columns */}
        <div className="p-4">
          <div className={`grid gap-3 ${colCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {options.map((opt) => {
              const hero = getHeroImage(opt)
              const heroSrc = hero?.url || hero?.thumbnailUrl
              const linkPreview = !heroSrc && opt.urls?.[0]?.linkImage
              const imageCount = getAllImages(opt).length
              const votes = opt.votes ?? {}

              return (
                <div key={opt.id} className="flex flex-col bg-basalt rounded-lg border border-cream/15 overflow-hidden">
                  {/* Image */}
                  <div className="aspect-[4/3] relative bg-stone">
                    {heroSrc ? (
                      <>
                        <ImageWithFallback
                          src={displayUrl(heroSrc)}
                          alt={opt.name || 'Option'}
                          className="w-full h-full object-cover"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center bg-stone">
                              <span className="text-3xl opacity-20">🖼️</span>
                            </div>
                          }
                        />
                        {imageCount > 1 && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded-full">
                            +{imageCount - 1}
                          </span>
                        )}
                      </>
                    ) : linkPreview ? (
                      <ImageWithFallback
                        src={displayUrl(linkPreview)}
                        alt={opt.name || 'Option'}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center bg-stone">
                            <span className="text-3xl opacity-20">🔗</span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3">
                        <p className="text-sm text-cream/45 text-center line-clamp-4">
                          {opt.notes || opt.name || 'No preview'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 flex-1 flex flex-col gap-2.5">
                    {/* Name */}
                    {!readOnly && onUpdateOption ? (
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => onUpdateOption(opt.id, { name: e.target.value })}
                        className="text-sm font-medium text-cream bg-transparent border-b border-cream/15 focus:border-sandstone/40 outline-none pb-0.5"
                        placeholder="Option name..."
                      />
                    ) : (
                      <p className="text-sm font-medium text-cream line-clamp-2">
                        {opt.name || <span className="text-cream/45 italic">Untitled</span>}
                      </p>
                    )}

                    {/* Price */}
                    {(!readOnly || opt.price) && (
                      <div>
                        <label className="text-[10px] text-cream/45 uppercase tracking-wider block mb-0.5">Price</label>
                        {!readOnly && onUpdateOption ? (
                          <input
                            type="text"
                            value={opt.price || ''}
                            onChange={(e) => onUpdateOption(opt.id, { price: e.target.value })}
                            placeholder="e.g. $1,200"
                            className="w-full text-xs text-cream bg-stone border border-cream/15 rounded px-2 py-1 focus:outline-none focus:border-sandstone/40"
                          />
                        ) : (
                          <p className="text-xs text-cream/80">{displayPrice(opt.price)}</p>
                        )}
                      </div>
                    )}

                    {/* Specs */}
                    {(!readOnly || opt.notes) && (
                      <div>
                        <label className="text-[10px] text-cream/45 uppercase tracking-wider block mb-0.5">Specs</label>
                        {!readOnly && onUpdateOption ? (
                          <textarea
                            value={opt.notes}
                            onChange={(e) => onUpdateOption(opt.id, { notes: e.target.value })}
                            rows={3}
                            className="w-full text-xs text-cream bg-stone border border-cream/15 rounded px-2 py-1 focus:outline-none focus:border-sandstone/40 resize-none"
                            placeholder="Specs, details..."
                          />
                        ) : (
                          <p className="text-xs text-cream/65 line-clamp-6 whitespace-pre-wrap">{opt.notes}</p>
                        )}
                      </div>
                    )}

                    {/* Pros */}
                    {(!readOnly || opt.prosText) && (
                      <div>
                        <label className="text-[10px] text-green-400/60 uppercase tracking-wider block mb-0.5">Pros</label>
                        {!readOnly && onUpdateOption ? (
                          <textarea
                            value={opt.prosText || ''}
                            onChange={(e) => onUpdateOption(opt.id, { prosText: e.target.value })}
                            rows={2}
                            className="w-full text-xs text-cream bg-stone border border-cream/15 rounded px-2 py-1 focus:outline-none focus:border-green-400/30 resize-none"
                            placeholder="What's good about this option?"
                          />
                        ) : opt.prosText ? (
                          <p className="text-xs text-cream/65 whitespace-pre-wrap">{opt.prosText}</p>
                        ) : null}
                      </div>
                    )}

                    {/* Cons */}
                    {(!readOnly || opt.consText) && (
                      <div>
                        <label className="text-[10px] text-red-400/60 uppercase tracking-wider block mb-0.5">Cons</label>
                        {!readOnly && onUpdateOption ? (
                          <textarea
                            value={opt.consText || ''}
                            onChange={(e) => onUpdateOption(opt.id, { consText: e.target.value })}
                            rows={2}
                            className="w-full text-xs text-cream bg-stone border border-cream/15 rounded px-2 py-1 focus:outline-none focus:border-red-400/30 resize-none"
                            placeholder="What's not ideal?"
                          />
                        ) : opt.consText ? (
                          <p className="text-xs text-cream/65 whitespace-pre-wrap">{opt.consText}</p>
                        ) : null}
                      </div>
                    )}

                    {/* Votes */}
                    {!readOnly && userEmail ? (
                      <div className="flex items-center gap-1 mt-auto pt-1">
                        {(['love', 'up', 'down'] as const).map((type) => {
                          const emoji = type === 'love' ? '❤️' : type === 'up' ? '👍' : '👎'
                          const myVote = votes[userEmail]
                          const isActive = myVote === type
                          const count = Object.values(votes).filter(v => v === type).length
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                if (!onUpdateOption) return
                                const next = { ...(opt.votes ?? {}) }
                                if (next[userEmail] === type) delete next[userEmail]
                                else next[userEmail] = type
                                onUpdateOption(opt.id, { votes: next })
                              }}
                              className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                                isActive
                                  ? 'bg-sandstone/20 text-sandstone'
                                  : 'bg-cream/8 text-cream/55 hover:bg-cream/30'
                              }`}
                            >
                              {emoji}{count > 0 ? ` ${count}` : ''}
                            </button>
                          )
                        })}
                      </div>
                    ) : (() => {
                      const hasVotes = Object.keys(votes).length > 0
                      if (!hasVotes) return null
                      return (
                        <div className="flex items-center gap-1 mt-auto pt-1">
                          {(['love', 'up', 'down'] as const).map((type) => {
                            const emoji = type === 'love' ? '❤️' : type === 'up' ? '👍' : '👎'
                            const count = Object.values(votes).filter(v => v === type).length
                            if (count === 0) return null
                            return (
                              <span key={type} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-200 text-cream/45">
                                {emoji} {count}
                              </span>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Final toggle */}
                  {!readOnly && (
                    <div className="px-3 pb-3">
                      <button
                        type="button"
                        onClick={() => onSelectOption(opt.id)}
                        className={`w-full py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          opt.isSelected
                            ? 'bg-sandstone text-basalt'
                            : 'bg-cream/10 text-cream/70 hover:bg-cream/30 hover:text-cream/90'
                        }`}
                      >
                        {opt.isSelected ? '✓ Final Decision' : 'Mark as Final'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
