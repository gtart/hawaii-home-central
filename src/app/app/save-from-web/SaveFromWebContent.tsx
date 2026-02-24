'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { useToolState } from '@/hooks/useToolState'
import type { FinishDecisionsPayloadV3, OptionV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP, type RoomTypeV3 } from '@/data/finish-decisions'
import { ImportFromUrlPanel } from '@/app/app/tools/finish-decisions/components/ImportFromUrlPanel'

const DEFAULT_PAYLOAD: FinishDecisionsPayloadV3 = { version: 3, rooms: [] }

export function SaveFromWebContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill URL from query param (for future bookmarklet: ?url=...)
  const initialUrl = searchParams.get('url') || ''

  const { currentProject, projects, isLoading: projectsLoading } = useProject()

  const { state, setState, isLoaded, readOnly } = useToolState<FinishDecisionsPayloadV3>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: DEFAULT_PAYLOAD,
  })

  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const rooms = (state as FinishDecisionsPayloadV3).rooms || []

  // Flatten decisions with room context for the picker
  const decisionOptions = rooms.flatMap((room) =>
    room.decisions.map((d) => ({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type as RoomTypeV3,
      decisionId: d.id,
      decisionTitle: d.title,
    })),
  )

  const handleImport = (result: {
    name: string
    notes: string
    sourceUrl: string
    selectedImages: Array<{ id: string; url: string; thumbnailUrl?: string; label?: string; sourceUrl?: string }>
  }) => {
    if (!selectedDecisionId) return

    const newOption: OptionV3 = {
      id: crypto.randomUUID(),
      name: result.name,
      notes: result.notes,
      urls: [
        {
          id: crypto.randomUUID(),
          url: result.sourceUrl,
        },
      ],
      kind: result.selectedImages.length > 0 ? 'image' : 'text',
      images: result.selectedImages.length > 0 ? result.selectedImages : undefined,
      heroImageId: result.selectedImages[0]?.id || null,
      imageUrl: result.selectedImages[0]?.url,
      thumbnailUrl: result.selectedImages[0]?.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) => ({
        ...r,
        decisions: r.decisions.map((d) =>
          d.id === selectedDecisionId
            ? {
                ...d,
                options: [...d.options, newOption],
                updatedAt: new Date().toISOString(),
              }
            : d,
        ),
        updatedAt: new Date().toISOString(),
      })),
    }))

    setSaved(true)
  }

  // Loading states
  if (projectsLoading || !isLoaded) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">
          <div className="h-8 w-48 bg-cream/10 rounded animate-pulse mb-4" />
          <div className="h-4 w-64 bg-cream/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-cream/60">No project found. Create a project first.</p>
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="mt-4 text-sandstone hover:text-sandstone-light transition-colors text-sm"
          >
            &larr; Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (readOnly) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-cream/60">You have view-only access to this project.</p>
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="mt-4 text-sandstone hover:text-sandstone-light transition-colors text-sm"
          >
            &larr; Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (saved) {
    const target = decisionOptions.find((d) => d.decisionId === selectedDecisionId)
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="font-serif text-2xl text-sandstone mb-2">Idea saved!</h1>
          {target && (
            <p className="text-cream/60 text-sm mb-6">
              Added to {target.decisionTitle} in {target.roomName}
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setSaved(false)}
              className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
            >
              Save another
            </button>
            <button
              type="button"
              onClick={() => {
                if (target) {
                  router.push(`/app/tools/finish-decisions/decision/${target.decisionId}`)
                } else {
                  router.push('/app/tools/finish-decisions')
                }
              }}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              View in Selections
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <button
          type="button"
          onClick={() => router.push('/app/tools/finish-decisions')}
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-4 inline-block"
        >
          &larr; Back to Selections
        </button>

        <h1 className="font-serif text-2xl md:text-3xl text-sandstone mb-2">
          Save from Web
        </h1>
        <p className="text-cream/60 text-sm mb-6">
          Paste a product page URL to import images and create an idea.
        </p>

        {/* Destination picker */}
        {decisionOptions.length === 0 ? (
          <div className="bg-basalt-50 rounded-lg p-6 text-center mb-6">
            <p className="text-cream/50 text-sm mb-3">
              No selections yet. Add rooms and selections first.
            </p>
            <button
              type="button"
              onClick={() => router.push('/app/tools/finish-decisions')}
              className="text-sandstone text-sm hover:text-sandstone-light transition-colors"
            >
              Go to Finish Selections
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-xs text-cream/50 mb-2">Save to selection</label>
            <select
              value={selectedDecisionId || ''}
              onChange={(e) => setSelectedDecisionId(e.target.value || null)}
              className="w-full bg-basalt-50 border border-cream/20 text-cream text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-sandstone"
            >
              <option value="">Choose a selection...</option>
              {rooms.map((room) => (
                <optgroup
                  key={room.id}
                  label={`${ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'} ${room.name}`}
                >
                  {room.decisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Import panel (only when destination selected) */}
        {selectedDecisionId && (
          <div className="bg-basalt-50 rounded-xl p-4 border border-cream/10">
            <ImportFromUrlPanel
              onImport={handleImport}
              onCancel={() => setSelectedDecisionId(null)}
              mode="create-idea"
            />
          </div>
        )}

        {/* Multi-project notice */}
        {projects.length > 1 && (
          <p className="text-[11px] text-cream/30 mt-6">
            Saving to: {currentProject.name}. Switch projects from the dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
