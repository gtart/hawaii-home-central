'use client'

import { useState } from 'react'

export function OnboardingView({
  onAddSelection,
  onOpenPackChooser,
  readOnly,
}: {
  onAddSelection: (title: string) => void
  onOpenPackChooser: () => void
  readOnly?: boolean
}) {
  const [inputValue, setInputValue] = useState('')

  if (readOnly) return null

  const handleAdd = () => {
    const title = inputValue.trim()
    if (!title) return
    onAddSelection(title)
    setInputValue('')
  }

  return (
    <div className="py-8 max-w-md mx-auto">
      <h2 className="font-serif text-2xl md:text-3xl text-sandstone mb-2">
        Add your first selection to make
      </h2>

      <p className="text-sm text-cream/50 leading-relaxed mb-6">
        Create a Selection List to finalize your choices and make it easier.
      </p>

      {/* Add selection input */}
      <div className="bg-basalt-50 rounded-xl p-5 border border-cream/10 mb-5">
        <label className="block text-sm font-medium text-cream/70 mb-2">
          What do you need to choose?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="e.g. Countertop, Faucet, Cabinet color"
            className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-cream/10" />
        <span className="text-xs text-cream/30">or</span>
        <div className="flex-1 h-px bg-cream/10" />
      </div>

      {/* Decision Pack CTA */}
      <button
        type="button"
        onClick={onOpenPackChooser}
        className="w-full text-left px-5 py-4 bg-basalt-50 rounded-xl border border-cream/10 hover:border-sandstone/30 transition-colors group"
      >
        <span className="text-sm font-medium text-cream group-hover:text-sandstone transition-colors">
          Add a Selection Pack
        </span>
        <p className="text-xs text-cream/40 mt-1 leading-relaxed">
          Packs add common selections and curated options — so you don&apos;t miss anything.
        </p>
      </button>
    </div>
  )
}
