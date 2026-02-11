'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AggregatedFeedback {
  content: { id: string; title: string; slug: string; contentType: string }
  up: number
  down: number
}

interface PrivateFeedbackItem {
  id: string
  message: string
  name: string | null
  email: string | null
  voteContext: string | null
  createdAt: string
  content: { id: string; title: string; slug: string }
}

interface FeedbackData {
  aggregated: AggregatedFeedback[]
  privateFeedback: PrivateFeedbackItem[]
  totalPrivate: number
  page: number
  totalPages: number
}

export function FeedbackDashboard() {
  const [data, setData] = useState<FeedbackData | null>(null)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<'thumbs' | 'private'>('thumbs')

  useEffect(() => {
    fetch(`/api/admin/feedback?page=${page}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [page])

  if (!data) {
    return <div className="text-cream/30 text-sm">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('thumbs')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'thumbs'
              ? 'bg-sandstone text-basalt'
              : 'bg-basalt-50 text-cream/50 hover:text-cream'
          }`}
        >
          Thumbs ({data.aggregated.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('private')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'private'
              ? 'bg-sandstone text-basalt'
              : 'bg-basalt-50 text-cream/50 hover:text-cream'
          }`}
        >
          Messages ({data.totalPrivate})
        </button>
      </div>

      {tab === 'thumbs' && (
        <div className="bg-basalt-50 rounded-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/10 text-cream/50">
                <th className="text-left px-4 py-3 font-medium">Content</th>
                <th className="text-left px-4 py-3 font-medium w-16">Type</th>
                <th className="text-center px-4 py-3 font-medium w-16">Up</th>
                <th className="text-center px-4 py-3 font-medium w-16">Down</th>
                <th className="text-center px-4 py-3 font-medium w-20">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.aggregated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-cream/30"
                  >
                    No feedback yet
                  </td>
                </tr>
              ) : (
                data.aggregated.map((item) => (
                  <tr
                    key={item.content.id}
                    className="border-b border-cream/5 hover:bg-cream/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/content/${item.content.id}`}
                        className="text-cream hover:text-sandstone transition-colors font-medium"
                      >
                        {item.content.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-cream/40 text-xs">
                      {item.content.contentType}
                    </td>
                    <td className="px-4 py-3 text-center text-green-400">
                      {item.up}
                    </td>
                    <td className="px-4 py-3 text-center text-red-400">
                      {item.down}
                    </td>
                    <td className="px-4 py-3 text-center text-cream/70">
                      {item.up - item.down}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'private' && (
        <div className="space-y-3">
          {data.privateFeedback.length === 0 ? (
            <div className="bg-basalt-50 rounded-card p-8 text-center text-cream/30">
              No private feedback yet
            </div>
          ) : (
            data.privateFeedback.map((fb) => (
              <div
                key={fb.id}
                className="bg-basalt-50 rounded-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/admin/content/${fb.content.id}`}
                    className="text-sm text-sandstone hover:text-sandstone-light font-medium"
                  >
                    {fb.content.title}
                  </Link>
                  <span className="text-xs text-cream/30">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-cream/70">{fb.message}</p>
                {(fb.name || fb.email) && (
                  <p className="text-xs text-cream/40">
                    {fb.name && <span>{fb.name}</span>}
                    {fb.name && fb.email && <span> &middot; </span>}
                    {fb.email && <span>{fb.email}</span>}
                  </p>
                )}
              </div>
            ))
          )}

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm bg-basalt-50 rounded text-cream/50 hover:text-cream disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-sm text-cream/40">
                {page} / {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(data.totalPages, p + 1))
                }
                disabled={page === data.totalPages}
                className="px-3 py-1 text-sm bg-basalt-50 rounded text-cream/50 hover:text-cream disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
