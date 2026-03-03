'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_PATHS } from '@/lib/tool-registry'

interface CollectionItem {
  id: string
  title: string
}

interface InstanceSwitcherProps {
  toolKey: string
  currentCollectionId: string
  itemNoun: string // "list" | "board"
}

export function InstanceSwitcher({ toolKey, currentCollectionId, itemNoun }: InstanceSwitcherProps) {
  const { currentProject } = useProject()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const toolPath = TOOL_PATHS[toolKey] ?? `/app/tools/${toolKey}`

  // Fetch collections on mount
  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/collections?projectId=${currentProject!.id}&toolKey=${toolKey}`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) {
          setCollections(
            (data.collections ?? []).map((c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
            }))
          )
        }
      } catch {
        // ignore
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentProject?.id, toolKey])

  // Click-away close
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setNewTitle('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Don't render if only 1 collection (no switching needed)
  if (collections.length <= 1) return null

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
      setOpen(false)
      setCreating(false)
      setNewTitle('')
      router.push(`${toolPath}/${data.collection.id}`)
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/60 transition-colors p-1 -ml-1"
        aria-label="Switch instance"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {collections.map((coll) => (
              <button
                key={coll.id}
                type="button"
                onClick={() => {
                  setOpen(false)
                  if (coll.id !== currentCollectionId) {
                    router.push(`${toolPath}/${coll.id}`)
                  }
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  coll.id === currentCollectionId
                    ? 'text-sandstone bg-sandstone/10'
                    : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
                }`}
              >
                {coll.id === currentCollectionId && (
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span className={`truncate ${coll.id === currentCollectionId ? '' : 'ml-5.5'}`}>
                  {coll.title}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-cream/10">
            {creating ? (
              <div className="p-2 flex items-center gap-2">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
                  }}
                  placeholder={`${itemNoun} name...`}
                  className="flex-1 bg-basalt border border-cream/20 rounded px-2 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newTitle.trim()}
                  className="text-xs font-medium text-basalt bg-sandstone rounded px-2.5 py-1.5 hover:bg-sandstone-light transition-colors disabled:opacity-40 shrink-0"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full text-left px-3 py-2.5 text-sm text-sandstone/70 hover:text-sandstone hover:bg-cream/5 transition-colors flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14m-7-7h14" strokeLinecap="round" />
                </svg>
                New {itemNoun}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
