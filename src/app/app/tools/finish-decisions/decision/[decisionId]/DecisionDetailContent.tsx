'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useToolState } from '@/hooks/useToolState'
import { OptionEditor } from '../../components/OptionEditor'
import { getHeuristicsConfig, matchDecision } from '@/lib/decisionHeuristics'
import {
  STATUS_CONFIG_V3,
  ROOM_TYPE_OPTIONS_V3,
  type DecisionV3,
  type OptionV3,
  type StatusV3,
  type RoomV3,
  type FinishDecisionsPayloadV3,
} from '@/data/finish-decisions'

export function DecisionDetailContent() {
  const params = useParams()
  const router = useRouter()
  const decisionId = params.decisionId as string

  const { state, setState, isLoaded } = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })

  const v3State =
    state.version === 3
      ? (state as FinishDecisionsPayloadV3)
      : { version: 3 as const, rooms: [] }

  // Find the room and decision
  let foundRoom: RoomV3 | undefined
  let foundDecision: DecisionV3 | undefined

  for (const room of v3State.rooms) {
    const decision = room.decisions.find((d) => d.id === decisionId)
    if (decision) {
      foundRoom = room
      foundDecision = decision
      break
    }
  }

  const updateDecision = (updates: Partial<DecisionV3>) => {
    if (!foundRoom) return
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) =>
        r.id === foundRoom!.id
          ? {
              ...r,
              decisions: r.decisions.map((d) =>
                d.id === decisionId
                  ? { ...d, ...updates, updatedAt: new Date().toISOString() }
                  : d
              ),
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  }

  const addOption = () => {
    if (!foundDecision) return
    updateDecision({
      options: [
        ...foundDecision.options,
        {
          id: crypto.randomUUID(),
          name: '',
          notes: '',
          urls: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })
  }

  const updateOption = (optionId: string, updates: Partial<OptionV3>) => {
    if (!foundDecision) return
    updateDecision({
      options: foundDecision.options.map((opt) =>
        opt.id === optionId
          ? { ...opt, ...updates, updatedAt: new Date().toISOString() }
          : opt
      ),
    })
  }

  const deleteOption = (optionId: string) => {
    if (!foundDecision) return
    if (confirm('Delete this option?')) {
      updateDecision({
        options: foundDecision.options.filter((opt) => opt.id !== optionId),
      })
    }
  }

  const selectOption = (optionId: string) => {
    if (!foundDecision) return
    updateDecision({
      options: foundDecision.options.map((opt) => ({
        ...opt,
        isSelected: opt.id === optionId,
        updatedAt: new Date().toISOString(),
      })),
    })
  }

  const deleteDecision = () => {
    if (!foundRoom || !foundDecision) return
    if (confirm(`Delete "${foundDecision.title}"? This will also delete all options.`)) {
      setState((prev) => ({
        ...prev,
        rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) =>
          r.id === foundRoom!.id
            ? {
                ...r,
                decisions: r.decisions.filter((d) => d.id !== decisionId),
                updatedAt: new Date().toISOString(),
              }
            : r
        ),
      }))
      router.push('/app/tools/finish-decisions')
    }
  }

  if (!isLoaded) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center py-12 text-cream/50">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!foundDecision || !foundRoom) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/app/tools/finish-decisions')}
            className="text-sandstone hover:text-sandstone-light text-sm mb-6"
          >
            ← Back to Decision Tracker
          </button>
          <div className="bg-basalt-50 rounded-card p-12 text-center">
            <p className="text-cream/50 mb-4">Decision not found.</p>
            <Button onClick={() => router.push('/app/tools/finish-decisions')}>
              Go to Decision Tracker
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const roomTypeLabel = ROOM_TYPE_OPTIONS_V3.find((t) => t.value === foundRoom.type)?.label

  // eslint-disable-next-line react/no-unstable-nested-components -- colocated for clarity
  function GuidancePanel({
    decision,
    roomType,
    onDismiss,
  }: {
    decision: DecisionV3
    roomType: string
    onDismiss: (key: string) => void
  }) {
    const config = getHeuristicsConfig()
    const selectedOption = decision.options.find((opt) => opt.isSelected)

    const result = useMemo(
      () =>
        matchDecision(
          config,
          decision.title,
          roomType,
          selectedOption?.name,
          decision.dismissedSuggestionKeys
        ),
      [config, decision.title, roomType, selectedOption?.name, decision.dismissedSuggestionKeys]
    )

    const hasContent =
      result.milestones.length > 0 || result.impacts.length > 0 || result.advice.length > 0

    if (!hasContent) return null

    return (
      <div className="mb-8 bg-basalt-50 rounded-card p-4 border border-sandstone/10">
        <h3 className="text-sm font-medium text-sandstone mb-3">Guidance</h3>

        {/* Timing / Milestones */}
        {result.milestones.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-cream/50 uppercase tracking-wide">Timing</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {result.milestones.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 bg-sandstone/15 text-sandstone text-xs px-2.5 py-1 rounded-full"
                >
                  {m.label}
                  <button
                    onClick={() => onDismiss(`m:${m.id}`)}
                    className="text-sandstone/50 hover:text-sandstone/80 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coordination Impacts */}
        {result.impacts.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-cream/50 uppercase tracking-wide">
              Coordination watchouts
            </span>
            <ul className="mt-1.5 space-y-1">
              {result.impacts.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between text-sm text-cream/70"
                >
                  <span>• {i.label}</span>
                  <button
                    onClick={() => onDismiss(`i:${i.id}`)}
                    className="text-cream/30 hover:text-cream/60 text-xs ml-2 shrink-0"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Advice */}
        {result.advice.length > 0 && (
          <div>
            <span className="text-xs text-cream/50 uppercase tracking-wide">Advice</span>
            <ul className="mt-1.5 space-y-1.5">
              {result.advice.map((a) => (
                <li
                  key={a.key}
                  className="flex items-start justify-between text-sm text-cream/60"
                >
                  <span className="leading-relaxed">{a.text}</span>
                  <button
                    onClick={() => onDismiss(a.key)}
                    className="text-cream/30 hover:text-cream/60 text-xs ml-2 shrink-0 mt-0.5"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.push('/app/tools/finish-decisions')}
          className="text-sandstone hover:text-sandstone-light text-sm mb-6"
        >
          ← Back to Decision Tracker
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="default" className="text-xs">
              {foundRoom.name}
            </Badge>
            <Badge variant="default" className="text-xs">
              {roomTypeLabel}
            </Badge>
          </div>

          <Input
            value={foundDecision.title}
            onChange={(e) => updateDecision({ title: e.target.value })}
            className="text-2xl font-serif"
          />
        </div>

        {/* Status */}
        <div className="mb-6">
          <Select
            label="Status"
            value={foundDecision.status}
            onChange={(e) => updateDecision({ status: e.target.value as StatusV3 })}
            options={Object.entries(STATUS_CONFIG_V3).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
          />
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <label className="block text-sm text-cream/70 mb-1.5">Due Date</label>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="date"
              value={foundDecision.dueDate || ''}
              onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
              className="bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark]"
            />
            {foundDecision.dueDate && (
              <button
                onClick={() => updateDecision({ dueDate: null })}
                className="text-xs text-cream/40 hover:text-cream/70"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Next week', days: 7 },
              { label: 'In two weeks', days: 14 },
              { label: 'In a month', days: 30 },
              { label: 'In several months', days: 90 },
            ].map((chip) => {
              const target = new Date()
              target.setDate(target.getDate() + chip.days)
              const iso = target.toISOString().split('T')[0]
              const isActive = foundDecision.dueDate === iso

              return (
                <button
                  key={chip.label}
                  onClick={() => updateDecision({ dueDate: iso })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                      : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
            <button
              onClick={() => updateDecision({ dueDate: null })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                foundDecision.dueDate === null || foundDecision.dueDate === undefined
                  ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                  : 'bg-cream/10 text-cream/60 hover:text-cream/80'
              }`}
            >
              TBD
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
          <textarea
            value={foundDecision.notes}
            onChange={(e) => updateDecision({ notes: e.target.value })}
            className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[120px]"
            placeholder="General notes about this decision..."
          />
        </div>

        {/* Guidance Panel */}
        <GuidancePanel
          decision={foundDecision}
          roomType={foundRoom.type}
          onDismiss={(key) => {
            updateDecision({
              dismissedSuggestionKeys: [
                ...(foundDecision.dismissedSuggestionKeys || []),
                key,
              ],
            })
          }}
        />

        {/* Options */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-cream">
              Options ({foundDecision.options.length})
            </h2>
            <Button size="sm" variant="secondary" onClick={addOption}>
              + Add Option
            </Button>
          </div>

          {foundDecision.options.length === 0 ? (
            <div className="bg-basalt-50 rounded-card p-8 text-center">
              <p className="text-cream/50 text-sm">
                No options yet. Add an option to start comparing choices.
              </p>
            </div>
          ) : (
            foundDecision.options.map((option) => (
              <OptionEditor
                key={option.id}
                option={option}
                isSelected={option.isSelected}
                onUpdate={(updates) => updateOption(option.id, updates)}
                onDelete={() => deleteOption(option.id)}
                onSelect={() => selectOption(option.id)}
              />
            ))
          )}
        </div>

        {/* Delete Decision */}
        <div className="pt-6 border-t border-cream/10">
          <Button variant="danger" onClick={deleteDecision}>
            Delete Decision
          </Button>
        </div>
      </div>
    </div>
  )
}
