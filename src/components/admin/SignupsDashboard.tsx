'use client'

import { useState, useEffect, useCallback } from 'react'

interface Signup {
  id: string
  email: string
  name: string | null
  source: 'FORM' | 'GOOGLE'
  userId: string | null
  createdAt: string
}

interface SignupsData {
  signups: Signup[]
  total: number
  page: number
  totalPages: number
}

export function SignupsDashboard() {
  const [data, setData] = useState<SignupsData | null>(null)
  const [page, setPage] = useState(1)

  const fetchSignups = useCallback(() => {
    fetch(`/api/admin/signups?page=${page}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [page])

  useEffect(() => {
    fetchSignups()
  }, [fetchSignups])

  async function handleRemove(id: string) {
    await fetch(`/api/admin/signups?id=${id}`, { method: 'DELETE' })
    fetchSignups()
  }

  if (!data) {
    return <div className="text-cream/30 text-sm">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-cream/50">{data.total} total signups</p>

      <div className="bg-basalt-50 rounded-card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/10 text-cream/50">
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium w-40">Name</th>
              <th className="text-center px-4 py-3 font-medium w-24">Source</th>
              <th className="text-left px-4 py-3 font-medium w-32">Signed Up</th>
              <th className="text-center px-4 py-3 font-medium w-20" />
            </tr>
          </thead>
          <tbody>
            {data.signups.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-cream/30"
                >
                  No signups yet
                </td>
              </tr>
            ) : (
              data.signups.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-cream/5 hover:bg-cream/5 transition-colors"
                >
                  <td className="px-4 py-3 text-cream font-medium">
                    {s.email}
                  </td>
                  <td className="px-4 py-3 text-cream/60">
                    {s.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                        s.source === 'GOOGLE'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-cream/10 text-cream/50'
                      }`}
                    >
                      {s.source === 'GOOGLE' ? 'Google' : 'Form'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cream/40 text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(s.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
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
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-1 text-sm bg-basalt-50 rounded text-cream/50 hover:text-cream disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
