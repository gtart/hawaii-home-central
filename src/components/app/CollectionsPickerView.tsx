'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { TOOL_LABELS, TOOL_PATHS } from '@/lib/tool-registry'
import { ShareToolModal } from '@/components/app/ShareToolModal'

interface CollectionSummary {
  id: string
  title: string
  toolKey: string
  createdAt: string
  updatedAt: string
  updatedBy?: { name: string | null } | null
  members: Array<{
    userId: string
    role: string
    user: { name: string | null; image: string | null }
  }>
}

interface PreviewData {
  imageUrls: string[]
  ideaCount: number
  commentCount: number
  statuses?: Record<string, number>
  lastComment?: { text: string; authorName: string; decisionTitle: string; createdAt: string }
  decisionCount?: number
}

interface CollectionsPickerViewProps {
  toolKey: string
  /** Noun for empty state, e.g. "Selection List", "fix list", "mood board" */
  itemNoun: string
  /** When set, fetch preview data for cards ('thumbnails' for images, 'statuses' for status counts) */
  previewMode?: 'thumbnails' | 'statuses'
  /** Custom empty state rendered instead of the default input when there are zero collections */
  customEmptyState?: (onCreate: (title: string) => void) => React.ReactNode
}

function ThumbnailGrid({ imageUrls }: { imageUrls: string[] }) {
  const count = Math.min(imageUrls.length, 4)
  const proxy = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`

  if (count === 0) {
    return (
      <div className="aspect-[16/9] bg-basalt flex items-center justify-center text-cream/20">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  if (count === 1) {
    return (
      <div className="aspect-[16/9] bg-basalt overflow-hidden">
        <img src={proxy(imageUrls[0])} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="aspect-[16/9] bg-basalt overflow-hidden grid grid-cols-2 gap-0.5">
        {imageUrls.slice(0, 2).map((url, i) => (
          <img key={i} src={proxy(url)} alt="" className="w-full h-full object-cover" loading="lazy" />
        ))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="aspect-[16/9] bg-basalt overflow-hidden grid grid-cols-3 grid-rows-2 gap-0.5">
        <img src={proxy(imageUrls[0])} alt="" className="col-span-2 row-span-2 w-full h-full object-cover" loading="lazy" />
        <img src={proxy(imageUrls[1])} alt="" className="w-full h-full object-cover" loading="lazy" />
        <img src={proxy(imageUrls[2])} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
    )
  }

  return (
    <div className="aspect-[16/9] bg-basalt overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5">
      {imageUrls.slice(0, 4).map((url, i) => (
        <img key={i} src={proxy(url)} alt="" className="w-full h-full object-cover" loading="lazy" />
      ))}
    </div>
  )
}

export function CollectionsPickerView({ toolKey, itemNoun, previewMode, customEmptyState }: CollectionsPickerViewProps) {
  const { currentProject } = useProject()
  const router = useRouter()
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [archivedCollections, setArchivedCollections] = useState<CollectionSummary[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [shareTarget, setShareTarget] = useState<{ collectionId: string; collectionName: string } | null>(null)
  const [previews, setPreviews] = useState<Record<string, PreviewData>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  const toolLabel = TOOL_LABELS[toolKey] ?? toolKey
  const toolPath = TOOL_PATHS[toolKey] ?? `/app/tools/${toolKey}`

  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/collections?projectId=${currentProject!.id}&toolKey=${toolKey}&includeArchived=true`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) {
          setCollections(data.collections ?? [])
          setArchivedCollections(data.archived ?? [])
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [currentProject?.id, toolKey])

  // Fetch preview data when previewMode is set
  useEffect(() => {
    if (!previewMode || !currentProject?.id || loading || collections.length === 0) return
    let cancelled = false

    async function loadPreviews() {
      try {
        const res = await fetch(`/api/collections/previews?projectId=${currentProject!.id}&toolKey=${toolKey}`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) {
          const map: Record<string, PreviewData> = {}
          for (const p of data.previews ?? []) {
            map[p.collectionId] = {
              imageUrls: p.imageUrls ?? [],
              ideaCount: p.ideaCount ?? 0,
              commentCount: p.commentCount ?? 0,
              statuses: p.statuses ?? undefined,
              lastComment: p.lastComment ?? undefined,
              decisionCount: p.decisionCount ?? undefined,
            }
          }
          setPreviews(map)
        }
      } catch {
        // ignore
      }
    }

    loadPreviews()
    return () => { cancelled = true }
  }, [previewMode, currentProject?.id, toolKey, loading, collections.length])

  // Click-away close for menu
  useEffect(() => {
    if (!menuOpenId) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
      </div>
    )
  }

  const createBoard = async (title: string) => {
    if (!title.trim() || !currentProject?.id) return
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject.id, toolKey, title: title.trim() }),
      })
      if (!res.ok) return
      const data = await res.json()
      router.push(`${toolPath}/${data.collection.id}`)
    } catch {
      // ignore
    }
  }

  const handleCreate = () => createBoard(newTitle)

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
      const archived = collections.find((c) => c.id === collId)
      setCollections((prev) => prev.filter((c) => c.id !== collId))
      if (archived) {
        setArchivedCollections((prev) => [archived, ...prev])
      }
    } catch {
      // ignore
    }
  }

  const handleRestore = async (collId: string) => {
    try {
      await fetch(`/api/collections/${collId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: null }),
      })
      const restored = archivedCollections.find((c) => c.id === collId)
      setArchivedCollections((prev) => prev.filter((c) => c.id !== collId))
      if (restored) {
        setCollections((prev) => [...prev, restored])
      }
    } catch {
      // ignore
    }
  }

  const breadcrumb = (
    <nav className="flex items-center gap-1.5 text-xs mb-4">
      <a href="/app" className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/60 transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Tools
      </a>
      <span className="text-cream/20">/</span>
      <span className="text-cream/60">{toolLabel}</span>
    </nav>
  )

  // Empty state
  if (collections.length === 0) {
    if (customEmptyState) {
      return (
        <div className="py-12">
          <div className="text-left mb-6">{breadcrumb}</div>
          {customEmptyState(createBoard)}
        </div>
      )
    }
    return (
      <div className="text-center py-24">
        <div className="text-left">{breadcrumb}</div>
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
      {breadcrumb}
      <div className="flex items-center justify-between mb-6 gap-3">
        <h2 className="font-serif text-2xl text-cream">{toolLabel}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((coll) => {
          const preview = previews[coll.id] ?? { imageUrls: [], ideaCount: 0, commentCount: 0 }
          const hasThumbnails = previewMode === 'thumbnails' || preview.imageUrls.length > 0
          const hasStatusCounts = preview.statuses && Object.values(preview.statuses).some(v => v > 0)

          return (
            <div
              key={coll.id}
              className="group relative bg-basalt-50 border border-cream/10 rounded-lg hover:border-sandstone/30 transition-colors cursor-pointer"
              onClick={() => router.push(`${toolPath}/${coll.id}`)}
            >
              {/* Thumbnail grid */}
              {hasThumbnails && <div className="overflow-hidden rounded-t-lg"><ThumbnailGrid imageUrls={preview.imageUrls} /></div>}

              <div className="p-4">
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

                {/* Status counts or "0 selections added" fallback */}
                {hasStatusCounts ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-cream/50">
                    {(preview.statuses!.deciding ?? 0) > 0 && <span>{preview.statuses!.deciding} deciding</span>}
                    {(preview.statuses!.selected ?? 0) > 0 && <span>{preview.statuses!.selected} selected</span>}
                    {(preview.statuses!.ordered ?? 0) > 0 && <span>{preview.statuses!.ordered} ordered</span>}
                    {(preview.statuses!.done ?? 0) > 0 && <span>{preview.statuses!.done} done</span>}
                  </div>
                ) : previewMode === 'statuses' && preview.decisionCount === 0 ? (
                  <p className="mt-1.5 text-[11px] text-cream/35 italic">0 selections added</p>
                ) : null}

                {/* Last comment (selection lists) */}
                {preview.lastComment && (
                  <p className="mt-1.5 text-[11px] text-cream/40 italic line-clamp-2">
                    {preview.lastComment.authorName.split(' ')[0]} on {preview.lastComment.decisionTitle}:
                    {' "'}
                    {preview.lastComment.text.length > 70 ? preview.lastComment.text.slice(0, 70) + '...' : preview.lastComment.text}
                    {'"'}
                  </p>
                )}

                {/* Stats row (mood boards only) */}
                {previewMode === 'thumbnails' && (preview.ideaCount > 0 || preview.commentCount > 0) && (
                  <div className="flex items-center gap-3 mt-1.5">
                    {preview.ideaCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-cream/50">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {preview.ideaCount} {preview.ideaCount === 1 ? 'mood' : 'moods'}
                      </span>
                    )}
                    {preview.commentCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-cream/50">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {preview.commentCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Created + Updated + shared */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <p className="text-xs text-cream/40">
                    Created {new Date(coll.createdAt).toLocaleDateString()}
                  </p>
                  <span className="text-cream/15">&middot;</span>
                  <p className="text-xs text-cream/40">
                    Updated {new Date(coll.updatedAt).toLocaleDateString()}
                    {coll.updatedBy?.name && (
                      <span> by {coll.updatedBy.name.split(' ')[0]}</span>
                    )}
                  </p>
                  {coll.members.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-sandstone/60 bg-sandstone/10 rounded-full px-1.5 py-0.5">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="8.5" cy="7" r="4" />
                        <path d="M20 8v6M23 11h-6" strokeLinecap="round" />
                      </svg>
                      Shared
                    </span>
                  )}
                </div>

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
              </div>

              {/* ⋯ action menu */}
              <div
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                ref={menuOpenId === coll.id ? menuRef : undefined}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === coll.id ? null : coll.id)
                  }}
                  className="p-1.5 text-cream/40 hover:text-cream/70 transition-colors bg-basalt/80 rounded"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                  </svg>
                </button>

                {menuOpenId === coll.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(null)
                        setShareTarget({ collectionId: coll.id, collectionName: coll.title })
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 hover:text-cream transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="8.5" cy="7" r="4" />
                        <path d="M20 8v6M23 11h-6" strokeLinecap="round" />
                      </svg>
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(null)
                        window.open(`${toolPath}/${coll.id}/report`, '_blank')
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 hover:text-cream transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                      </svg>
                      Export / Print
                    </button>
                    <div className="border-t border-cream/10 my-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(null)
                        setEditingId(coll.id)
                        setEditTitle(coll.title)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 hover:text-cream transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(null)
                        if (confirm(`Archive "${coll.title}"?`)) handleArchive(coll.id)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400/70 hover:bg-cream/5 hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="5" rx="1" />
                        <path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Archive
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {/* + Add a new tile */}
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-cream/15 hover:border-sandstone/40 bg-basalt-50 transition-colors cursor-pointer min-h-[120px]"
          >
            <svg className="w-7 h-7 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm text-cream/40 font-medium">Add a new {itemNoun}</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-sandstone/40 bg-basalt-50 p-4 min-h-[120px]">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
              }}
              placeholder={`${itemNoun.charAt(0).toUpperCase() + itemNoun.slice(1)} name...`}
              className="w-full bg-basalt border border-cream/20 rounded px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="text-xs font-medium text-basalt bg-sandstone rounded px-3 py-1.5 hover:bg-sandstone-light transition-colors disabled:opacity-40 whitespace-nowrap"
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
          </div>
        )}
      </div>

      {/* Archived section */}
      {archivedCollections.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-sm text-cream/40 hover:text-cream/60 transition-colors mb-3"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showArchived ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Archived ({archivedCollections.length})
          </button>
          {showArchived && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {archivedCollections.map((coll) => (
                <div
                  key={coll.id}
                  className="relative bg-basalt-50 border border-cream/5 rounded-lg overflow-hidden opacity-60"
                >
                  <div className="p-4">
                    <h3 className="font-medium text-cream/60 truncate">{coll.title}</h3>
                    <p className="text-xs text-cream/30 mt-1">
                      Archived {new Date(coll.updatedAt).toLocaleDateString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRestore(coll.id)}
                      className="mt-2 text-xs text-sandstone hover:text-sandstone-light transition-colors font-medium"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {shareTarget && currentProject && (
        <ShareToolModal
          projectId={currentProject.id}
          toolKey={toolKey}
          collectionId={shareTarget.collectionId}
          collectionName={shareTarget.collectionName}
          onClose={() => setShareTarget(null)}
        />
      )}
    </div>
  )
}
