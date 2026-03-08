'use client'

import { useState, useRef, useEffect } from 'react'

export const TAG_SUGGESTIONS = [
  'Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Laundry',
  'Exterior', 'Flooring', 'Lighting', 'Hardware', 'Paint',
  'Countertops', 'Cabinets', 'Appliances', 'Plumbing',
  'Phase 1', 'Phase 2', 'Budget-friendly', 'Splurge',
]

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  allTags?: string[]
  readOnly?: boolean
  placeholder?: string
  compact?: boolean
}

export function TagInput({
  tags,
  onChange,
  allTags = [],
  readOnly = false,
  placeholder = 'Add tag...',
  compact = false,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const lowerTags = new Set(tags.map((t) => t.toLowerCase()))

  // Merge allTags + suggestions, deduplicate, exclude already-applied
  const availableTags = Array.from(
    new Set([...allTags, ...TAG_SUGGESTIONS])
  ).filter((t) => !lowerTags.has(t.toLowerCase()))

  const filtered = input.trim()
    ? availableTags.filter((t) => t.toLowerCase().includes(input.toLowerCase()))
    : availableTags

  // Show "Create" option if input doesn't match any suggestion exactly
  const exactMatch = filtered.some((t) => t.toLowerCase() === input.trim().toLowerCase())
  const showCreate = input.trim().length > 0 && !exactMatch && !lowerTags.has(input.trim().toLowerCase())

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || lowerTags.has(trimmed.toLowerCase())) return
    onChange([...tags, trimmed])
    setInput('')
    setHighlightIdx(-1)
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIdx >= 0 && highlightIdx < filtered.length) {
        addTag(filtered[highlightIdx])
      } else if (showCreate) {
        addTag(input.trim())
      } else if (filtered.length > 0) {
        addTag(filtered[0])
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1 + (showCreate ? 1 : 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  if (readOnly) {
    if (tags.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center rounded-full bg-cream/8 text-cream/50 ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'}`}
          >
            {tag}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex flex-wrap items-center gap-1 bg-basalt border border-cream/15 rounded-lg transition-colors focus-within:border-sandstone/40 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full bg-cream/10 text-cream/60 ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'}`}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              className="text-cream/30 hover:text-cream/60 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); setHighlightIdx(-1) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className={`flex-1 min-w-[80px] bg-transparent text-cream placeholder:text-cream/25 outline-none ${compact ? 'text-xs py-0.5' : 'text-sm py-0.5'}`}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-30 mt-1 w-full max-h-[180px] overflow-y-auto bg-basalt-50 border border-cream/15 rounded-lg shadow-lg">
          {filtered.slice(0, 12).map((tag, idx) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag) }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                idx === highlightIdx
                  ? 'bg-sandstone/15 text-sandstone'
                  : 'text-cream/60 hover:bg-cream/5'
              }`}
            >
              {tag}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(input.trim()) }}
              onMouseEnter={() => setHighlightIdx(filtered.length)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors border-t border-cream/10 ${
                highlightIdx === filtered.length
                  ? 'bg-sandstone/15 text-sandstone'
                  : 'text-cream/50 hover:bg-cream/5'
              }`}
            >
              Create &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
