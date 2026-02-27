'use client'

import { useState, useEffect, useRef } from 'react'
import { useToolState } from '@/hooks/useToolState'
import type {
  FinishDecisionsPayloadV3,
  RoomV3,
  DecisionV3,
  OptionV3,
  RoomTypeV3,
} from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP } from '@/data/finish-decisions'
import {
  ensureGlobalUnsortedRoom,
  findGlobalUnsortedRoom,
  ensureUncategorizedDecision,
  findUncategorizedDecision,
  isGlobalUnsorted,
} from '@/lib/decisionHelpers'
import type { Idea } from '@/data/mood-boards'

const DEFAULT_FD_PAYLOAD: FinishDecisionsPayloadV3 = { version: 3, rooms: [] }

interface Props {
  idea: Idea
  onClose: () => void
}

export function ConvertToSelectionSheet({ idea, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { state, setState, isLoaded } = useToolState<FinishDecisionsPayloadV3>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: DEFAULT_FD_PAYLOAD,
  })

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [targetRoomName, setTargetRoomName] = useState('')
  const [targetDecisionName, setTargetDecisionName] = useState('')

  const rooms = (state as FinishDecisionsPayloadV3).rooms || []
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)

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

    let resolvedRoomId = selectedRoomId
    let resolvedDecisionId = selectedDecisionId
    let resolvedRoomName = ''
    let resolvedDecisionName = ''

    const currentRooms = (state as FinishDecisionsPayloadV3).rooms

    if (!resolvedRoomId) {
      const ensured = ensureGlobalUnsortedRoom(currentRooms)
      const globalRoom = findGlobalUnsortedRoom(ensured)!
      resolvedRoomId = globalRoom.id
      resolvedRoomName = 'Unsorted'
      const uncat = findUncategorizedDecision(globalRoom)!
      resolvedDecisionId = uncat.id
      resolvedDecisionName = 'Uncategorized'
    } else {
      const targetRoom = currentRooms.find((r) => r.id === resolvedRoomId)
      resolvedRoomName = targetRoom?.name || 'Unknown'
      if (!resolvedDecisionId && targetRoom) {
        const withUncat = ensureUncategorizedDecision(targetRoom)
        const uncat = findUncategorizedDecision(withUncat)!
        resolvedDecisionId = uncat.id
        resolvedDecisionName = 'Uncategorized'
      } else if (resolvedDecisionId && targetRoom) {
        const dec = targetRoom.decisions.find(
          (d) => d.id === resolvedDecisionId
        )
        resolvedDecisionName = dec?.title || ''
      }
    }

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV3
      let updatedRooms = payload.rooms

      if (!selectedRoomId) {
        updatedRooms = ensureGlobalUnsortedRoom(updatedRooms)
      }

      const newRooms = updatedRooms.map((r) => {
        if (r.id !== resolvedRoomId) return r
        let room = r
        if (!selectedDecisionId) {
          room = ensureUncategorizedDecision(room)
        }
        return {
          ...room,
          decisions: room.decisions.map((d) =>
            d.id === resolvedDecisionId
              ? {
                  ...d,
                  options: [...d.options, newOption],
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
          updatedAt: new Date().toISOString(),
        }
      })

      return { ...payload, rooms: newRooms }
    })

    setTargetRoomName(resolvedRoomName)
    setTargetDecisionName(resolvedDecisionName)
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
            Added to Decision Boards
          </h3>
          <p className="text-sm text-cream/60">
            Saved to{' '}
            <span className="text-cream/80">{targetDecisionName}</span> in{' '}
            <span className="text-cream/80">{targetRoomName}</span>
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
          Move to Decision Boards
        </h3>
        <p className="text-sm text-cream/60">
          This will copy &quot;{idea.name}&quot; to your Decision Boards.
          The original idea will remain in your mood board.
        </p>

        {/* Room picker */}
        {rooms.filter((r) => !isGlobalUnsorted(r)).length > 0 ? (
          <div>
            <label className="block text-xs text-cream/50 mb-2">
              Room{' '}
              <span className="text-cream/30">
                (optional — skipping saves to Unsorted)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {rooms
                .filter((r) => !isGlobalUnsorted(r))
                .map((room) => {
                  const emoji =
                    ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '\u270F\uFE0F'
                  const isActive = selectedRoomId === room.id
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoomId(
                          isActive ? null : room.id
                        )
                        setSelectedDecisionId(null)
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                        isActive
                          ? 'border-sandstone bg-sandstone/10'
                          : 'border-cream/10 hover:border-cream/25 bg-basalt-50'
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? 'text-sandstone' : 'text-cream'
                          }`}
                        >
                          {room.name}
                        </p>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        ) : (
          <div className="bg-basalt rounded-lg p-3 text-center">
            <p className="text-cream/50 text-sm">
              No rooms yet in Decision Boards.
            </p>
            <p className="text-[11px] text-cream/30 mt-1">
              The idea will be saved to Unsorted.
            </p>
          </div>
        )}

        {/* Decision picker */}
        {selectedRoom &&
          selectedRoom.decisions.filter((d) => d.systemKey !== 'uncategorized')
            .length > 0 && (
            <div>
              <label className="block text-xs text-cream/50 mb-2">
                Decision{' '}
                <span className="text-cream/30">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedRoom.decisions
                  .filter((d) => d.systemKey !== 'uncategorized')
                  .map((decision) => {
                    const isActive = selectedDecisionId === decision.id
                    return (
                      <button
                        key={decision.id}
                        type="button"
                        onClick={() =>
                          setSelectedDecisionId(
                            isActive ? null : decision.id
                          )
                        }
                        className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${
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
                          {decision.title}
                        </p>
                      </button>
                    )
                  })}
              </div>
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
