'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ROOM_TYPE_OPTIONS = [
  'kitchen', 'bathroom', 'living_room', 'laundry_room', 'bedroom',
  'hallway', 'stairs', 'doors', 'windows', 'flooring', 'landscaping', 'other',
]

interface KitOption {
  name: string
  notes: string
}

interface KitDecision {
  title: string
  options: KitOption[]
}

interface PackData {
  id: string
  packId: string
  label: string
  description: string
  author: string
  status: string
  roomTypes: string[]
  decisions: KitDecision[]
  sortOrder: number
}

export function IdeaPackEditor({ packId }: { packId: string }) {
  const router = useRouter()
  const [pack, setPack] = useState<PackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/idea-packs/${packId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setPack(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [packId])

  async function handleSave() {
    if (!pack) return
    setSaving(true)
    setSaved(false)
    setError('')
    const res = await fetch(`/api/admin/idea-packs/${packId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packId: pack.packId,
        label: pack.label,
        description: pack.description,
        author: pack.author,
        status: pack.status,
        roomTypes: pack.roomTypes,
        decisions: pack.decisions,
        sortOrder: pack.sortOrder,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Save failed')
    }
  }

  async function handleDelete() {
    await fetch(`/api/admin/idea-packs/${packId}`, { method: 'DELETE' })
    router.push('/admin/idea-packs')
  }

  function handleExport() {
    if (!pack) return
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

  function updateField<K extends keyof PackData>(key: K, value: PackData[K]) {
    setPack((p) => p ? { ...p, [key]: value } : p)
  }

  function toggleRoomType(rt: string) {
    setPack((p) => {
      if (!p) return p
      const has = p.roomTypes.includes(rt)
      return { ...p, roomTypes: has ? p.roomTypes.filter((r) => r !== rt) : [...p.roomTypes, rt] }
    })
  }

  function addDecision() {
    setPack((p) => p ? { ...p, decisions: [...p.decisions, { title: '', options: [] }] } : p)
  }

  function removeDecision(idx: number) {
    setPack((p) => p ? { ...p, decisions: p.decisions.filter((_, i) => i !== idx) } : p)
  }

  function updateDecisionTitle(idx: number, title: string) {
    setPack((p) => {
      if (!p) return p
      const decisions = [...p.decisions]
      decisions[idx] = { ...decisions[idx], title }
      return { ...p, decisions }
    })
  }

  function addOption(dIdx: number) {
    setPack((p) => {
      if (!p) return p
      const decisions = [...p.decisions]
      decisions[dIdx] = {
        ...decisions[dIdx],
        options: [...decisions[dIdx].options, { name: '', notes: '' }],
      }
      return { ...p, decisions }
    })
  }

  function removeOption(dIdx: number, oIdx: number) {
    setPack((p) => {
      if (!p) return p
      const decisions = [...p.decisions]
      decisions[dIdx] = {
        ...decisions[dIdx],
        options: decisions[dIdx].options.filter((_, i) => i !== oIdx),
      }
      return { ...p, decisions }
    })
  }

  function updateOption(dIdx: number, oIdx: number, field: 'name' | 'notes', value: string) {
    setPack((p) => {
      if (!p) return p
      const decisions = [...p.decisions]
      const options = [...decisions[dIdx].options]
      options[oIdx] = { ...options[oIdx], [field]: value }
      decisions[dIdx] = { ...decisions[dIdx], options }
      return { ...p, decisions }
    })
  }

  if (loading) return <p className="text-cream/40 text-sm py-8">Loading...</p>
  if (!pack) return <p className="text-red-400 text-sm py-8">Pack not found.</p>

  const totalOptions = pack.decisions.reduce((s, d) => s + d.options.length, 0)

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/idea-packs" className="text-cream/40 hover:text-cream/60 text-sm transition-colors">
          &larr; All Packs
        </Link>
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream border border-cream/15 rounded-lg transition-colors">
          Export JSON
        </button>
        <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 text-xs text-red-400/60 hover:text-red-400 border border-red-400/15 rounded-lg transition-colors">
          Delete
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      {/* Metadata */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-cream/50 mb-1">Pack ID (slug)</label>
            <input
              value={pack.packId}
              onChange={(e) => updateField('packId', e.target.value)}
              className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Label</label>
            <input
              value={pack.label}
              onChange={(e) => updateField('label', e.target.value)}
              className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-cream/50 mb-1">Description</label>
          <textarea
            value={pack.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream resize-none focus:outline-none focus:border-sandstone/50"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-cream/50 mb-1">Author</label>
            <select
              value={pack.author}
              onChange={(e) => updateField('author', e.target.value)}
              className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
            >
              <option value="HHC">HHC</option>
              <option value="DESIGNER">Designer</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Status</label>
            <select
              value={pack.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Sort Order</label>
            <input
              type="number"
              value={pack.sortOrder}
              onChange={(e) => updateField('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-sandstone/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-cream/50 mb-2">Room Types</label>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPE_OPTIONS.map((rt) => (
              <button
                key={rt}
                onClick={() => toggleRoomType(rt)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  pack.roomTypes.includes(rt)
                    ? 'border-sandstone/40 bg-sandstone/10 text-sandstone'
                    : 'border-cream/10 text-cream/40 hover:border-cream/20'
                }`}
              >
                {rt.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-cream/40 mb-4">
        <span>{pack.decisions.length} decisions</span>
        <span>{totalOptions} total options</span>
      </div>

      {/* Decisions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-cream/70">Decisions &amp; Options</h2>
          <button
            onClick={addDecision}
            className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
          >
            + Add Decision
          </button>
        </div>

        {pack.decisions.map((decision, dIdx) => (
          <div key={dIdx} className="border border-cream/10 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-cream/5">
              <input
                value={decision.title}
                onChange={(e) => updateDecisionTitle(dIdx, e.target.value)}
                placeholder="Decision title (e.g., Countertop)"
                className="flex-1 bg-transparent text-sm text-cream font-medium focus:outline-none placeholder:text-cream/25"
              />
              <span className="text-[10px] text-cream/30">{decision.options.length} opt</span>
              <button
                onClick={() => removeDecision(dIdx)}
                className="text-red-400/40 hover:text-red-400 text-xs transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-3 space-y-2">
              {decision.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <input
                      value={opt.name}
                      onChange={(e) => updateOption(dIdx, oIdx, 'name', e.target.value)}
                      placeholder="Option name"
                      className="w-full bg-basalt border border-cream/10 rounded px-2 py-1.5 text-xs text-cream focus:outline-none focus:border-sandstone/30 placeholder:text-cream/20"
                    />
                    <textarea
                      value={opt.notes}
                      onChange={(e) => updateOption(dIdx, oIdx, 'notes', e.target.value)}
                      placeholder="Notes / specs"
                      rows={2}
                      className="w-full bg-basalt border border-cream/10 rounded px-2 py-1.5 text-xs text-cream resize-none focus:outline-none focus:border-sandstone/30 placeholder:text-cream/20"
                    />
                  </div>
                  <button
                    onClick={() => removeOption(dIdx, oIdx)}
                    className="text-red-400/30 hover:text-red-400 text-xs mt-1.5 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <button
                onClick={() => addOption(dIdx)}
                className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
              >
                + Add Option
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDelete(false)}>
          <div className="bg-basalt-50 rounded-xl border border-cream/15 p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-cream mb-2">Delete this pack?</h3>
            <p className="text-xs text-cream/50 mb-4">
              &quot;{pack.label}&quot; will be permanently deleted. Rooms that already imported this pack will not be affected.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
