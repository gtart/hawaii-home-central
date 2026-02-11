'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/Button'

type Step = 'upload' | 'validate' | 'confirm' | 'results'

interface ValidationRow {
  row: number
  title: string
  status: 'valid' | 'warning' | 'error'
  action: 'create' | 'update'
  messages: string[]
}

interface ImportResult {
  row: number
  title: string
  status: string
  id?: string
  error?: string
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [validation, setValidation] = useState<ValidationRow[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [results, setResults] = useState<ImportResult[]>([])
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/import/export')
      if (!res.ok) {
        setError('Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'hhc-content-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleCsvUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            setError(`CSV parse errors: ${result.errors.map((e) => e.message).join(', ')}`)
            return
          }
          setRows(result.data as Record<string, string>[])
          setError('')
        },
        error: (err) => {
          setError(`CSV parse failed: ${err.message}`)
        },
      })
    },
    []
  )

  const handleValidate = async () => {
    setError('')
    try {
      const res = await fetch('/api/admin/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Validation failed')
        return
      }

      const data = await res.json()
      setValidation(data.results)
      setSummary(data.summary)
      setStep('validate')
    } catch {
      setError('Validation failed')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Import failed')
        return
      }

      const data = await res.json()
      setResults(data.results)
      setSummary(data.summary)
      setStep('results')
    } catch {
      setError('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const statusColor = (s: string) => {
    if (s === 'valid' || s === 'created') return 'text-green-400'
    if (s === 'updated') return 'text-blue-400'
    if (s === 'warning') return 'text-yellow-400'
    return 'text-red-400'
  }

  const actionBadge = (action: 'create' | 'update') => {
    if (action === 'update') {
      return (
        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
          Update
        </span>
      )
    }
    return (
      <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
        Create
      </span>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex gap-2 text-xs">
        {(['upload', 'validate', 'confirm', 'results'] as Step[]).map(
          (s, i) => (
            <div
              key={s}
              className={`px-3 py-1 rounded ${
                step === s
                  ? 'bg-sandstone text-basalt font-medium'
                  : 'bg-basalt-50 text-cream/30'
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          )
        )}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          {/* Export */}
          <div className="bg-basalt-50 rounded-card p-5 flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm font-medium">Export All Content</p>
              <p className="text-cream/40 text-xs mt-1">
                Download all articles as CSV. Edit in a spreadsheet, then re-upload to update.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Download CSV'}
            </Button>
          </div>

          {/* Import */}
          <div className="bg-basalt-50 rounded-card p-6 space-y-4">
            <div>
              <label className="block text-xs text-cream/50 mb-2">
                Upload CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="text-sm text-cream/70"
              />
            </div>

            {rows.length > 0 && (
              <div className="text-sm text-cream/70">
                {rows.length} rows loaded.{' '}
                <span className="text-cream/40">
                  Columns: {Object.keys(rows[0]).join(', ')}
                </span>
              </div>
            )}

            <div className="text-xs text-cream/30 space-y-1">
              <p>
                <strong className="text-cream/50">Columns:</strong> id (optional, for updates), title, slug,
                contentType, status, dek, authorName, bodyMd, primaryTags (pipe-delimited categories),
                tags (pipe-delimited), collectionSlugs (pipe-delimited), publishAt, metaTitle,
                metaDescription, canonicalUrl, ogImageUrl, geoScope, geoPlace, robotsNoIndex
              </p>
              <p>
                <strong className="text-cream/50">Tip:</strong> Include the <code className="text-cream/40">id</code> column
                to update existing articles. Leave <code className="text-cream/40">id</code> empty to create new ones.
                Export first to get all IDs.
              </p>
            </div>

            <Button
              onClick={handleValidate}
              disabled={rows.length === 0}
            >
              Validate
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Validation */}
      {step === 'validate' && (
        <div className="space-y-4">
          <div className="bg-basalt-50 rounded-card p-4 flex flex-wrap gap-4 text-sm">
            <span className="text-cream/50">
              Total: <strong className="text-cream">{summary.total}</strong>
            </span>
            <span className="text-green-400">
              Creates: <strong>{summary.creates}</strong>
            </span>
            <span className="text-blue-400">
              Updates: <strong>{summary.updates}</strong>
            </span>
            <span className="text-yellow-400">
              Warnings: <strong>{summary.warnings}</strong>
            </span>
            <span className="text-red-400">
              Errors: <strong>{summary.errors}</strong>
            </span>
          </div>

          <div className="bg-basalt-50 rounded-card overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream/10 text-cream/50">
                  <th className="text-left px-4 py-2 font-medium w-12">Row</th>
                  <th className="text-left px-4 py-2 font-medium">Title</th>
                  <th className="text-left px-4 py-2 font-medium w-20">Action</th>
                  <th className="text-left px-4 py-2 font-medium w-20">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Messages</th>
                </tr>
              </thead>
              <tbody>
                {validation.map((v) => (
                  <tr
                    key={v.row}
                    className="border-b border-cream/5"
                  >
                    <td className="px-4 py-2 text-cream/40">{v.row}</td>
                    <td className="px-4 py-2 text-cream/70">{v.title}</td>
                    <td className="px-4 py-2">{actionBadge(v.action)}</td>
                    <td className={`px-4 py-2 ${statusColor(v.status)}`}>
                      {v.status}
                    </td>
                    <td className="px-4 py-2 text-cream/40 text-xs">
                      {v.messages.join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep('upload')}
            >
              Back
            </Button>
            <Button
              onClick={() => setStep('confirm')}
              disabled={summary.errors > 0}
            >
              {summary.errors > 0
                ? 'Fix errors first'
                : 'Proceed to Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="bg-basalt-50 rounded-card p-6 space-y-4">
          <p className="text-cream/70 text-sm">
            Ready to process <strong className="text-cream">{summary.total}</strong> rows:
            {' '}<strong className="text-green-400">{summary.creates}</strong> creates,
            {' '}<strong className="text-blue-400">{summary.updates}</strong> updates.
            {summary.warnings > 0 && (
              <span className="text-yellow-400">
                {' '}({summary.warnings} warnings)
              </span>
            )}
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep('validate')}
            >
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Confirm Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'results' && (
        <div className="space-y-4">
          <div className="bg-basalt-50 rounded-card p-4 flex flex-wrap gap-4 text-sm">
            <span className="text-cream/50">
              Total: <strong className="text-cream">{summary.total}</strong>
            </span>
            <span className="text-green-400">
              Created: <strong>{summary.created}</strong>
            </span>
            <span className="text-blue-400">
              Updated: <strong>{summary.updated}</strong>
            </span>
            <span className="text-red-400">
              Errors: <strong>{summary.errors}</strong>
            </span>
          </div>

          <div className="bg-basalt-50 rounded-card overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream/10 text-cream/50">
                  <th className="text-left px-4 py-2 font-medium w-12">Row</th>
                  <th className="text-left px-4 py-2 font-medium">Title</th>
                  <th className="text-left px-4 py-2 font-medium w-20">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.row}
                    className="border-b border-cream/5"
                  >
                    <td className="px-4 py-2 text-cream/40">{r.row}</td>
                    <td className="px-4 py-2 text-cream/70">{r.title}</td>
                    <td className={`px-4 py-2 ${statusColor(r.status)}`}>
                      {r.status}
                    </td>
                    <td className="px-4 py-2 text-cream/40 text-xs">
                      {r.error || (r.id ? `ID: ${r.id}` : '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button onClick={() => window.location.reload()}>
            Import More
          </Button>
        </div>
      )}
    </div>
  )
}
