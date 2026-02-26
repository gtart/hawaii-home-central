'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePunchlistState } from '../usePunchlistState'
import type { PunchlistItem, PunchlistStatus } from '../types'

const STATUS_LABEL: Record<PunchlistStatus, string> = {
  OPEN: 'Open',
  ACCEPTED: 'Accepted',
  DONE: 'Done',
}

const STATUS_ORDER: PunchlistStatus[] = ['OPEN', 'ACCEPTED', 'DONE']

const VALID_STATUSES = new Set<string>(['OPEN', 'ACCEPTED', 'DONE'])

interface ReportSettings {
  logoUrl?: string
  companyName: string
  reportTitle: string
  footerText: string
}

interface GroupedSection {
  label: string
  subgroups: { label: string; items: PunchlistItem[] }[]
}

function buildGroups(items: PunchlistItem[], orgMode: string): GroupedSection[] {
  if (orgMode === 'status_room') {
    // Status → Room
    return STATUS_ORDER
      .map((status) => {
        const statusItems = items.filter((i) => i.status === status)
        if (statusItems.length === 0) return null
        const byRoom = new Map<string, PunchlistItem[]>()
        for (const item of statusItems) {
          const key = item.location || 'Unassigned'
          if (!byRoom.has(key)) byRoom.set(key, [])
          byRoom.get(key)!.push(item)
        }
        const rooms = Array.from(byRoom.keys()).sort((a, b) => {
          if (a === 'Unassigned') return 1
          if (b === 'Unassigned') return -1
          return a.localeCompare(b)
        })
        return {
          label: `${STATUS_LABEL[status]} (${statusItems.length})`,
          subgroups: rooms.map((room) => ({
            label: room,
            items: byRoom.get(room)!,
          })),
        }
      })
      .filter(Boolean) as GroupedSection[]
  }

  // Default: Room → Status
  const byRoom = new Map<string, PunchlistItem[]>()
  for (const item of items) {
    const key = item.location || 'Unassigned'
    if (!byRoom.has(key)) byRoom.set(key, [])
    byRoom.get(key)!.push(item)
  }
  const rooms = Array.from(byRoom.keys()).sort((a, b) => {
    if (a === 'Unassigned') return 1
    if (b === 'Unassigned') return -1
    return a.localeCompare(b)
  })

  return rooms.map((room) => {
    const roomItems = byRoom.get(room)!
    const subgroups = STATUS_ORDER
      .map((status) => {
        const sub = roomItems.filter((i) => i.status === status)
        if (sub.length === 0) return null
        return { label: STATUS_LABEL[status], items: sub }
      })
      .filter(Boolean) as { label: string; items: PunchlistItem[] }[]
    return {
      label: `${room} (${roomItems.length})`,
      subgroups,
    }
  })
}

export function PunchlistReport() {
  const searchParams = useSearchParams()
  const requiredProjectId = searchParams.get('projectId')
  const includeNotes = searchParams.get('includeNotes') === 'true'
  const includeComments = searchParams.get('includeComments') === 'true'
  const includePhotos = searchParams.get('includePhotos') === 'true'
  const orgMode = searchParams.get('org') || 'room_status'
  const statusParam = searchParams.get('statuses') || 'OPEN,ACCEPTED'
  const includedStatuses = useMemo(
    () => new Set(statusParam.split(',').filter((s) => VALID_STATUSES.has(s)) as PunchlistStatus[]),
    [statusParam]
  )
  const locationsParam = searchParams.get('locations') || ''
  const assigneesParam = searchParams.get('assignees') || ''
  const filterLocations = useMemo(
    () => (locationsParam ? locationsParam.split(',').filter(Boolean) : []),
    [locationsParam]
  )
  const filterAssignees = useMemo(
    () => (assigneesParam ? assigneesParam.split(',').filter(Boolean) : []),
    [assigneesParam]
  )

  // P0.3: Fetch data for the URL's projectId, not the session's currentProject
  const { payload, isLoaded } = usePunchlistState(
    requiredProjectId ? { projectIdOverride: requiredProjectId } : undefined
  )

  // Fetch project name from API for the report header
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
        // use null — header will just not show project name
      }
    }
    loadProjectName()
  }, [requiredProjectId])

  const [settings, setSettings] = useState<ReportSettings>({
    companyName: 'HawaiiHomeCentral.com',
    reportTitle: 'Fix List Report',
    footerText: 'Created at HawaiiHomeCentral.com',
  })

  // Load admin report settings
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tools/punchlist/report-settings')
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch {
        // use defaults
      }
    }
    load()
  }, [])

  // Auto-trigger print when loaded
  useEffect(() => {
    if (isLoaded && payload.items.length > 0) {
      const timeout = setTimeout(() => window.print(), 500)
      return () => clearTimeout(timeout)
    }
  }, [isLoaded, payload.items.length])

  const reportItems = useMemo(
    () =>
      payload.items
        .filter((i) => includedStatuses.has(i.status))
        .filter((i) => filterLocations.length === 0 || filterLocations.includes(i.location))
        .filter((i) => filterAssignees.length === 0 || filterAssignees.includes(i.assigneeLabel)),
    [payload.items, includedStatuses, filterLocations, filterAssignees]
  )

  const sections = useMemo(
    () => buildGroups(reportItems, orgMode),
    [reportItems, orgMode]
  )

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
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
            href="/app/tools/punchlist"
            className="text-sm text-cream/60 hover:text-cream transition-colors"
          >
            &larr; Back to Fix List
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
            {/* Company branding row */}
            <div className="flex items-center gap-2.5 mb-4">
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="" className="h-8 shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-500">{settings.companyName}</span>
            </div>

            {/* Project name — prominent */}
            {projectName && (
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{projectName}</h1>
            )}

            {/* Report type + metadata */}
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-gray-600">{settings.reportTitle}</p>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString()} &middot; {reportItems.length} items
              </p>
            </div>

            {/* Filter summary (only shown when filters are active) */}
            {(filterLocations.length > 0 || filterAssignees.length > 0) && (
              <p className="text-xs text-gray-500 mt-2">
                {filterLocations.length > 0 && (
                  <span>Location: {filterLocations.join(', ')}</span>
                )}
                {filterLocations.length > 0 && filterAssignees.length > 0 && <span> &middot; </span>}
                {filterAssignees.length > 0 && (
                  <span>Assignee: {filterAssignees.join(', ')}</span>
                )}
              </p>
            )}
          </div>

          {/* Grouped items */}
          {reportItems.length === 0 && (
            <p className="text-gray-500 text-center py-12">
              No items match the selected filters.
            </p>
          )}
          {sections.map((section) => (
            <div key={section.label} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">
                {section.label}
              </h2>
              {section.subgroups.map((sub) => (
                <div key={sub.label} className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 ml-1">{sub.label}</h3>
                  <div className="space-y-3">
                    {sub.items.map((item) => (
                      <ReportItem key={item.id} item={item} includeNotes={includeNotes} includeComments={includeComments} includePhotos={includePhotos} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* In-flow footer (screen view) */}
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

function ReportItem({ item, includeNotes, includeComments, includePhotos }: { item: PunchlistItem; includeNotes: boolean; includeComments: boolean; includePhotos: boolean }) {
  return (
    <div className="page-break-avoid border border-gray-200 rounded-lg p-4">
      <div className="flex gap-4">
        {/* Photo thumbnails */}
        {includePhotos && item.photos.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {item.photos.slice(0, 3).map((photo) => (
              <img
                key={photo.id}
                src={photo.thumbnailUrl || photo.url}
                alt=""
                className="w-16 h-16 object-cover rounded"
                loading="lazy"
              />
            ))}
            {item.photos.length > 3 && (
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                +{item.photos.length - 3}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            {/* Print-friendly checkbox square */}
            <span className="inline-block w-3.5 h-3.5 border border-gray-400 rounded-sm shrink-0" />
            <span className="text-gray-400 font-normal">#{item.itemNumber}</span>
            <span>{item.title}</span>
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
            <span>Location: {item.location}</span>
            <span>Assignee: {item.assigneeLabel}</span>
            <span>Priority: {item.priority || '—'}</span>
            <span>Status: {STATUS_LABEL[item.status]}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Created: {new Date(item.createdAt).toLocaleDateString()}
            {item.completedAt && <> &middot; Completed: {new Date(item.completedAt).toLocaleDateString()}</>}
          </div>
          {includeNotes && item.notes && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Additional Information</p>
              <p className="text-sm text-gray-600 italic">{item.notes}</p>
            </div>
          )}
          {includeComments && item.comments && item.comments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Comments ({item.comments.length})</p>
              {item.comments.map((c) => (
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
