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

export function OnboardingView({
  onBatchCreate,
  collapsed,
  onToggleCollapse,
  defaultDecisions,
}: {
  onBatchCreate: (selections: RoomSelection[]) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  defaultDecisions?: Record<RoomTypeV3, string[]>
}) {
  const resolvedDefaults = defaultDecisions || DEFAULT_DECISIONS_BY_ROOM_TYPE
  const [selectedTypes, setSelectedTypes] = useState<Set<RoomTypeV3>>(new Set())
  const [templates, setTemplates] = useState<Record<string, 'standard' | 'none'>>({})
  const [globalTemplate, setGlobalTemplate] = useState<'standard' | 'none'>('standard')
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

  const handleBatchCreate = () => {
    const selections: RoomSelection[] = Array.from(selectedTypes).map((type) => {
      const label =
        type === 'other' && customOtherName.trim()
          ? customOtherName.trim()
          : ROOM_TYPE_OPTIONS_V3.find((opt) => opt.value === type)?.label || 'Room'
      return {
        type,
        name: label === 'Custom Area' ? (customOtherName.trim() || 'Custom Area') : label,
        template: type === 'other' ? 'none' : (templates[type] || globalTemplate),
      }
    })
    onBatchCreate(selections)
    setSelectedTypes(new Set())
    setTemplates({})
    setCustomOtherName('')
  }

  // When collapsed (rooms already exist), render nothing — the "+ Add a Room"
  // button in the filter bar replaces this link.
  if (collapsed) {
    return null
  }

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
            What are you renovating?
          </h2>
        </div>
      ) : (
        <h2 className="font-serif text-3xl md:text-4xl text-sandstone">
          What are you renovating?
        </h2>
      )}
      <p className={cn(
        'text-cream/60 mb-6',
        isCollapsible ? 'text-sm' : 'text-lg mt-2'
      )}>
        Pick the rooms and areas for your project.
      </p>

      {/* Global template toggle */}
      {!isCollapsible && (
        <div className="flex rounded-lg bg-cream/5 p-1 mb-6 max-w-md">
          <button
            type="button"
            onClick={() => {
              setGlobalTemplate('standard')
              setTemplates((prev) => {
                const next = { ...prev }
                for (const type of selectedTypes) {
                  if (type !== 'other') next[type] = 'standard'
                }
                return next
              })
            }}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
              globalTemplate === 'standard'
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
            onClick={() => {
              setGlobalTemplate('none')
              setTemplates((prev) => {
                const next = { ...prev }
                for (const type of selectedTypes) {
                  if (type !== 'other') next[type] = 'none'
                }
                return next
              })
            }}
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
              globalTemplate === 'none'
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
          const currentTemplate = templates[opt.value] || globalTemplate

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

              {/* Expanded details when selected */}
              {isSelected && (
                <div
                  className="mt-3 pt-3 border-t border-cream/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCustom ? (
                    /* Custom Area — name input only, no template */
                    <Input
                      placeholder="Name this area..."
                      value={customOtherName}
                      onChange={(e) => setCustomOtherName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs"
                    />
                  ) : (
                    /* Standard rooms — template selector */
                    <select
                      value={currentTemplate}
                      onChange={(e) => {
                        setTemplates((prev) => ({
                          ...prev,
                          [opt.value]: e.target.value as 'standard' | 'none',
                        }))
                      }}
                      className="w-full bg-basalt border border-cream/20 text-cream text-xs px-2 py-1 rounded-lg focus:outline-none focus:border-sandstone"
                    >
                      <option value="standard">Recommended decisions ({decisionCount})</option>
                      <option value="none">Blank (start empty)</option>
                    </select>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Helper text */}
      <p className="text-cream/40 text-xs mb-6">
        Recommended decisions pre-fill typical decisions for each room (e.g., Countertop,
        Cabinetry, Flooring). After creating, you can add Ideas Packs for starter options.
      </p>

      {/* Action button */}
      <Button onClick={handleBatchCreate} disabled={selectedTypes.size === 0}>
        {buttonLabel(isCollapsible, selectedTypes.size)}
      </Button>
    </div>
  )
}

function buttonLabel(hasRooms: boolean, count: number): string {
  if (count === 0) {
    return hasRooms ? 'Add Rooms' : 'Create Finish Selections'
  }
  const label = count === 1 ? 'room' : 'rooms'
  return hasRooms ? `Add ${count} ${label}` : `Create Finish Selections (${count} ${label})`
}
