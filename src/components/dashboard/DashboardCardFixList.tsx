'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import type { DashboardResponse, ToolPreviewItem } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { displayUrl } from '@/lib/finishDecisionsImages'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

export function DashboardCardFixList({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  const { currentProject } = useProject()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (isLoading) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6 animate-pulse">
        <div className="h-4 w-20 bg-stone-200 rounded mb-4" />
        <div className="h-6 w-16 bg-stone-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-stone-200 rounded" />
          <div className="h-10 bg-stone-200 rounded" />
        </div>
      </div>
    )
  }

  const lists = data?.fixLists ?? []
  const totalOpen = lists.reduce((s, l) => s + l.openCount, 0)
  const totalHigh = lists.reduce((s, l) => s + l.highPriorityCount, 0)
  const hasItems = lists.length > 0
  const previews = data?.toolPreviews?.fixList ?? []

  async function handleSubmit() {
    if (!title.trim() || adding) return
    setAdding(true)

    try {
      // Determine which list to add to
      let listId = selectedListId || (lists.length === 1 ? lists[0].id : null)

      // If no lists exist, create one first
      if (!listId && lists.length === 0 && currentProject?.id) {
        const createRes = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: currentProject.id, toolKey: 'punchlist', title: 'Fix List #1' }),
        })
        if (!createRes.ok) return
        const createData = await createRes.json()
        listId = createData.collection.id
      }

      if (!listId) return

      // Read current payload
      const getRes = await fetch(`/api/collections/${listId}`)
      if (!getRes.ok) return
      const collData = await getRes.json()
      const payload = collData.payload ?? { version: 3, nextItemNumber: 1, items: [] }

      // Add the new item
      const ts = new Date().toISOString()
      const itemNumber = payload.nextItemNumber ?? (payload.items?.length ?? 0) + 1
      const newItem = {
        id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        itemNumber,
        title: title.trim(),
        location: '',
        status: 'OPEN',
        assigneeLabel: '',
        photos: [],
        createdAt: ts,
        updatedAt: ts,
      }

      const updatedPayload = {
        ...payload,
        version: 3,
        nextItemNumber: itemNumber + 1,
        items: [...(payload.items ?? []), newItem],
      }

      // PATCH the collection
      const patchRes = await fetch(`/api/collections/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: updatedPayload }),
      })

      if (patchRes.ok) {
        setTitle('')
        setShowForm(false)
        setToast('Fix added')
        setTimeout(() => setToast(null), 2000)
      }
    } catch {
      // ignore
    } finally {
      setAdding(false)
    }
  }

  function openForm() {
    setShowForm(true)
    setSelectedListId(lists.length === 1 ? lists[0].id : lists[0]?.id ?? null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Not started — empty state
  if (!hasItems) {
    return (
      <Link href="/app/tools/punchlist" className="block bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
        <p className="text-sm font-medium text-cream/80 mb-2 group-hover:text-sandstone transition-colors">Fix List</p>
        <p className="text-sm text-cream/45 mb-3 leading-relaxed">
          Keep a running list of things that need fixing — walkthrough notes, punch items, loose ends.
        </p>
        <span className="inline-flex items-center text-sm text-sandstone/70 group-hover:text-sandstone transition-colors">
          Start tracking
          <svg className="w-3.5 h-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    )
  }

  return (
    <div className="bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
      {/* Header */}
      <Link href="/app/tools/punchlist" className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-cream/80 group-hover:text-sandstone transition-colors">Fix List</p>
        {totalOpen > 0 && (
          <span className="text-xs text-cream/40">{totalOpen} open{totalHigh > 0 ? ` · ${totalHigh} urgent` : ''}</span>
        )}
        {totalOpen === 0 && (
          <span className="text-xs text-emerald-400/60">All resolved</span>
        )}
      </Link>

      {/* Story previews */}
      {previews.length > 0 ? (
        <div className="space-y-0.5">
          {previews.map((p) => (
            <PreviewRow key={p.id} item={p} />
          ))}
        </div>
      ) : totalOpen === 0 ? (
        <p className="text-xs text-cream/35">No open issues right now.</p>
      ) : (
        <p className="text-xs text-cream/35">Open issues to review.</p>
      )}

      {/* Quick add */}
      {showForm ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          className="mt-3 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs fixing?"
            className="w-full bg-stone-200 border border-cream/15 focus:border-sandstone/40 rounded-lg px-3 py-1.5 text-xs text-cream/80 placeholder-cream/25 outline-none transition-colors"
            onKeyDown={(e) => { if (e.key === 'Escape') { setShowForm(false); setTitle('') } }}
          />
          {lists.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedListId(l.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                    selectedListId === l.id
                      ? 'bg-sandstone/20 text-sandstone'
                      : 'bg-cream/8 text-cream/45 hover:bg-cream/12'
                  }`}
                >
                  {l.title}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!title.trim() || adding}
              className="px-3 py-1 text-[11px] font-medium text-sandstone bg-sandstone/12 hover:bg-sandstone/18 rounded-lg disabled:opacity-30 transition-colors"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setTitle('') }}
              className="px-2 py-1 text-[11px] text-cream/35 hover:text-cream/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 hover:text-sandstone transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Add fix
          </button>
          {toast && (
            <span className="text-[10px] text-emerald-400/70 animate-pulse">{toast}</span>
          )}
        </div>
      )}
    </div>
  )
}

function PreviewRow({ item }: { item: ToolPreviewItem }) {
  return (
    <Link
      href={item.href}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3 -mx-1.5 px-1.5 py-1 rounded-lg hover:bg-cream/5 transition-colors"
    >
      <ImageWithFallback
        src={item.thumbnailUrl ? displayUrl(item.thumbnailUrl) : undefined}
        alt=""
        className="w-9 h-9 rounded-lg object-cover shrink-0"
        fallback={
          <div className="w-9 h-9 rounded-lg bg-stone-200 shrink-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-cream/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
        }
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-cream/70 truncate">{item.title}</p>
        <p className="text-[10px] text-cream/35">{item.event} · {relativeTime(item.timestamp)}</p>
      </div>
    </Link>
  )
}
