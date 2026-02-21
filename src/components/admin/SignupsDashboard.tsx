'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'

interface Signup {
  id: string
  email: string
  name: string | null
  source: 'FORM' | 'GOOGLE'
  userId: string | null
  ipAddress: string | null
  city: string | null
  region: string | null
  country: string | null
  isAllowed: boolean
  createdAt: string
}

interface SignupsData {
  signups: Signup[]
  total: number
  page: number
  totalPages: number
}

interface AllowlistRow {
  id: string
  email: string
  addedBy: string | null
  createdAt: string
}

interface AllowlistData {
  rows: AllowlistRow[]
  envEmails: string[]
}

export function SignupsDashboard() {
  const [data, setData] = useState<SignupsData | null>(null)
  const [page, setPage] = useState(1)
  const [allowlistData, setAllowlistData] = useState<AllowlistData | null>(null)
  const [addEmail, setAddEmail] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')

  const fetchSignups = useCallback(() => {
    fetch(`/api/admin/signups?page=${page}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
  }, [page])

  const fetchAllowlist = useCallback(() => {
    fetch('/api/admin/early-access-allowlist')
      .then((r) => r.json())
      .then((d) => setAllowlistData(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchSignups()
    fetchAllowlist()
  }, [fetchSignups, fetchAllowlist])

  async function handleRemove(id: string) {
    await fetch(`/api/admin/signups?id=${id}`, { method: 'DELETE' })
    fetchSignups()
  }

  async function handleAllow(email: string) {
    const res = await fetch('/api/admin/early-access-allowlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok || res.status === 409) {
      fetchSignups()
      fetchAllowlist()
    }
  }

  async function handleRevokeAllowlist(id: string) {
    await fetch(`/api/admin/early-access-allowlist?id=${id}`, { method: 'DELETE' })
    fetchSignups()
    fetchAllowlist()
  }

  async function handleManualAdd(e: FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddSuccess('')
    const email = addEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setAddError('Enter a valid email address.')
      return
    }

    const res = await fetch('/api/admin/early-access-allowlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setAddEmail('')
      setAddSuccess(`${email} added to allowlist.`)
      fetchSignups()
      fetchAllowlist()
      setTimeout(() => setAddSuccess(''), 3000)
    } else if (res.status === 409) {
      setAddError('Email is already on the allowlist.')
    } else {
      setAddError('Failed to add email.')
    }
  }

  function formatLocation(s: Signup) {
    const parts = [s.city, s.region, s.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  if (!data) {
    return <div className="text-cream/30 text-sm">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Manual add */}
      <div className="bg-basalt-50 rounded-card p-4">
        <h3 className="text-sm font-medium text-cream/70 mb-3">Add Email to Allowlist</h3>
        <form onSubmit={handleManualAdd} className="flex items-center gap-3">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => {
              setAddEmail(e.target.value)
              if (addError) setAddError('')
            }}
            placeholder="user@example.com"
            className="flex-1 bg-basalt-100 border border-cream/10 rounded-input px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
          />
          <button
            type="submit"
            disabled={!addEmail.trim()}
            className="px-4 py-2 text-sm bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded transition-colors disabled:opacity-30"
          >
            Add to Allowlist
          </button>
        </form>
        {addError && <p className="text-xs text-red-400 mt-2">{addError}</p>}
        {addSuccess && <p className="text-xs text-green-400 mt-2">{addSuccess}</p>}
      </div>

      {/* Signups table */}
      <div>
        <p className="text-sm text-cream/50 mb-3">{data.total} total signups</p>

        <div className="bg-basalt-50 rounded-card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/10 text-cream/50">
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium w-28">Name</th>
                <th className="text-center px-4 py-3 font-medium w-20">Source</th>
                <th className="text-left px-4 py-3 font-medium w-28">Location</th>
                <th className="text-left px-4 py-3 font-medium w-28">IP</th>
                <th className="text-left px-4 py-3 font-medium w-28">Signed Up</th>
                <th className="text-center px-4 py-3 font-medium w-24">Status</th>
                <th className="text-center px-4 py-3 font-medium w-20" />
              </tr>
            </thead>
            <tbody>
              {data.signups.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-cream/30"
                  >
                    No signups yet
                  </td>
                </tr>
              ) : (
                data.signups.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b border-cream/5 hover:bg-cream/5 transition-colors ${
                      s.isAllowed ? 'bg-green-900/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-cream font-medium">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-cream/60 text-xs">
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
                      {formatLocation(s) || <span className="text-cream/20">—</span>}
                    </td>
                    <td className="px-4 py-3 text-cream/30 text-xs font-mono">
                      {s.ipAddress || <span className="text-cream/20">—</span>}
                    </td>
                    <td className="px-4 py-3 text-cream/40 text-xs">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.isAllowed ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                          Allowed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAllow(s.email)}
                          className="text-xs font-medium px-2 py-0.5 rounded bg-sandstone/20 text-sandstone hover:bg-sandstone/30 transition-colors"
                        >
                          Allow
                        </button>
                      )}
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
          <div className="flex items-center justify-center gap-2 pt-3">
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

      {/* Current Allowlist */}
      {allowlistData && (
        <div>
          <h3 className="text-sm font-medium text-cream/70 mb-3">Current Allowlist</h3>
          <div className="bg-basalt-50 rounded-card overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream/10 text-cream/50">
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium w-32">Source</th>
                  <th className="text-left px-4 py-3 font-medium w-32">Added By</th>
                  <th className="text-left px-4 py-3 font-medium w-28">Added</th>
                  <th className="text-center px-4 py-3 font-medium w-20" />
                </tr>
              </thead>
              <tbody>
                {allowlistData.envEmails.map((email) => (
                  <tr
                    key={`env-${email}`}
                    className="border-b border-cream/5 bg-cream/[0.02]"
                  >
                    <td className="px-4 py-3 text-cream font-medium">{email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-cream/10 text-cream/50">
                        env
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cream/30 text-xs">—</td>
                    <td className="px-4 py-3 text-cream/30 text-xs">—</td>
                    <td className="px-4 py-3 text-center text-cream/20 text-xs">—</td>
                  </tr>
                ))}
                {allowlistData.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-cream/5 hover:bg-cream/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-cream font-medium">{row.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                        database
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cream/40 text-xs">
                      {row.addedBy || '—'}
                    </td>
                    <td className="px-4 py-3 text-cream/40 text-xs">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRevokeAllowlist(row.id)}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {allowlistData.envEmails.length === 0 && allowlistData.rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-cream/30">
                      No entries in allowlist
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
