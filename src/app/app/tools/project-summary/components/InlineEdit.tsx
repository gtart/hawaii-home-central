'use client'

import { useState, useRef, useEffect } from 'react'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  multiline?: boolean
  className?: string
  displayClassName?: string
}

export function InlineEdit({
  value,
  onSave,
  placeholder = 'Click to edit...',
  readOnly,
  multiline,
  className = '',
  displayClassName = '',
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      }
    }
  }, [isEditing, multiline])

  function handleSave() {
    const trimmed = draft.trim()
    setIsEditing(false)
    if (trimmed !== value) {
      onSave(trimmed)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setDraft(value)
      setIsEditing(false)
    }
    if (!multiline && e.key === 'Enter') {
      handleSave()
    }
  }

  if (readOnly) {
    return (
      <div className={`${displayClassName} ${!value ? 'text-cream/20 italic' : ''}`}>
        {value || placeholder}
      </div>
    )
  }

  if (!isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsEditing(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(true) }}
        className={`cursor-text rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-cream/5 transition-colors ${displayClassName} ${!value ? 'text-cream/20 italic' : ''}`}
      >
        {value || placeholder}
      </div>
    )
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-cream/5 border border-cream/10 rounded-md px-2 py-1 text-cream/80 placeholder-cream/20 outline-none focus:border-sandstone/30 resize-none ${className}`}
        rows={3}
      />
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full bg-cream/5 border border-cream/10 rounded-md px-2 py-1 text-cream/80 placeholder-cream/20 outline-none focus:border-sandstone/30 ${className}`}
    />
  )
}
