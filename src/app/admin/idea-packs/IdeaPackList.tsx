'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface IdeaPackRow {
  id: string
  packId: string
  label: string
  description: string
  author: string
  status: string
  roomTypes: string[]
  decisions: { title: string; options: { name: string; notes: string }[] }[]
  sortOrder: number
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-green-500/15 text-green-400',
  DRAFT: 'bg-amber-500/15 text-amber-400',
  ARCHIVED: 'bg-cream/10 text-cream/40',
}

const AUTHOR_LABELS: Record<string, string> = {
  HHC: 'HHC',
  DESIGNER: 'Designer',
  VENDOR: 'Vendor',
}

export function IdeaPackList() {
  const router = useRouter()
  const [packs, setPacks] = useState<IdeaPackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showImport, setShowImport] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importResult, setImportResult] = useState<{ diff: { summary: string }; existing: boolean } | null>(null)
  const [importError, setImportError] = useState('')

  const loadPacks = useCallback(async () => {
    setLoading(true)
    const url = statusFilter === 'all'
      ? '/api/admin/idea-packs'
      : `/api/admin/idea-packs?status=${statusFilter}`
    const res = await fetch(url)
    if (res.ok) setPacks(await res.json())
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { loadPacks() }, [loadPacks])

  async function handleCreateNew() {
    const packId = `kit-new-${Date.now()}`
    const res = await fetch('/api/admin/idea-packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packId,
        label: 'New Decision Pack',
        description: '',
        decisions: [],
        roomTypes: [],
      }),
    })
    if (res.ok) {
      const pack = await res.json()
      router.push(`/admin/idea-packs/${pack.id}`)
    }
  }

  async function handleImportPreview() {
    setImportError('')
    setImportResult(null)
    try {
      const pack = JSON.parse(importJson)
      const res = await fetch('/api/admin/idea-packs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, confirm: false }),
      })
      if (!res.ok) {
        const err = await res.json()
        setImportError(err.error || 'Import failed')
        return
      }
      setImportResult(await res.json())
    } catch {
      setImportError('Invalid JSON')
    }
  }

  async function handleImportConfirm() {
    try {
      const pack = JSON.parse(importJson)
      const res = await fetch('/api/admin/idea-packs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, confirm: true }),
      })
      if (res.ok) {
        setShowImport(false)
        setImportJson('')
        setImportResult(null)
        loadPacks()
      }
    } catch {
      setImportError('Import failed')
    }
  }

  function handleExport(pack: IdeaPackRow) {
    const kit = {
      id: pack.packId,
      label: pack.label,
      description: pack.description,
      author: pack.author.toLowerCase(),
      roomTypes: pack.roomTypes,
      decisionTitles: pack.decisions.map((d) => d.title),
      decisions: pack.decisions,
    }
    const blob = new Blob([JSON.stringify(kit, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pack.packId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Actions row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-cream/5 rounded-lg p-0.5">
          {['all', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                statusFilter === s
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowImport(true)}
          className="px-3 py-1.5 text-xs text-cream/60 hover:text-cream border border-cream/15 hover:border-cream/30 rounded-lg transition-colors"
        >
          Import JSON
        </button>
        <button
          onClick={handleCreateNew}
          className="px-3 py-1.5 text-xs text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg font-medium transition-colors"
        >
          + New Pack
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-cream/40 py-8 text-center">Loading...</p>
      ) : packs.length === 0 ? (
        <p className="text-sm text-cream/40 py-8 text-center">No packs found.</p>
      ) : (
        <table className="w-full">
          <thead className="border-b border-cream/10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-cream/50 uppercase">Label</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-cream/50 uppercase">Author</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-cream/50 uppercase">Room Types</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-cream/50 uppercase">Status</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-cream/50 uppercase">Decisions</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-cream/50 uppercase">Options</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-cream/50 uppercase">Updated</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {packs.map((pack) => {
              const totalOptions = pack.decisions.reduce((s, d) => s + d.options.length, 0)
              return (
                <tr
                  key={pack.id}
                  onClick={() => router.push(`/admin/idea-packs/${pack.id}`)}
                  className="border-b border-cream/5 hover:bg-cream/5 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div className="text-sm text-cream font-medium">{pack.label}</div>
                    <div className="text-[11px] text-cream/35">{pack.packId}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-cream/60">
                    {AUTHOR_LABELS[pack.author] || pack.author}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {pack.roomTypes.map((rt) => (
                        <span key={rt} className="text-[10px] px-1.5 py-0.5 bg-cream/5 rounded text-cream/40">
                          {rt}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[pack.status] || ''}`}>
                      {pack.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-cream/50">{pack.decisions.length}</td>
                  <td className="px-3 py-2.5 text-center text-xs text-cream/50">{totalOptions}</td>
                  <td className="px-3 py-2.5 text-right text-xs text-cream/40">
                    {new Date(pack.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport(pack) }}
                      className="text-cream/30 hover:text-cream/60 text-xs transition-colors"
                      title="Export JSON"
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowImport(false)}>
          <div className="bg-basalt-50 rounded-xl border border-cream/15 p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-medium text-cream mb-4">Import Decision Pack JSON</h2>
            <textarea
              value={importJson}
              onChange={(e) => { setImportJson(e.target.value); setImportResult(null); setImportError('') }}
              placeholder="Paste a FinishDecisionKit JSON object here..."
              className="w-full h-48 bg-basalt border border-cream/15 rounded-lg p-3 text-sm text-cream font-mono resize-none focus:outline-none focus:border-sandstone/50"
            />
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
            {importResult && (
              <div className="mt-3 p-3 bg-cream/5 rounded-lg">
                <p className="text-sm text-cream/70">{importResult.diff.summary}</p>
                <p className="text-[11px] text-cream/40 mt-1">
                  {importResult.existing ? 'This will update the existing pack.' : 'This will create a new pack as DRAFT.'}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImport(false)}
                className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream transition-colors"
              >
                Cancel
              </button>
              {!importResult ? (
                <button
                  onClick={handleImportPreview}
                  disabled={!importJson.trim()}
                  className="px-4 py-1.5 text-xs text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg font-medium transition-colors disabled:opacity-40"
                >
                  Preview Changes
                </button>
              ) : (
                <button
                  onClick={handleImportConfirm}
                  className="px-4 py-1.5 text-xs text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg font-medium transition-colors"
                >
                  Confirm Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
