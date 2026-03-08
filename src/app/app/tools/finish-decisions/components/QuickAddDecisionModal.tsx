'use client'

import { useState, useEffect, useRef } from 'react'
import type { SelectionV4, StatusV3 } from '@/data/finish-decisions'
import { TagInput } from './TagInput'

interface Props {
  onAdd: (selection: SelectionV4) => void
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement | null>
  allTags?: string[]
}

export function QuickAddDecisionModal({ onAdd, onClose, triggerRef, allTags }: Props) {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  function handleClose() {
    setTags([])
    onClose()
    // Return focus to trigger element
    setTimeout(() => triggerRef?.current?.focus(), 0)
  }

  function handleAdd() {
    const t = title.trim()
    if (!t) {
      setError('Enter a title for the selection')
      return
    }

    const now = new Date().toISOString()
    const selection: SelectionV4 = {
      id: crypto.randomUUID(),
      title: t,
      status: 'deciding' as StatusV3,
      notes: '',
      options: [],
      tags,
      createdAt: now,
      updatedAt: now,
    }

    onAdd(selection)
    handleClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  // Focus trap
  function handleModalKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onKeyDown={handleModalKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-md"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-medium text-cream">Add Selection</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-cream/40 hover:text-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Selection name</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Countertop, Faucet, Tile..."
              className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Tags</label>
            <TagInput
              tags={tags}
              onChange={setTags}
              allTags={allTags ?? []}
              compact
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Actions */}
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
