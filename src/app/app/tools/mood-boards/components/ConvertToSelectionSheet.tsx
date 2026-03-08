'use client'

import { useState, useEffect, useRef } from 'react'
import { useToolState } from '@/hooks/useToolState'
import type {
  FinishDecisionsPayloadV4,
  SelectionV4,
  OptionV3,
} from '@/data/finish-decisions'
import type { Idea } from '@/data/mood-boards'

const DEFAULT_FD_PAYLOAD: FinishDecisionsPayloadV4 = { version: 4, selections: [] }

interface Props {
  idea: Idea
  onClose: () => void
}

export function ConvertToSelectionSheet({ idea, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { state, setState, isLoaded } = useToolState<FinishDecisionsPayloadV4>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: DEFAULT_FD_PAYLOAD,
  })

  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [targetSelectionName, setTargetSelectionName] = useState('')

  const selections = (state as FinishDecisionsPayloadV4).selections || []

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleConvert = () => {
    const newOption: OptionV3 = {
      id: crypto.randomUUID(),
      name: idea.name,
      notes: idea.notes,
      urls: idea.sourceUrl
        ? [{ id: crypto.randomUUID(), url: idea.sourceUrl }]
        : [],
      kind: idea.images.length > 0 ? 'image' : 'text',
      images:
        idea.images.length > 0
          ? idea.images.map((img) => ({
              id: img.id,
              url: img.url,
              thumbnailUrl: img.thumbnailUrl,
              label: img.label,
              sourceUrl: img.sourceUrl,
            }))
          : undefined,
      heroImageId: idea.heroImageId,
      imageUrl: idea.images[0]?.url,
      thumbnailUrl: idea.images[0]?.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (selectedSelectionId) {
      // Add option to existing selection
      const target = selections.find((s) => s.id === selectedSelectionId)
      const selName = target?.title || 'Unknown'

      setState((prev) => {
        const payload = prev as FinishDecisionsPayloadV4
        return {
          ...payload,
          selections: payload.selections.map((s) =>
            s.id === selectedSelectionId
              ? {
                  ...s,
                  options: [...s.options, newOption],
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        }
      })

      setTargetSelectionName(selName)
    } else {
      // Create a new selection with the idea's name
      const newSelection: SelectionV4 = {
        id: crypto.randomUUID(),
        title: idea.name,
        status: 'deciding',
        tags: [],
        notes: '',
        options: [newOption],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setState((prev) => {
        const payload = prev as FinishDecisionsPayloadV4
        return {
          ...payload,
          selections: [...payload.selections, newSelection],
        }
      })

      setTargetSelectionName(idea.name)
    }

    setSuccess(true)
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md p-6 text-center">
          <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div data-testid="convert-success" className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md p-6 text-center space-y-3">
          <div className="text-3xl">&#10003;</div>
          <h3 className="text-base font-medium text-cream">
            Added to Selections
          </h3>
          <p className="text-sm text-cream/60">
            Saved to{' '}
            <span className="text-cream/80">{targetSelectionName}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md p-5 space-y-4 max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base font-medium text-cream">
          Move to Selections
        </h3>
        <p className="text-sm text-cream/60">
          This will copy &quot;{idea.name}&quot; to your Selections.
          The original idea will remain in your mood board.
        </p>

        {/* Selection picker */}
        {selections.length > 0 ? (
          <div>
            <label className="block text-xs text-cream/50 mb-2">
              Selection{' '}
              <span className="text-cream/30">
                (optional — skipping creates a new selection)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {selections.map((selection) => {
                const isActive = selectedSelectionId === selection.id
                return (
                  <button
                    key={selection.id}
                    type="button"
                    onClick={() =>
                      setSelectedSelectionId(
                        isActive ? null : selection.id
                      )
                    }
                    className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      isActive
                        ? 'border-sandstone bg-sandstone/10'
                        : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-sandstone' : 'text-cream'
                      }`}
                    >
                      {selection.title}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-basalt rounded-lg p-3 text-center">
            <p className="text-cream/50 text-sm">
              No selections yet.
            </p>
            <p className="text-[11px] text-cream/30 mt-1">
              A new selection will be created with this idea.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="convert-move-btn"
            onClick={handleConvert}
            className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  )
}
