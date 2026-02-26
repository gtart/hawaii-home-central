'use client'

import { useState } from 'react'

interface Props {
  boardId: string
  boardName: string
  onClose: () => void
}

type Layout = 'grid' | 'list'

export function ExportBoardModal({ boardId, boardName, onClose }: Props) {
  const [includeComments, setIncludeComments] = useState(false)
  const [includeReactions, setIncludeReactions] = useState(true)
  const [layout, setLayout] = useState<Layout>('grid')
  const [confirmed, setConfirmed] = useState(false)

  function handleExport() {
    const url = `/app/tools/mood-boards/report?board=${encodeURIComponent(boardId)}&comments=${includeComments}&reactions=${includeReactions}&layout=${layout}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-cream/10 flex items-center justify-between">
          <h2 className="text-lg font-medium text-cream">Export Board</h2>
          <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Board being exported */}
          <div className="bg-basalt rounded-lg px-3 py-2">
            <p className="text-xs text-cream/40">Exporting</p>
            <p className="text-sm text-cream font-medium">{boardName}</p>
          </div>

          {/* Layout */}
          <div>
            <p className="text-sm text-cream/70 mb-3">Layout</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="layout"
                  checked={layout === 'grid'}
                  onChange={() => setLayout('grid')}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">Grid</p>
                  <p className="text-xs text-cream/40">2-up images, compact view</p>
                </div>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="layout"
                  checked={layout === 'list'}
                  onChange={() => setLayout('list')}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">List</p>
                  <p className="text-xs text-cream/40">One idea per row, more detail</p>
                </div>
              </label>
            </div>
          </div>

          {/* Include options */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
              <input
                type="checkbox"
                checked={includeReactions}
                onChange={(e) => setIncludeReactions(e.target.checked)}
                className="accent-sandstone"
              />
              <div>
                <p className="text-sm text-cream">Include reactions</p>
                <p className="text-xs text-cream/40">Show love/like/dislike counts per idea</p>
              </div>
            </label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                className="accent-sandstone"
              />
              <div>
                <p className="text-sm text-cream">Include comments</p>
                <p className="text-xs text-cream/40">Discussion threads on ideas</p>
              </div>
            </label>
          </div>

          {/* Confirmation */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-sandstone"
            />
            <span className="text-sm text-cream/60">
              I&apos;ve reviewed the settings above
            </span>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={!confirmed}
            className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
          >
            Open Print Preview
          </button>

          <p className="text-xs text-cream/30 text-center">
            Tip: In the print dialog, disable &ldquo;Headers and footers&rdquo; to remove the URL from the PDF.
          </p>
        </div>
      </div>
    </div>
  )
}
