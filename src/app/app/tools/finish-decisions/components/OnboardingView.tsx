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
    <div className="py-10 max-w-md mx-auto text-center">
      <h2 className="font-serif text-2xl md:text-3xl text-sandstone mb-3">
        Start a selection board
      </h2>

      <p className="text-sm text-cream/60 leading-relaxed mb-8">
        Each board is one decision — like picking a faucet, tile, or cabinet color.
        Add a few options, compare them, and pick the one you want.
      </p>

      {/* Quick-add */}
      <div className="bg-stone rounded-xl p-5 border border-cream/15 mb-5 text-left">
        <label className="block text-sm font-medium text-cream/80 mb-2">
          What do you need to choose?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="e.g. Countertop, Faucet, Cabinet color"
            className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/50"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="px-5 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            Add
          </button>
        </div>
        <p className="text-[11px] text-cream/40 mt-2">
          You can add more boards anytime. Each one holds options you&apos;re comparing.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-cream/10" />
        <span className="text-xs text-cream/40">or start with ideas</span>
        <div className="flex-1 h-px bg-cream/10" />
      </div>

      {/* Packs CTA */}
      <button
        type="button"
        onClick={onOpenPackChooser}
        className="w-full text-left px-5 py-4 bg-stone rounded-xl border border-cream/15 hover:border-sandstone/30 transition-colors group"
      >
        <span className="text-sm font-medium text-cream group-hover:text-sandstone transition-colors">
          Browse Selection Packs
        </span>
        <p className="text-xs text-cream/50 mt-1 leading-relaxed">
          Pre-made boards with curated options — a fast way to get started without missing anything.
        </p>
      </button>
    </div>
  )
}
