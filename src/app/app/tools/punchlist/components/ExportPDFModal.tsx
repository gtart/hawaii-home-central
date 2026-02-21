'use client'

import { useState } from 'react'
import type { PunchlistStatus } from '../types'

interface Props {
  onClose: () => void
}

type OrgMode = 'room_status' | 'status_room'

const STATUS_CHECKS: { key: PunchlistStatus; label: string }[] = [
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
]

export function ExportPDFModal({ onClose }: Props) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeComments, setIncludeComments] = useState(false)
  const [org, setOrg] = useState<OrgMode>('room_status')
  const [includedStatuses, setIncludedStatuses] = useState<Set<PunchlistStatus>>(new Set(['OPEN', 'IN_PROGRESS']))
  const [confirmed, setConfirmed] = useState(false)

  function toggleStatus(s: PunchlistStatus) {
    setIncludedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) {
        if (next.size > 1) next.delete(s)
      } else {
        next.add(s)
      }
      return next
    })
  }

  function handleExport() {
    const statuses = Array.from(includedStatuses).join(',')
    const url = `/app/tools/punchlist/report?includeNotes=${includeNotes}&includeComments=${includeComments}&org=${org}&statuses=${statuses}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-cream/10 flex items-center justify-between">
          <h2 className="text-lg font-medium text-cream">Export Report</h2>
          <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Organization mode */}
          <div>
            <p className="text-sm text-cream/70 mb-3">Organize report by</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="org"
                  checked={org === 'room_status'}
                  onChange={() => setOrg('room_status')}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">By Room, then Status</p>
                  <p className="text-xs text-cream/40">Group items by location first</p>
                </div>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="org"
                  checked={org === 'status_room'}
                  onChange={() => setOrg('status_room')}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">By Status, then Room</p>
                  <p className="text-xs text-cream/40">Group items by status first</p>
                </div>
              </label>
            </div>
          </div>

          {/* Status inclusion */}
          <div>
            <p className="text-sm text-cream/70 mb-3">Include statuses</p>
            <div className="flex gap-2">
              {STATUS_CHECKS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleStatus(s.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    includedStatuses.has(s.key)
                      ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                      : 'border-cream/20 text-cream/40 hover:border-cream/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Information option */}
          <div>
            <p className="text-sm text-cream/70 mb-3">Include additional information in report?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="includeNotes"
                  checked={!includeNotes}
                  onChange={() => setIncludeNotes(false)}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">Without additional info</p>
                  <p className="text-xs text-cream/40">Clean report for contractors</p>
                </div>
              </label>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
                <input
                  type="radio"
                  name="includeNotes"
                  checked={includeNotes}
                  onChange={() => setIncludeNotes(true)}
                  className="accent-sandstone"
                />
                <div>
                  <p className="text-sm text-cream">With additional info</p>
                  <p className="text-xs text-cream/40">Includes your additional information</p>
                </div>
              </label>
            </div>
          </div>

          {/* Comments option */}
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-cream/10 cursor-pointer transition-colors hover:bg-cream/5">
            <input
              type="checkbox"
              checked={includeComments}
              onChange={(e) => setIncludeComments(e.target.checked)}
              className="accent-sandstone"
            />
            <div>
              <p className="text-sm text-cream">Include comments</p>
              <p className="text-xs text-cream/40">Discussion threads on each item</p>
            </div>
          </label>

          {/* Confirmation */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-sandstone"
            />
            <span className="text-sm text-cream/60">
              I&apos;ve reviewed the settings above
            </span>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={!confirmed}
            className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
          >
            Open Print Preview
          </button>

          <p className="text-xs text-cream/30 text-center">
            Tip: In the print dialog, disable &ldquo;Headers and footers&rdquo; to remove the URL from the PDF.
          </p>
        </div>
      </div>
    </div>
  )
}
