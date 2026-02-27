'use client'

import { useState, useEffect } from 'react'

const ROOM_TYPES = [
  'kitchen', 'bathroom', 'living_room', 'laundry_room', 'bedroom',
  'hallway', 'stairs', 'doors', 'windows', 'flooring', 'landscaping', 'other',
]

export function DefaultSelectionsEditor() {
  const [decisionsByRoom, setDecisionsByRoom] = useState<Record<string, string[]>>({})
  const [emojiMap, setEmojiMap] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'rooms' | 'emojis'>('rooms')
  const [activeRoom, setActiveRoom] = useState('kitchen')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEmojiTitle, setNewEmojiTitle] = useState('')
  const [newEmojiValue, setNewEmojiValue] = useState('')

  useEffect(() => {
    fetch('/api/admin/default-selections')
      .then((r) => r.json())
      .then((data) => {
        setDecisionsByRoom(data.decisionsByRoomType || {})
        setEmojiMap(data.emojiMap || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/admin/default-selections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decisionsByRoomType: decisionsByRoom, emojiMap }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function addDecisionTitle() {
    if (!newTitle.trim()) return
    setDecisionsByRoom((prev) => ({
      ...prev,
      [activeRoom]: [...(prev[activeRoom] || []), newTitle.trim()],
    }))
    setNewTitle('')
  }

  function removeDecisionTitle(idx: number) {
    setDecisionsByRoom((prev) => ({
      ...prev,
      [activeRoom]: (prev[activeRoom] || []).filter((_, i) => i !== idx),
    }))
  }

  function addEmoji() {
    if (!newEmojiTitle.trim() || !newEmojiValue.trim()) return
    setEmojiMap((prev) => ({ ...prev, [newEmojiTitle.trim().toLowerCase()]: newEmojiValue.trim() }))
    setNewEmojiTitle('')
    setNewEmojiValue('')
  }

  function removeEmoji(key: string) {
    setEmojiMap((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (loading) return <p className="text-cream/40 text-sm py-8">Loading...</p>

  return (
    <div className="max-w-3xl">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1 bg-cream/5 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              activeTab === 'rooms' ? 'bg-sandstone/20 text-sandstone font-medium' : 'text-cream/50 hover:text-cream/70'
            }`}
          >
            Room Defaults
          </button>
          <button
            onClick={() => setActiveTab('emojis')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              activeTab === 'emojis' ? 'bg-sandstone/20 text-sandstone font-medium' : 'text-cream/50 hover:text-cream/70'
            }`}
          >
            Emoji Map
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Room Defaults tab */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-[200px_1fr] gap-4">
          {/* Room type list */}
          <div className="space-y-1">
            {ROOM_TYPES.map((rt) => (
              <button
                key={rt}
                onClick={() => setActiveRoom(rt)}
                className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeRoom === rt
                    ? 'bg-sandstone/15 text-sandstone font-medium'
                    : 'text-cream/50 hover:text-cream hover:bg-cream/5'
                }`}
              >
                {rt.replace(/_/g, ' ')}
                <span className="text-[10px] text-cream/30 ml-1.5">
                  {(decisionsByRoom[activeRoom === rt ? rt : rt] || []).length}
                </span>
              </button>
            ))}
          </div>

          {/* Decision titles for selected room */}
          <div className="border border-cream/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-cream mb-3">
              Default decisions for {activeRoom.replace(/_/g, ' ')}
            </h3>
            <div className="space-y-1.5 mb-4">
              {(decisionsByRoom[activeRoom] || []).map((title, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <span className="text-sm text-cream/70 flex-1">{title}</span>
                  <span className="text-sm">{emojiMap[title.toLowerCase()] || '📋'}</span>
                  <button
                    onClick={() => removeDecisionTitle(idx)}
                    className="text-red-400/30 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(decisionsByRoom[activeRoom] || []).length === 0 && (
                <p className="text-xs text-cream/30">No defaults configured.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDecisionTitle()}
                placeholder="Add a decision title..."
                className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-1.5 text-xs text-cream focus:outline-none focus:border-sandstone/50 placeholder:text-cream/25"
              />
              <button
                onClick={addDecisionTitle}
                disabled={!newTitle.trim()}
                className="px-3 py-1.5 text-xs text-sandstone hover:text-sandstone-light disabled:text-cream/20 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Map tab */}
      {activeTab === 'emojis' && (
        <div>
          <div className="border border-cream/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-cream/5">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-cream/50">Decision Title</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-cream/50 w-20">Emoji</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(emojiMap)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, emoji]) => (
                    <tr key={key} className="border-t border-cream/5">
                      <td className="px-3 py-1.5 text-sm text-cream/60">{key}</td>
                      <td className="px-3 py-1.5 text-center text-lg">{emoji}</td>
                      <td className="px-3 py-1.5">
                        <button
                          onClick={() => removeEmoji(key)}
                          className="text-red-400/30 hover:text-red-400 text-xs transition-colors"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <input
              value={newEmojiTitle}
              onChange={(e) => setNewEmojiTitle(e.target.value)}
              placeholder="Title (lowercase)"
              className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-1.5 text-xs text-cream focus:outline-none focus:border-sandstone/50 placeholder:text-cream/25"
            />
            <input
              value={newEmojiValue}
              onChange={(e) => setNewEmojiValue(e.target.value)}
              placeholder="Emoji"
              className="w-20 bg-basalt border border-cream/15 rounded-lg px-3 py-1.5 text-xs text-cream text-center focus:outline-none focus:border-sandstone/50 placeholder:text-cream/25"
            />
            <button
              onClick={addEmoji}
              disabled={!newEmojiTitle.trim() || !newEmojiValue.trim()}
              className="px-3 py-1.5 text-xs text-sandstone hover:text-sandstone-light disabled:text-cream/20 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
