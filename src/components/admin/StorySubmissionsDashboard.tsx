'use client'

import { useState, useEffect, useCallback } from 'react'

interface StorySubmission {
  id: string
  email: string | null
  summary: string
  challenge: string | null
  proudestMoment: string | null
  ipAddress: string | null
  city: string | null
  region: string | null
  country: string | null
  createdAt: string
}

function formatLocation(s: StorySubmission): string {
  const parts = [s.city, s.region, s.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function StorySubmissionsDashboard() {
  const [submissions, setSubmissions] = useState<StorySubmission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/story-submissions?page=${page}`)
      if (!res.ok) return
      const data = await res.json()
      setSubmissions(data.submissions)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this submission?')) return
    const res = await fetch(`/api/admin/story-submissions?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchSubmissions()
  }

  if (loading) {
    return <p className="text-cream/30 text-sm">Loading submissions...</p>
  }

  if (submissions.length === 0 && page === 1) {
    return <p className="text-cream/30 text-sm">No story submissions yet.</p>
  }

  return (
    <div>
      <p className="text-cream/40 text-xs mb-4">{total} submission{total !== 1 ? 's' : ''} total</p>

      <div className="space-y-3">
        {submissions.map((s) => {
          const isExpanded = expanded === s.id
          return (
            <div key={s.id} className="bg-basalt-50 rounded-card p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="text-xs text-cream/30">{formatDate(s.createdAt)}</span>
                    {s.email && (
                      <a href={`mailto:${s.email}`} className="text-xs text-sandstone hover:text-sandstone-light transition-colors">
                        {s.email}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-cream/40 mb-2">
                    <span title="Location">{formatLocation(s)}</span>
                    {s.ipAddress && (
                      <>
                        <span className="text-cream/15">|</span>
                        <span className="font-mono text-cream/30" title="IP Address">{s.ipAddress}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                    className="text-xs text-cream/40 hover:text-cream/70 transition-colors px-2 py-1"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Summary (always visible, truncated unless expanded) */}
              <div className="mb-2">
                <p className="text-xs uppercase tracking-wide text-cream/30 mb-1">Summary</p>
                <p className={`text-sm text-cream/70 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
                  {s.summary}
                </p>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <>
                  {s.challenge && (
                    <div className="mb-2 pt-2 border-t border-cream/5">
                      <p className="text-xs uppercase tracking-wide text-cream/30 mb-1">Biggest Challenge</p>
                      <p className="text-sm text-cream/60 whitespace-pre-wrap">{s.challenge}</p>
                    </div>
                  )}
                  {s.proudestMoment && (
                    <div className="mb-2 pt-2 border-t border-cream/5">
                      <p className="text-xs uppercase tracking-wide text-cream/30 mb-1">Proudest Moment</p>
                      <p className="text-sm text-cream/60 whitespace-pre-wrap">{s.proudestMoment}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm text-cream/50 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-xs text-cream/30">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-sm text-cream/50 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
