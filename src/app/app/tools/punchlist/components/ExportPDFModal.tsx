'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
}

export function ExportPDFModal({ onClose }: Props) {
  const [includeNotes, setIncludeNotes] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function handleExport() {
    const url = `/app/tools/punchlist/report?includeNotes=${includeNotes}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-cream/10 flex items-center justify-between">
          <h2 className="text-lg font-medium text-cream">Export Report</h2>
          <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Notes option */}
          <div>
            <p className="text-sm text-cream/70 mb-3">Include notes in report?</p>
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
                  <p className="text-sm text-cream">Without notes</p>
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
                  <p className="text-sm text-cream">With notes</p>
                  <p className="text-xs text-cream/40">Includes your private notes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Confirmation */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-sandstone"
            />
            <span className="text-sm text-cream/60">
              I&apos;ve reviewed the notes setting above
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
            Use your browser&apos;s print dialog to save as PDF.
          </p>
        </div>
      </div>
    </div>
  )
}
