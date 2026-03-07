'use client'

import { useState, useEffect, useRef } from 'react'

interface HeaderMoreMenuProps {
  onRename?: () => void
  onArchive?: () => void
}

export function HeaderMoreMenu({ onRename, onArchive }: HeaderMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Click-away close
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Don't render if no actions
  if (!onRename && !onArchive) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sandstone/40 hover:text-sandstone/70 hover:bg-cream/5 transition-colors"
        aria-label="More actions"
      >
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl z-50 overflow-hidden py-1">
          {onRename && (
            <button
              type="button"
              onClick={() => { setOpen(false); onRename() }}
              className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 hover:text-cream transition-colors flex items-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Rename
            </button>
          )}

          {onRename && onArchive && (
            <div className="my-1 border-t border-cream/10" />
          )}

          {onArchive && (
            <button
              type="button"
              onClick={() => { setOpen(false); onArchive() }}
              className="w-full text-left px-3 py-2 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="5" rx="1" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  )
}
