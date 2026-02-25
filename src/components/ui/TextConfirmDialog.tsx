'use client'

import { useState, useEffect, useRef } from 'react'

interface TextConfirmDialogProps {
  title: string
  message: string
  confirmText: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function TextConfirmDialog({
  title,
  message,
  confirmText,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: TextConfirmDialogProps) {
  const [value, setValue] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = value.trim().toLowerCase() === confirmText.trim().toLowerCase()

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel()
      return
    }
    if (e.key === 'Enter' && matches) {
      onConfirm()
      return
    }
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-sm p-5 space-y-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="text-confirm-title"
        aria-describedby="text-confirm-message"
      >
        <h2 id="text-confirm-title" className="text-base font-medium text-cream">{title}</h2>
        <p id="text-confirm-message" className="text-sm text-cream/60">{message}</p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={confirmText}
          className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/20 focus:outline-none focus:border-sandstone/50"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-cream/70 hover:text-cream border border-cream/20 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              matches
                ? 'bg-red-500/90 text-white hover:bg-red-500'
                : 'bg-red-500/30 text-white/30 cursor-not-allowed'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
