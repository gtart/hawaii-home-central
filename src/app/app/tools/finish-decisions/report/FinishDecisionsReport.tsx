'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToolState } from '@/hooks/useToolState'
import type {
  FinishDecisionsPayloadV3,
  RoomV3,
  DecisionV3,
  StatusV3,
  RoomTypeV3,
} from '@/data/finish-decisions'
import { STATUS_CONFIG_V3, ROOM_EMOJI_MAP } from '@/data/finish-decisions'

const STATUS_ORDER: StatusV3[] = ['deciding', 'selected', 'ordered', 'done']

interface ReportSettings {
  logoUrl?: string
  companyName: string
  reportTitle: string
  footerText: string
}

export function FinishDecisionsReport() {
  const searchParams = useSearchParams()
  const requiredProjectId = searchParams.get('projectId')

  if (!requiredProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
        <p className="text-red-600 font-medium">Missing project ID</p>
        <p className="text-gray-500 text-sm">This report requires a valid projectId parameter.</p>
        <a href="/app/tools/finish-decisions" className="text-blue-600 underline text-sm">
          Back to Finish Selections
        </a>
      </div>
    )
  }

  return <ReportInner requiredProjectId={requiredProjectId} />
}

function ReportInner({ requiredProjectId }: { requiredProjectId: string }) {
  const searchParams = useSearchParams()
  const includeNotes = searchParams.get('includeNotes') === 'true'
  const includeComments = searchParams.get('includeComments') === 'true'
  const includePhotos = searchParams.get('includePhotos') === 'true'
  const roomIdsParam = searchParams.get('roomIds') || ''
  const filterRoomIds = useMemo(
    () => (roomIdsParam ? roomIdsParam.split(',').filter(Boolean) : []),
    [roomIdsParam]
  )

  const { state, isLoaded } = useToolState<FinishDecisionsPayloadV3>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
    projectIdOverride: requiredProjectId,
  })

  const [projectName, setProjectName] = useState<string | null>(null)
  useEffect(() => {
    if (!requiredProjectId) return
    async function loadProjectName() {
      try {
        const res = await fetch(`/api/projects/${requiredProjectId}`)
        if (res.ok) {
          const data = await res.json()
          setProjectName(data.name || null)
        }
      } catch {
        // use null
      }
    }
    loadProjectName()
  }, [requiredProjectId])

  const [settings, setSettings] = useState<ReportSettings>({
    companyName: 'HawaiiHomeCentral.com',
    reportTitle: 'Finish Selections Report',
    footerText: 'Created at HawaiiHomeCentral.com',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tools/punchlist/report-settings')
        if (res.ok) {
          const data = await res.json()
          setSettings((prev) => ({ ...prev, ...data, reportTitle: 'Finish Selections Report' }))
        }
      } catch {
        // use defaults
      }
    }
    load()
  }, [])

  const rooms = useMemo(() => {
    if (!state?.rooms) return []
    let result = state.rooms.filter((r) => r.systemKey !== 'global_uncategorized')
    if (filterRoomIds.length > 0) {
      result = result.filter((r) => filterRoomIds.includes(r.id))
    }
    return result
  }, [state?.rooms, filterRoomIds])

  const totalDecisions = useMemo(
    () => rooms.reduce((sum, r) => sum + r.decisions.length, 0),
    [rooms]
  )

  // Auto-trigger print when loaded
  useEffect(() => {
    if (isLoaded && rooms.length > 0) {
      const timeout = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timeout)
    }
  }, [isLoaded, rooms.length])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break-avoid { page-break-inside: avoid; }
          .noise-overlay { display: none !important; }
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 6px 32px;
            font-size: 9px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            background: white;
            text-align: center;
          }
          .report-content { padding-bottom: 40px; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-900 print:bg-white">
        {/* Screen-only toolbar */}
        <div className="no-print bg-basalt text-cream px-6 py-3 flex items-center justify-between">
          <a
            href="/app/tools/finish-decisions"
            className="text-sm text-cream/60 hover:text-cream transition-colors"
          >
            &larr; Back to Finish Selections
          </a>
          <div className="flex items-center gap-4">
            <span className="text-xs text-cream/40">
              Tip: Disable &ldquo;Headers and footers&rdquo; in print dialog to remove the URL
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-10 report-content">
          {/* Report header */}
          <div className="mb-8 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-2.5 mb-4">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="" className="h-8 shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-500">{settings.companyName}</span>
            </div>

            {projectName && (
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{projectName}</h1>
            )}

            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-gray-600">{settings.reportTitle}</p>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString()} &middot; {totalDecisions} decision{totalDecisions !== 1 ? 's' : ''} in {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filterRoomIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing selected rooms only ({rooms.length} of {state.rooms?.length || 0})
              </p>
            )}
          </div>

          {/* Room sections */}
          {rooms.length === 0 && (
            <p className="text-gray-500 text-center py-12">
              No rooms to display.
            </p>
          )}

          {rooms.map((room) => (
            <RoomReportSection
              key={room.id}
              room={room}
              includeNotes={includeNotes}
              includeComments={includeComments}
              includePhotos={includePhotos}
            />
          ))}

          {/* In-flow footer */}
          <div className="mt-12 pt-4 border-t border-gray-200 text-center no-print">
            <p className="text-xs text-gray-400">{settings.footerText}</p>
          </div>
        </div>

        {/* Print-only repeating footer */}
        <div className="print-footer print-only">
          {settings.footerText} &middot; {projectName || ''} &middot; {new Date().toLocaleDateString()}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Room Section
// ---------------------------------------------------------------------------

function RoomReportSection({
  room,
  includeNotes,
  includeComments,
  includePhotos,
}: {
  room: RoomV3
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
}) {
  const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '🏠'

  // Group decisions by status
  const byStatus = new Map<StatusV3, DecisionV3[]>()
  for (const d of room.decisions) {
    if (!byStatus.has(d.status)) byStatus.set(d.status, [])
    byStatus.get(d.status)!.push(d)
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">
        {emoji} {room.name} ({room.decisions.length} decision{room.decisions.length !== 1 ? 's' : ''})
      </h2>

      {STATUS_ORDER.map((status) => {
        const decisions = byStatus.get(status)
        if (!decisions || decisions.length === 0) return null
        const cfg = STATUS_CONFIG_V3[status]
        return (
          <div key={status} className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2 ml-1">
              {cfg.label} ({decisions.length})
            </h3>
            <div className="space-y-3">
              {decisions.map((d) => (
                <DecisionReportCard
                  key={d.id}
                  decision={d}
                  includeNotes={includeNotes}
                  includeComments={includeComments}
                  includePhotos={includePhotos}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

function DecisionReportCard({
  decision,
  includeNotes,
  includeComments,
  includePhotos,
}: {
  decision: DecisionV3
  includeNotes: boolean
  includeComments: boolean
  includePhotos: boolean
}) {
  const cfg = STATUS_CONFIG_V3[decision.status]
  const selectedOption = decision.options.find((o) => o.isSelected)

  return (
    <div className="page-break-avoid border border-gray-200 rounded-lg p-4">
      <div className="flex gap-4">
        {/* Option thumbnail (hero image of selected option) */}
        {includePhotos && selectedOption && getOptionHeroUrl(selectedOption) && (
          <img
            src={getOptionHeroUrl(selectedOption)!}
            alt={selectedOption.name}
            className="w-16 h-16 object-cover rounded shrink-0"
            loading="lazy"
          />
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">{decision.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <span>Status: {cfg.label}</span>
            {selectedOption && <span>Selected: {selectedOption.name}</span>}
            <span>{decision.options.length} option{decision.options.length !== 1 ? 's' : ''}</span>
            {decision.dueDate && (
              <span>Due: {new Date(decision.dueDate).toLocaleDateString()}</span>
            )}
          </div>

          {includeNotes && decision.notes && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Notes</p>
              <p className="text-sm text-gray-600 italic whitespace-pre-wrap">{decision.notes}</p>
            </div>
          )}

          {/* Options list (brief) */}
          {decision.options.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Options</p>
              <div className="space-y-1">
                {decision.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2 text-sm">
                    <span className={`inline-block w-3 h-3 rounded-sm border shrink-0 ${
                      opt.isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`} />
                    <span className={opt.isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {opt.name}
                    </span>
                    {includeNotes && opt.notes && (
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">
                        — {opt.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {includeComments && decision.comments && decision.comments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Comments ({decision.comments.length})
              </p>
              {decision.comments.map((c) => (
                <p key={c.id} className="text-xs text-gray-500 mb-0.5">
                  <span className="font-medium">{c.authorName}</span>
                  {' '}({new Date(c.createdAt).toLocaleDateString()}): {c.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOptionHeroUrl(option: { images?: Array<{ id: string; url: string }>; heroImageId?: string | null; imageUrl?: string }): string | null {
  if (option.images && option.images.length > 0) {
    const heroId = option.heroImageId
    const hero = heroId ? option.images.find((img) => img.id === heroId) : null
    return hero?.url ?? option.images[0].url
  }
  return option.imageUrl || null
}
