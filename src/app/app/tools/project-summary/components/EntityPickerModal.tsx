'use client'

import { useState, useEffect, useRef } from 'react'
import type { SummaryLinkType } from '@/data/project-summary'

interface Entity {
  id: string
  label: string
  status?: string
  collectionId: string
  collectionTitle: string
}

interface EntityPickerModalProps {
  toolKey: 'finish_decisions' | 'punchlist'
  linkType: SummaryLinkType
  projectId: string
  onSelect: (entity: Entity) => void
  onClose: () => void
}

export function EntityPickerModal({ toolKey, linkType, projectId, onSelect, onClose }: EntityPickerModalProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/tools/entities?projectId=${projectId}&toolKey=${toolKey}`)
        if (!res.ok) return
        const data = await res.json()
        setEntities(data.entities || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toolKey, projectId])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = search.trim()
    ? entities.filter((e) =>
        e.label.toLowerCase().includes(search.toLowerCase()) ||
        e.collectionTitle.toLowerCase().includes(search.toLowerCase())
      )
    : entities

  // Group by collection when there are multiple collections
  const collectionIds = new Set(filtered.map((e) => e.collectionId))
  const hasMultipleCollections = collectionIds.size > 1

  const title = linkType === 'selection' ? 'Link Selection' : 'Link Fix Item'

  const content = (
    <div className="flex flex-col h-full max-h-[70vh] md:max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream/[0.06]">
        <h3 className="text-sm font-semibold text-cream/80">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-cream/30 hover:text-cream/60 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-cream/[0.04]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-sm text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30"
          autoFocus
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-xs text-cream/20 italic py-4 text-center">
            {search ? 'No matches found.' : 'No items found.'}
          </p>
        )}

        {!loading && filtered.map((entity) => (
          <button
            key={`${entity.collectionId}-${entity.id}`}
            type="button"
            onClick={() => onSelect(entity)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left rounded-lg hover:bg-cream/5 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm text-cream/70 block truncate group-hover:text-cream/90">{entity.label}</span>
              {hasMultipleCollections && (
                <span className="text-[10px] text-cream/20 block truncate">{entity.collectionTitle}</span>
              )}
            </div>
            {entity.status && (
              <span className="text-[10px] text-cream/25 shrink-0">{entity.status}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center pointer-events-none">
        <div className="w-full max-w-md bg-[#1a1a1a] border border-cream/[0.08] rounded-xl shadow-2xl pointer-events-auto">
          {content}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-[#1a1a1a] border-t border-cream/[0.08] rounded-t-2xl shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream/15" />
        </div>
        {content}
      </div>
    </>
  )
}
