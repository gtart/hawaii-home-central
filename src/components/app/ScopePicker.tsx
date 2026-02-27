'use client'

interface ScopeOption {
  id: string
  name: string
  emoji?: string
}

interface ScopePickerProps {
  label: string  // "Rooms" | "Boards" | "Locations"
  options: ScopeOption[]
  mode: 'all' | 'selected'
  selectedIds: Set<string>
  onModeChange: (mode: 'all' | 'selected') => void
  onToggleId: (id: string) => void
}

export type { ScopeOption }

export function ScopePicker({
  label,
  options,
  mode,
  selectedIds,
  onModeChange,
  onToggleId,
}: ScopePickerProps) {
  if (options.length < 2) return null

  return (
    <div>
      <p className="text-sm text-cream/70 mb-3">Scope</p>
      <div className="space-y-2 mb-3">
        <label className="flex items-center gap-3 px-3 py-2 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
          <input
            type="radio"
            name="scope"
            checked={mode === 'all'}
            onChange={() => onModeChange('all')}
            className="accent-sandstone"
          />
          <span className="text-sm text-cream">All {label}</span>
        </label>
        <label className="flex items-center gap-3 px-3 py-2 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
          <input
            type="radio"
            name="scope"
            checked={mode === 'selected'}
            onChange={() => onModeChange('selected')}
            className="accent-sandstone"
          />
          <span className="text-sm text-cream">Selected {label}</span>
        </label>
      </div>

      {mode === 'selected' && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggleId(opt.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                selectedIds.has(opt.id)
                  ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                  : 'border-cream/20 text-cream/40 hover:border-cream/30'
              }`}
            >
              {opt.emoji ? `${opt.emoji} ` : ''}{opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
