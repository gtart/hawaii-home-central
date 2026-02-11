'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export function SettingsEditor() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        setMessage('Saved')
      } else {
        setMessage('Error saving settings')
      }
    } catch {
      setMessage('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdd = () => {
    const key = newKey.trim()
    if (!key) return
    setSettings((prev) => ({ ...prev, [key]: newValue }))
    setNewKey('')
    setNewValue('')
  }

  const handleDelete = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-cream/40 text-sm">
        <div className="w-4 h-4 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        Loading...
      </div>
    )
  }

  const keys = Object.keys(settings).sort()

  return (
    <div className="space-y-6">
      <div className="bg-basalt-50 rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/10">
              <th className="text-left px-4 py-3 text-cream/50 font-medium">
                Key
              </th>
              <th className="text-left px-4 py-3 text-cream/50 font-medium">
                Value
              </th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key} className="border-b border-cream/5">
                <td className="px-4 py-2 font-mono text-xs text-cream/70">
                  {key}
                </td>
                <td className="px-4 py-2">
                  <textarea
                    value={settings[key]}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full bg-basalt border border-cream/10 rounded px-2 py-1 text-cream text-sm resize-y min-h-[2rem] focus:border-sandstone focus:outline-none"
                    rows={1}
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleDelete(key)}
                    className="text-cream/30 hover:text-red-400 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new setting */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-cream/50 mb-1">Key</label>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="setting_key"
            className="w-full bg-basalt-50 border border-cream/10 rounded px-3 py-2 text-cream text-sm focus:border-sandstone focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-cream/50 mb-1">Value</label>
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="w-full bg-basalt-50 border border-cream/10 rounded px-3 py-2 text-cream text-sm focus:border-sandstone focus:outline-none"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save All'}
        </Button>
        {message && (
          <span className="text-sm text-cream/50">{message}</span>
        )}
      </div>
    </div>
  )
}
