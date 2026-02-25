'use client'

import { useEffect, useRef } from 'react'
import { ImportFromUrlPanel } from './ImportFromUrlPanel'
import type { OptionImageV3 } from '@/data/finish-decisions'

interface ImportResult {
  name: string
  notes: string
  sourceUrl: string
  selectedImages: OptionImageV3[]
}

export function SaveFromWebDialog({
  onImport,
  onClose,
}: {
  onImport: (result: ImportResult) => void
  onClose: () => void
}) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-basalt-50 border border-cream/15 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-4 z-10 rounded-t-xl">
          <div>
            <h2 className="text-lg font-medium text-cream">Save from web</h2>
            <p className="text-xs text-cream/40 mt-0.5">
              Paste a link to import images + details into the Idea Board.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0 ml-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <ImportFromUrlPanel
            mode="create-idea"
            onImport={onImport}
            onCancel={onClose}
          />

          {/* Advanced link */}
          <div className="mt-6 pt-4 border-t border-cream/10">
            <p className="text-[11px] text-cream/30">
              Need the bookmarklet or advanced options?{' '}
              <a
                href="/app/save-from-web"
                className="text-sandstone/60 hover:text-sandstone transition-colors"
              >
                Open Save from Web page
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
