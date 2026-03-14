'use client'

import { useState, useRef, useEffect } from 'react'
import type { SummaryLink, SummaryLinkType } from '@/data/project-summary'

interface AttachMenuProps {
  onAttach: (link: Omit<SummaryLink, 'id'>) => void
  readOnly?: boolean
}

/**
 * Dropdown menu for attaching links to a change or open decision.
 * Supports linking to Selections, Fix items, and documents.
 *
 * For Selections/Fix items: uses a simple label input (no cross-tool data fetch).
 * Navigation to create those items is handled by CreateProjectSummaryEntryButton.
 */
export function AttachMenu({ onAttach, readOnly }: AttachMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<SummaryLinkType | null>(null)
  const [label, setLabel] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setMode(null)
        setLabel('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  if (readOnly) return null

  function handleSubmit() {
    if (!label.trim() || !mode) return
    onAttach({
      linkType: mode,
      label: label.trim(),
      ...(mode === 'selection' ? { toolKey: 'finish_decisions' } : {}),
      ...(mode === 'fix_item' ? { toolKey: 'punchlist' } : {}),
    })
    setLabel('')
    setMode(null)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-cream/20 hover:text-cream/40 transition-colors"
        title="Attach link"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-6 z-50 w-56 rounded-lg border border-cream/10 bg-[#1a1a1a] shadow-xl">
          {!mode ? (
            <div className="py-1">
              <button
                type="button"
                onClick={() => setMode('selection')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-cream/60 hover:bg-cream/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Link Selection
              </button>
              <button
                type="button"
                onClick={() => setMode('fix_item')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-cream/60 hover:bg-cream/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Link Fix Item
              </button>
              <button
                type="button"
                onClick={() => setMode('document')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-cream/60 hover:bg-cream/5 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Link Document
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-cream/40">
                <button
                  type="button"
                  onClick={() => { setMode(null); setLabel('') }}
                  className="hover:text-cream/60 transition-colors"
                >
                  &larr;
                </button>
                {mode === 'selection' && 'Link Selection'}
                {mode === 'fix_item' && 'Link Fix Item'}
                {mode === 'document' && 'Link Document'}
              </div>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  mode === 'selection' ? 'Selection name...' :
                  mode === 'fix_item' ? 'Fix item name...' :
                  'Document name...'
                }
                className="w-full bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setMode(null); setIsOpen(false); setLabel('') } }}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!label.trim()}
                className="w-full px-2 py-1.5 text-xs bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md transition-colors disabled:opacity-30"
              >
                Add Link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
