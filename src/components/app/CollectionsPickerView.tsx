'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_LABELS, TOOL_PATHS } from '@/lib/tool-registry'

interface CollectionSummary {
  id: string
  title: string
  toolKey: string
  createdAt: string
  updatedAt: string
  members: Array<{
    userId: string
    role: string
    user: { name: string | null; image: string | null }
  }>
}

interface CollectionsPickerViewProps {
  toolKey: string
  /** Noun for empty state, e.g. "decision list", "fix list", "board" */
  itemNoun: string
}

export function CollectionsPickerView({ toolKey, itemNoun }: CollectionsPickerViewProps) {
  const { currentProject } = useProject()
  const router = useRouter()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const toolLabel = TOOL_LABELS[toolKey] ?? toolKey
  const toolPath = TOOL_PATHS[toolKey] ?? `/app/tools/${toolKey}`

  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/collections?projectId=${currentProject!.id}&toolKey=${toolKey}`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setCollections(data.collections ?? [])
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentProject?.id, toolKey])

  // Auto-redirect when exactly 1 collection
  useEffect(() => {
    if (!loading && collections.length === 1) {
      router.replace(`${toolPath}/${collections[0].id}`)
    }
  }, [loading, collections, toolPath, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
      </div>
    )
  }

  // Show loading while auto-redirecting
  if (collections.length === 1) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
      </div>
    )
  }

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title || !currentProject?.id) return

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id, toolKey, title }),
      })
      if (!res.ok) return
      const data = await res.json()
      // Navigate to new collection
      router.push(`${toolPath}/${data.collection.id}`)
    } catch {
      // ignore
    }
  }

  const handleRename = async (collId: string) => {
    const title = editTitle.trim()
    if (!title) return

    try {
      await fetch(`/api/collections/${collId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      setCollections((prev) =>
        prev.map((c) => (c.id === collId ? { ...c, title } : c))
      )
    } catch {
      // ignore
    } finally {
      setEditingId(null)
      setEditTitle('')
    }
  }

  const handleArchive = async (collId: string) => {
    try {
      await fetch(`/api/collections/${collId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: true }),
      })
      setCollections((prev) => prev.filter((c) => c.id !== collId))
    } catch {
      // ignore
    }
  }

  // Empty state
  if (collections.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="font-serif text-2xl text-cream mb-2">{toolLabel}</h2>
        <p className="text-cream/50 text-sm mb-6">
          Create your first {itemNoun} to get started.
        </p>
        <div className="max-w-xs mx-auto">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            placeholder={`${itemNoun.charAt(0).toUpperCase() + itemNoun.slice(1)} name...`}
            className="w-full bg-basalt border border-cream/20 rounded px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 mb-3"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="w-full text-sm font-medium text-basalt bg-sandstone rounded px-4 py-2 hover:bg-sandstone-light transition-colors disabled:opacity-40"
          >
            Create {itemNoun}
          </button>
        </div>
      </div>
    )
  }

  // Multi-collection picker
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl text-cream">{toolLabel}</h2>
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 text-sm text-sandstone hover:text-sandstone-light transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
            </svg>
            New {itemNoun}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
              }}
              placeholder={`${itemNoun} name...`}
              className="bg-basalt border border-cream/20 rounded px-2.5 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="text-xs font-medium text-basalt bg-sandstone rounded px-3 py-1.5 hover:bg-sandstone-light transition-colors disabled:opacity-40"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setNewTitle('') }}
              className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((coll) => (
          <div
            key={coll.id}
            className="group relative bg-basalt-50 border border-cream/10 rounded-lg p-4 hover:border-sandstone/30 transition-colors cursor-pointer"
            onClick={() => router.push(`${toolPath}/${coll.id}`)}
          >
            {editingId === coll.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(coll.id)
                  if (e.key === 'Escape') { setEditingId(null); setEditTitle('') }
                }}
                onBlur={() => handleRename(coll.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-basalt border border-cream/20 rounded px-2 py-1 text-sm text-cream focus:outline-none focus:border-sandstone/50"
              />
            ) : (
              <h3 className="font-medium text-cream truncate">{coll.title}</h3>
            )}

            <p className="text-xs text-cream/40 mt-1">
              Updated {new Date(coll.updatedAt).toLocaleDateString()}
            </p>

            {coll.members.length > 0 && (
              <div className="flex -space-x-1 mt-3">
                {coll.members.slice(0, 4).map((m) => (
                  <div
                    key={m.userId}
                    className="w-6 h-6 rounded-full bg-sandstone/20 border border-basalt flex items-center justify-center text-[10px] text-cream/60"
                    title={m.user.name || 'Collaborator'}
                  >
                    {m.user.image ? (
                      <img src={m.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (m.user.name || '?')[0]?.toUpperCase()
                    )}
                  </div>
                ))}
                {coll.members.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-cream/10 border border-basalt flex items-center justify-center text-[10px] text-cream/40">
                    +{coll.members.length - 4}
                  </div>
                )}
              </div>
            )}

            {/* 3-dot menu */}
            <div
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (editingId === coll.id) {
                    setEditingId(null)
                  } else {
                    setEditingId(coll.id)
                    setEditTitle(coll.title)
                  }
                }}
                className="p-1 text-cream/30 hover:text-cream/60 transition-colors"
                title="Rename"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Archive "${coll.title}"?`)) handleArchive(coll.id)
                }}
                className="p-1 text-cream/30 hover:text-red-400/60 transition-colors ml-1"
                title="Archive"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="5" rx="1" />
                  <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
