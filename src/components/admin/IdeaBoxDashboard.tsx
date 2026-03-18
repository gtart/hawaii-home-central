'use client'

import { useState, useEffect, useCallback } from 'react'

interface FeedbackItem {
  id: string
  message: string
  email: string | null
  ipAddress: string | null
  userAgent: string | null
  language: string | null
  referrer: string | null
  pageUrl: string | null
  screenSize: string | null
  timezone: string | null
  platform: string | null
  city: string | null
  region: string | null
  country: string | null
  latitude: string | null
  longitude: string | null
  submittedAt: string
  createdAt: string
}

export function IdeaBoxDashboard() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/idea-box?page=${p}`)
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPage(1) }, [fetchPage])

  async function handleDelete(id: string) {
    if (!confirm('Delete this submission?')) return
    await fetch(`/api/admin/idea-box?id=${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setTotal((prev) => prev - 1)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  function locationString(item: FeedbackItem) {
    return [item.city, item.region, item.country].filter(Boolean).join(', ') || '—'
  }

  const pageSize = 30
  const totalPages = Math.ceil(total / pageSize)

  if (loading && items.length === 0) {
    return <p className="text-cream/50 text-sm">Loading...</p>
  }

  if (items.length === 0) {
    return <p className="text-cream/50 text-sm">No submissions yet.</p>
  }

  return (
    <div>
      <p className="text-xs text-cream/40 mb-4">{total} total submission{total !== 1 ? 's' : ''}</p>

      <div className="space-y-3">
        {items.map((item) => {
          const expanded = expandedId === item.id
          return (
            <div
              key={item.id}
              className="border border-cream/10 rounded-lg bg-basalt-50 overflow-hidden"
            >
              {/* Summary row */}
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : item.id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-cream/3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cream/80 line-clamp-2">{item.message}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-cream/40">
                    <span>{formatDate(item.createdAt)}</span>
                    {item.email && <span className="text-sandstone/60">{item.email}</span>}
                    <span>{locationString(item)}</span>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-cream/30 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="border-t border-cream/8 px-4 py-3 space-y-3">
                  {/* Full message */}
                  <div>
                    <label className="text-[10px] text-cream/40 uppercase tracking-wider">Message</label>
                    <p className="text-sm text-cream/80 whitespace-pre-wrap mt-0.5">{item.message}</p>
                  </div>

                  {/* Context grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-[11px]">
                    <Detail label="Email" value={item.email} />
                    <Detail label="IP Address" value={item.ipAddress} />
                    <Detail label="Location" value={locationString(item)} />
                    <Detail label="Lat/Lon" value={item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : null} />
                    <Detail label="Timezone" value={item.timezone} />
                    <Detail label="Platform" value={item.platform} />
                    <Detail label="Screen" value={item.screenSize} />
                    <Detail label="Language" value={item.language} />
                    <Detail label="Page URL" value={item.pageUrl} />
                    <Detail label="Referrer" value={item.referrer} />
                    <Detail label="Submitted At" value={item.submittedAt ? formatDate(item.submittedAt) : null} />
                    <Detail label="Received At" value={formatDate(item.createdAt)} />
                  </div>

                  {/* User Agent (full width) */}
                  {item.userAgent && (
                    <div>
                      <label className="text-[10px] text-cream/40 uppercase tracking-wider">User Agent</label>
                      <p className="text-[11px] text-cream/50 break-all mt-0.5">{item.userAgent}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => fetchPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream bg-cream/5 hover:bg-cream/10 rounded disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-cream/40">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => fetchPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream bg-cream/5 hover:bg-cream/10 rounded disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <span className="text-cream/40">{label}:</span>{' '}
      <span className="text-cream/65">{value}</span>
    </div>
  )
}
