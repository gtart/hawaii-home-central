'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  ROOM_TYPE_OPTIONS_V3,
  ROOM_EMOJI_MAP,
  DEFAULT_DECISIONS_BY_ROOM_TYPE,
  type RoomTypeV3,
  type RoomSelection,
} from '@/data/finish-decisions'

type OnboardingLevel = 'none' | 'standard' | 'pack'

const LEVEL_CARDS: {
  value: OnboardingLevel
  label: string
  description: string
  micro: string
}[] = [
  {
    value: 'none',
    label: 'Start empty (blank board)',
    description: 'Create a room board with no decisions. Add only what you want.',
    micro: 'Best if you already know what you need to pick.',
  },
  {
    value: 'standard',
    label: 'Start with a decision checklist (recommended)',
    description:
      "We\u2019ll add the common decisions you\u2019ll need for this room (faucet, sink, lighting, paint, etc.). You\u2019ll add options and product ideas next.",
    micro: "Best for homeowners who don\u2019t want to miss anything.",
  },
  {
    value: 'pack',
    label: 'Start with an Idea Pack (fastest)',
    description:
      'Adds a decision checklist plus curated starter options for each decision\u2014so you can compare and choose faster.',
    micro: 'Includes expert advice and partner shortlists (always labeled).',
  },
]

export function OnboardingView({
  onBatchCreate,
  onRequestPackChooser,
  collapsed,
  onToggleCollapse,
  defaultDecisions,
}: {
  onBatchCreate: (selections: RoomSelection[]) => void
  /** Called when user picks "Idea Pack" level — parent should open pack modal after creating rooms */
  onRequestPackChooser?: (selections: RoomSelection[]) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  defaultDecisions?: Record<RoomTypeV3, string[]>
}) {
  const resolvedDefaults = defaultDecisions || DEFAULT_DECISIONS_BY_ROOM_TYPE
  const [selectedTypes, setSelectedTypes] = useState<Set<RoomTypeV3>>(new Set())
  const [level, setLevel] = useState<OnboardingLevel>('standard')
  const [customOtherName, setCustomOtherName] = useState('')

  const isCollapsible = onToggleCollapse !== undefined

  const toggleType = (type: RoomTypeV3) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const buildSelections = (): RoomSelection[] => {
    return Array.from(selectedTypes).map((type) => {
      const label =
        type === 'other' && customOtherName.trim()
          ? customOtherName.trim()
          : ROOM_TYPE_OPTIONS_V3.find((opt) => opt.value === type)?.label || 'Room'
      // For "pack" level, create rooms with standard decisions first (pack gets applied after)
      const template = type === 'other' ? 'none' : (level === 'pack' ? 'standard' : level)
      return {
        type,
        name: label === 'Custom Area' ? (customOtherName.trim() || 'Custom Area') : label,
        template: template as RoomSelection['template'],
      }
    })
  }

  const handleCreate = () => {
    const selections = buildSelections()
    if (level === 'pack' && onRequestPackChooser) {
      // Create rooms with checklist, then open pack chooser
      onBatchCreate(selections)
      onRequestPackChooser(selections)
    } else {
      onBatchCreate(selections)
    }
    setSelectedTypes(new Set())
    setCustomOtherName('')
  }

  // When collapsed (rooms already exist), render nothing
  if (collapsed) {
    return null
  }

  const ctaLabel =
    level === 'pack'
      ? 'Choose an Idea Pack'
      : level === 'standard'
        ? isCollapsible
          ? `Create board + checklist`
          : `Create board + checklist`
        : isCollapsible
          ? 'Create board'
          : 'Create board'

  return (
    <div className={cn(isCollapsible && 'bg-basalt-50 rounded-card p-4 mb-6')}>
      {/* Header */}
      {isCollapsible ? (
        <div
          className="flex items-center gap-3 cursor-pointer mb-3"
          onClick={onToggleCollapse}
        >
          <span className="text-cream/40 text-sm select-none">▼</span>
          <h2 className="font-serif text-xl text-sandstone">
            Start your first Decision Board
          </h2>
        </div>
      ) : (
        <h2 className="font-serif text-3xl md:text-4xl text-sandstone">
          Start your first Decision Board
        </h2>
      )}
      <p className={cn(
        'text-cream/60 mb-6',
        isCollapsible ? 'text-sm' : 'text-lg mt-2'
      )}>
        Choose how much help you want up front. You can always add more later.
      </p>

      {/* Three-level ladder */}
      {!isCollapsible && (
        <div className="space-y-3 mb-6 max-w-lg">
          {LEVEL_CARDS.map((card) => {
            const isActive = level === card.value
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => setLevel(card.value)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  isActive
                    ? 'border-sandstone bg-sandstone/5'
                    : 'border-cream/10 bg-basalt-50 hover:border-cream/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                    isActive ? 'border-sandstone' : 'border-cream/30'
                  )}>
                    {isActive && (
                      <div className="w-2.5 h-2.5 rounded-full bg-sandstone" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'block font-medium text-sm',
                      isActive ? 'text-sandstone' : 'text-cream/80'
                    )}>
                      {card.label}
                    </span>
                    <span className="block text-xs text-cream/50 mt-1 leading-relaxed">
                      {card.description}
                    </span>
                    <span className="block text-[11px] text-cream/30 mt-1.5 italic">
                      {card.micro}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Collapsible mode: simpler toggle (for adding rooms after initial setup) */}
      {isCollapsible && (
        <div className="flex rounded-lg bg-cream/5 p-1 mb-6 max-w-md">
          <button
            type="button"
            onClick={() => setLevel('standard')}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
              level === 'standard'
                ? 'bg-sandstone/20 text-sandstone'
                : 'text-cream/50 hover:text-cream/70'
            )}
          >
            <span className="block">Recommended decisions</span>
            <span className="block text-[10px] font-normal mt-0.5 opacity-70">
              Pre-fill typical decisions for each room
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLevel('none')}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
              level === 'none'
                ? 'bg-sandstone/20 text-sandstone'
                : 'text-cream/50 hover:text-cream/70'
            )}
          >
            <span className="block">Start minimal</span>
            <span className="block text-[10px] font-normal mt-0.5 opacity-70">
              Add your own decisions from scratch
            </span>
          </button>
        </div>
      )}

      {/* Room cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {ROOM_TYPE_OPTIONS_V3.map((opt) => {
          const isSelected = selectedTypes.has(opt.value)
          const isCustom = opt.value === 'other'
          const decisionCount = (resolvedDefaults[opt.value] || []).length

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleType(opt.value)}
              className={cn(
                'relative bg-basalt-50 rounded-card p-4 text-left transition-all border-2',
                isCollapsible && 'bg-basalt',
                isSelected
                  ? 'border-sandstone bg-sandstone/5'
                  : 'border-transparent hover:border-cream/20'
              )}
            >
              {/* Checkmark */}
              {isSelected && (
                <span className="absolute top-3 right-3 text-sandstone text-sm font-bold">
                  ✓
                </span>
              )}

              <div className="text-2xl mb-2">{ROOM_EMOJI_MAP[opt.value]}</div>
              <div className="text-cream font-medium text-sm">{opt.label}</div>

              {/* Decision count hint */}
              {isSelected && !isCustom && level !== 'none' && decisionCount > 0 && (
                <div className="mt-1 text-[10px] text-cream/40">
                  {decisionCount} decisions
                </div>
              )}

              {/* Custom area name input */}
              {isSelected && isCustom && (
                <div
                  className="mt-3 pt-3 border-t border-cream/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    placeholder="Name this area..."
                    value={customOtherName}
                    onChange={(e) => setCustomOtherName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs"
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer tip */}
      <p className="text-cream/40 text-xs mb-6">
        Tip: A checklist helps you remember what to decide. An Idea Pack helps you see what to choose.
      </p>

      {/* Action button */}
      <Button onClick={handleCreate} disabled={selectedTypes.size === 0}>
        {selectedTypes.size === 0
          ? (isCollapsible ? 'Select rooms' : 'Select rooms to get started')
          : isCollapsible
            ? `Add ${selectedTypes.size} room${selectedTypes.size !== 1 ? 's' : ''}`
            : ctaLabel}
      </Button>
    </div>
  )
}
