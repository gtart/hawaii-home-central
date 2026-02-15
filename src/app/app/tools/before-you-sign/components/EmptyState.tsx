'use client'

import { useState, useRef, useEffect } from 'react'

interface EmptyStateProps {
  onAdd: (name: string) => string
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <div className="text-center py-12 px-4">
      <p className="text-cream/60 text-base mb-1">
        Add your first contractor to start comparing
      </p>
      <p className="text-cream/35 text-sm mb-6">
        You can add more later and compare them side by side.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="inline-flex items-center gap-2"
      >
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contractor name"
          className="px-4 py-2 rounded-lg text-sm bg-basalt border border-cream/15 text-cream placeholder:text-cream/30 outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone w-48"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-sandstone text-basalt hover:bg-sandstone/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
    </div>
  )
}
