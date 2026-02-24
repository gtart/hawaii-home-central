'use client'

import type { OptionV3, DecisionV3 } from '@/data/finish-decisions'

interface CompareModalProps {
  options: OptionV3[]
  decision: DecisionV3
  readOnly: boolean
  onSelectOption: (id: string) => void
  onClose: () => void
}

export function CompareModal({
  options,
  decision,
  readOnly,
  onSelectOption,
  onClose,
}: CompareModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="relative bg-basalt-50 border border-cream/10 w-full md:max-w-3xl md:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-medium text-cream">
            Compare {options.length} Options
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Drag handle on mobile */}
        <div className="md:hidden flex justify-center py-1">
          <div className="w-8 h-1 rounded-full bg-cream/20" />
        </div>

        {/* Columns */}
        <div className="p-4">
          <div className={`grid gap-3 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {options.map((opt) => {
              const isImage = opt.kind === 'image' && (opt.imageUrl || opt.thumbnailUrl)
              const linkPreview = !isImage && opt.urls?.[0]?.linkImage
              const votes = opt.votes ?? {}
              const upCount = Object.values(votes).filter((v) => v === 'up').length
              const downCount = Object.values(votes).filter((v) => v === 'down').length

              return (
                <div key={opt.id} className="flex flex-col bg-basalt rounded-lg border border-cream/10 overflow-hidden">
                  {/* Image / Preview */}
                  <div className="aspect-[4/3] relative bg-basalt-50">
                    {isImage ? (
                      <img
                        src={opt.imageUrl || opt.thumbnailUrl}
                        alt={opt.name || 'Option'}
                        className="w-full h-full object-cover"
                      />
                    ) : linkPreview ? (
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(linkPreview)}`}
                        alt={opt.name || 'Option'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3">
                        <p className="text-sm text-cream/30 text-center line-clamp-4">
                          {opt.notes || opt.name || 'No preview'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-cream line-clamp-2">
                      {opt.name || <span className="text-cream/30 italic">Untitled</span>}
                    </p>

                    {opt.notes && (
                      <p className="text-[11px] text-cream/40 line-clamp-2">{opt.notes}</p>
                    )}

                    {/* Votes */}
                    {(upCount > 0 || downCount > 0) && (
                      <div className="flex items-center gap-2 text-[11px] text-cream/50">
                        {upCount > 0 && <span>👍 {upCount}</span>}
                        {downCount > 0 && <span>👎 {downCount}</span>}
                      </div>
                    )}
                  </div>

                  {/* Final toggle */}
                  {!readOnly && (
                    <div className="px-2.5 pb-2.5">
                      <button
                        type="button"
                        onClick={() => onSelectOption(opt.id)}
                        className={`w-full py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          opt.isSelected
                            ? 'bg-sandstone text-basalt'
                            : 'bg-cream/10 text-cream/60 hover:bg-cream/15 hover:text-cream/80'
                        }`}
                      >
                        {opt.isSelected ? '✓ Final' : 'Mark Final'}
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
