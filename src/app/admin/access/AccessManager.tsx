'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface AllowlistRow {
  id: string
  email: string
  role: 'ADMIN' | 'EDITOR'
  createdAt: string
}

export function AccessManager() {
  const [rows, setRows] = useState<AllowlistRow[]>([])
  const [envEmails, setEnvEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'EDITOR'>('EDITOR')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/access')
    if (res.ok) {
      const data = await res.json()
      setRows(data.rows)
      setEnvEmails(data.envEmails)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const res = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to add')
    } else {
      setEmail('')
      setRole('EDITOR')
      await fetchData()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/access?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id))
    }
  }

  async function handleRoleChange(id: string, newRole: 'ADMIN' | 'EDITOR') {
    const res = await fetch('/api/admin/access', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole }),
    })
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, role: newRole } : r))
      )
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-serif text-2xl text-sandstone mb-6">Access</h1>
        <div className="h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl text-sandstone mb-2">Access</h1>
      <p className="text-cream/50 text-sm mb-8">
        Manage who can access the admin panel. Admins have full access; Editors can manage content only.
      </p>

      {/* Env-based admins */}
      {envEmails.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-3">
            Environment Allowlist
          </h2>
          <p className="text-cream/40 text-xs mb-3">
            Set via ADMIN_ALLOWLIST env var. These cannot be removed from the UI.
          </p>
          <div className="space-y-2">
            {envEmails.map((e) => (
              <div
                key={e}
                className="flex items-center justify-between bg-basalt-50 rounded-lg px-4 py-3"
              >
                <span className="text-cream/70 text-sm">{e}</span>
                <span className="text-xs text-sandstone/60 font-medium uppercase">Admin (env)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DB-based admins */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-3">
          Database Allowlist
        </h2>
        {rows.length === 0 ? (
          <p className="text-cream/40 text-sm">No database entries yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 bg-basalt-50 rounded-lg px-4 py-3"
              >
                <span className="text-cream/70 text-sm flex-1">{row.email}</span>
                <select
                  value={row.role}
                  onChange={(e) =>
                    handleRoleChange(row.id, e.target.value as 'ADMIN' | 'EDITOR')
                  }
                  className="bg-basalt border border-cream/10 text-cream/70 text-xs rounded px-2 py-1 cursor-pointer"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-red-400/60 hover:text-red-400 text-xs transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      <div className="bg-basalt-50 rounded-card p-5">
        <h2 className="text-sm font-medium text-cream/70 mb-4">Add to Allowlist</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-cream/40 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-basalt border border-cream/10 text-cream text-sm rounded-lg px-3 py-2 placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
            />
          </div>
          <div>
            <label className="text-xs text-cream/40 block mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'EDITOR')}
              className="bg-basalt border border-cream/10 text-cream/70 text-sm rounded-lg px-3 py-2 cursor-pointer"
            >
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Adding...' : 'Add'}
          </Button>
        </form>
        {error && (
          <p className="text-red-400 text-xs mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
