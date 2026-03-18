'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { DashboardResponse, ToolPreviewItem } from '@/server/dashboard'
import { relativeTime } from '@/lib/relativeTime'
import { displayUrl } from '@/lib/finishDecisionsImages'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

type QuickMode = null | 'board' | 'idea'

export function DashboardCardSelections({
  data,
  isLoading,
}: {
  data: DashboardResponse | null
  isLoading: boolean
}) {
  const [mode, setMode] = useState<QuickMode>(null)
  const [inputValue, setInputValue] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (isLoading) {
    return (
      <div className="bg-stone rounded-card border border-cream/15 p-5 md:p-6 animate-pulse">
        <div className="h-4 w-24 bg-stone-200 rounded mb-4" />
        <div className="h-6 w-16 bg-stone-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-stone-200 rounded" />
          <div className="h-10 bg-stone-200 rounded" />
        </div>
      </div>
    )
  }

  const lists = data?.selectionLists ?? []
  const totalNotStarted = lists.reduce((s, l) => s + l.notStartedCount, 0)
  const totalDeciding = lists.reduce((s, l) => s + l.decidingCount, 0)
  const totalDone = lists.reduce((s, l) => s + l.doneCount, 0)
  const totalActive = totalNotStarted + totalDeciding
  const totalAll = totalNotStarted + totalDeciding + totalDone
  const hasItems = lists.length > 0
  const previews = data?.toolPreviews?.selections ?? []

  // For selections workspace, there's typically one collection (workspace anchor)
  // We operate on the first (or only) workspace collection
  const workspaceId = lists[0]?.id ?? null

  async function handleAddBoard() {
    if (!inputValue.trim() || adding || !workspaceId) return
    setAdding(true)
    try {
      const getRes = await fetch(`/api/collections/${workspaceId}`)
      if (!getRes.ok) return
      const collData = await getRes.json()
      const payload = collData.payload ?? { version: 4, selections: [] }

      const ts = new Date().toISOString()
      const newSelection = {
        id: crypto.randomUUID(),
        title: inputValue.trim(),
        status: 'deciding',
        notes: '',
        options: [],
        tags: [],
        createdAt: ts,
        updatedAt: ts,
      }

      const updatedPayload = {
        ...payload,
        selections: [...(payload.selections ?? []), newSelection],
      }

      const patchRes = await fetch(`/api/collections/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: updatedPayload }),
      })

      if (patchRes.ok) {
        setInputValue('')
        setMode(null)
        setToast('Board added')
        setTimeout(() => setToast(null), 2000)
      }
    } catch { /* ignore */ } finally {
      setAdding(false)
    }
  }

  async function handleAddIdea() {
    if (!inputValue.trim() || adding || !workspaceId) return
    setAdding(true)
    try {
      const getRes = await fetch(`/api/collections/${workspaceId}`)
      if (!getRes.ok) return
      const collData = await getRes.json()
      const payload = collData.payload ?? { version: 4, selections: [] }
      const selections = payload.selections ?? []

      const ts = new Date().toISOString()
      const newOption = {
        id: crypto.randomUUID(),
        name: inputValue.trim(),
        notes: '',
        urls: [],
        createdAt: ts,
        updatedAt: ts,
      }

      let targetId = selectedBoardId

      // If no board selected or no boards exist, find or create Uncategorized
      if (!targetId) {
        const uncat = selections.find((s: { systemKey?: string }) => s.systemKey === 'uncategorized')
        if (uncat) {
          targetId = uncat.id
        } else {
          // Create Uncategorized board
          const uncatBoard = {
            id: crypto.randomUUID(),
            title: 'Uncategorized',
            status: 'deciding',
            notes: '',
            options: [newOption],
            tags: [],
            systemKey: 'uncategorized',
            createdAt: ts,
            updatedAt: ts,
          }
          const updatedPayload = {
            ...payload,
            selections: [uncatBoard, ...selections],
          }
          const patchRes = await fetch(`/api/collections/${workspaceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: updatedPayload }),
          })
          if (patchRes.ok) {
            setInputValue('')
            setMode(null)
            setSelectedBoardId(null)
            setToast('Idea added to Uncategorized')
            setTimeout(() => setToast(null), 2000)
          }
          setAdding(false)
          return
        }
      }

      // Add idea to existing board
      const updatedPayload = {
        ...payload,
        selections: selections.map((s: { id: string; options: unknown[]; updatedAt?: string }) =>
          s.id === targetId
            ? { ...s, options: [...s.options, newOption], updatedAt: ts }
            : s
        ),
      }

      const patchRes = await fetch(`/api/collections/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: updatedPayload }),
      })

      if (patchRes.ok) {
        setInputValue('')
        setMode(null)
        setSelectedBoardId(null)
        setToast('Idea added')
        setTimeout(() => setToast(null), 2000)
      }
    } catch { /* ignore */ } finally {
      setAdding(false)
    }
  }

  function openMode(m: QuickMode) {
    setMode(m)
    setInputValue('')
    setSelectedBoardId(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Not started — empty state
  if (!hasItems || totalAll === 0) {
    return (
      <Link href="/app/tools/finish-decisions" className="block bg-stone rounded-card border border-cream/15 hover:border-sandstone/30 transition-colors p-5 md:p-6 group">
        <p className="text-sm font-medium text-cream/80 mb-2 group-hover:text-sandstone transition-colors">Selections</p>
        <p className="text-sm text-cream/45 mb-3 leading-relaxed">
          Create a board for each finish or fixture you need to pick — save options, compare, and choose.
        </p>
        <span className="inline-flex items-center text-sm text-sandstone/70 group-hover:text-sandstone transition-colors">
          Add your first board
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
      <Link href="/app/tools/finish-decisions" className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-cream/80 group-hover:text-sandstone transition-colors">Selections</p>
        {totalActive > 0 ? (
          <span className="text-xs text-cream/40">{totalActive} to decide{totalDone > 0 ? ` · ${totalDone} done` : ''}</span>
        ) : (
          <span className="text-xs text-emerald-400/60">All {totalDone} decided</span>
        )}
      </Link>

      {/* Story previews */}
      {previews.length > 0 ? (
        <div className="space-y-0.5">
          {previews.map((p) => (
            <PreviewRow key={p.id} item={p} />
          ))}
        </div>
      ) : totalActive === 0 ? (
        <p className="text-xs text-cream/35">All selections finalized.</p>
      ) : (
        <p className="text-xs text-cream/35">Boards waiting for your picks.</p>
      )}

      {/* Quick add */}
      {mode ? (
        <form
          onSubmit={(e) => { e.preventDefault(); mode === 'board' ? handleAddBoard() : handleAddIdea() }}
          className="mt-3 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={mode === 'board' ? 'Board name (e.g. Countertop)' : 'Idea name...'}
            className="w-full bg-stone-200 border border-cream/15 focus:border-sandstone/40 rounded-lg px-3 py-1.5 text-xs text-cream/80 placeholder-cream/25 outline-none transition-colors"
            onKeyDown={(e) => { if (e.key === 'Escape') { setMode(null); setInputValue('') } }}
          />
          {/* Board picker for "Add Idea" mode */}
          {mode === 'idea' && (data?.selectionLists ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {/* Get board names from preview data — we show selection list titles */}
              <button
                type="button"
                onClick={() => setSelectedBoardId(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-colors ${
                  !selectedBoardId
                    ? 'bg-amber-400/15 text-amber-400'
                    : 'bg-cream/8 text-cream/45 hover:bg-cream/12'
                }`}
              >
                Uncategorized
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!inputValue.trim() || adding}
              className="px-3 py-1 text-[11px] font-medium text-sandstone bg-sandstone/12 hover:bg-sandstone/18 rounded-lg disabled:opacity-30 transition-colors"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setMode(null); setInputValue('') }}
              className="px-2 py-1 text-[11px] text-cream/35 hover:text-cream/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => openMode('board')}
            className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 hover:text-sandstone transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Add board
          </button>
          <button
            type="button"
            onClick={() => openMode('idea')}
            className="inline-flex items-center gap-1 text-[11px] text-cream/40 hover:text-sandstone transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Add idea
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
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
