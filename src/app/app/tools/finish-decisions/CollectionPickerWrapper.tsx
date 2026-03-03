'use client'

import { useState } from 'react'
import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'

const SUGGESTED_BOARDS = [
  { label: 'Kitchen', emoji: '🍳' },
  { label: 'Bathroom', emoji: '🚿' },
  { label: 'Exterior', emoji: '🏡' },
]

export function CollectionPickerWrapper() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <CollectionsPickerView
          toolKey="finish_decisions"
          itemNoun="board"
          previewMode="statuses"
          customEmptyState={(onCreate) => (
            <SelectionBoardsEmptyState onCreate={onCreate} />
          )}
        />
      </div>
    </div>
  )
}

function SelectionBoardsEmptyState({ onCreate }: { onCreate: (title: string) => void }) {
  const [customName, setCustomName] = useState('')

  return (
    <div className="max-w-lg mx-auto text-center">
      <h2 className="font-serif text-3xl text-sandstone mb-2">Start your Selection Boards</h2>
      <p className="text-cream/50 text-sm leading-relaxed mb-8">
        Create one board per area&mdash;Kitchen, Bath, Exterior. Track the choices you
        need to make and what you picked.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {SUGGESTED_BOARDS.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => onCreate(b.label)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-basalt-50 border border-cream/15 hover:border-sandstone/40 rounded-lg text-sm font-medium text-cream hover:text-sandstone transition-colors"
          >
            <span>{b.emoji}</span>
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 max-w-xs mx-auto mb-6">
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && customName.trim()) onCreate(customName) }}
          placeholder="Custom board name..."
          className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
        />
        <button
          type="button"
          onClick={() => { if (customName.trim()) onCreate(customName) }}
          disabled={!customName.trim()}
          className="px-4 py-2 text-sm font-medium text-basalt bg-sandstone rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-40"
        >
          Create
        </button>
      </div>

      <p className="text-[11px] text-cream/30">
        You can also apply a Decision Pack inside any board to add curated selections.
      </p>
    </div>
  )
}
