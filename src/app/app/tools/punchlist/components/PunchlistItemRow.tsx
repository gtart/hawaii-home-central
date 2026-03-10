'use client'

import { useState } from 'react'
import type { PunchlistItem, PunchlistStatus } from '../types'
import { STATUS_CONFIG, STATUS_CYCLE, PRIORITY_CONFIG } from '../constants'

interface Props {
  item: PunchlistItem
  onTap: () => void
  onStatusChange?: (itemId: string, status: PunchlistStatus) => void
  onRename?: (itemId: string, newTitle: string) => void
  selected?: boolean
  onToggleSelect?: (itemId: string) => void
  commentCount?: number
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PunchlistItemRow({ item, onTap, onStatusChange, onRename, selected, onToggleSelect, commentCount }: Props) {
  const statusCfg = STATUS_CONFIG[item.status]
  const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  function cycleStatus(e: React.MouseEvent) {
    e.stopPropagation()
    if (!onStatusChange) return
    const idx = STATUS_CYCLE.indexOf(item.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    onStatusChange(item.id, next)
  }

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  function startRename(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    setRenameValue(item.title)
    setRenaming(true)
  }

  function submitRename() {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== item.title && onRename) {
      onRename(item.id, trimmed)
    }
    setRenaming(false)
  }

  if (renaming) {
    return (
      <div className="px-4 py-2.5 border-b border-cream/5 last:border-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false) }}
            autoFocus
            className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-1.5 text-sm text-cream focus:outline-none focus:border-sandstone/50"
          />
          <button type="button" onClick={() => setRenaming(false)} className="text-xs text-cream/40 hover:text-cream/60 px-2 py-1 transition-colors">Cancel</button>
          <button type="button" onClick={submitRename} className="text-xs bg-sandstone text-basalt font-medium px-2.5 py-1 rounded-lg hover:bg-sandstone-light transition-colors">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`grid ${onToggleSelect ? 'grid-cols-[1.5rem_2.5rem_1fr_8rem_8rem_4rem_5rem_3rem]' : 'grid-cols-[2.5rem_1fr_8rem_8rem_4rem_5rem_3rem]'} gap-2 items-center px-4 py-2.5 border-b border-cream/5 last:border-0 cursor-pointer hover:bg-cream/3 transition-colors relative ${selected ? 'bg-sandstone/5' : ''}`}
      onClick={onTap}
    >
      {/* Checkbox */}
      {onToggleSelect && (
        <label className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(item.id)}
            className="w-3.5 h-3.5 rounded border-cream/30 bg-transparent text-sandstone focus:ring-sandstone/30 focus:ring-offset-0 cursor-pointer"
          />
        </label>
      )}

      {/* Thumbnail + status dot */}
      <div className="relative w-9 h-9 flex items-center justify-center">
        {item.photos.length > 0 ? (
          <img
            src={item.photos[0].thumbnailUrl || item.photos[0].url}
            alt=""
            className="w-9 h-9 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-9 h-9 rounded bg-cream/5 flex items-center justify-center">
            <svg className="w-4 h-4 text-cream/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {onStatusChange ? (
          <button
            type="button"
            onClick={cycleStatus}
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusCfg.dot} ring-2 ring-basalt-50 hover:ring-cream/20 transition-all`}
            title={statusCfg.label}
          />
        ) : (
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusCfg.dot} ring-2 ring-basalt-50`} title={statusCfg.label} />
        )}
      </div>

      {/* #N Title */}
      <div className="truncate text-sm text-cream flex items-center gap-1.5">
        <span className="truncate">
          <span className="text-cream/30 text-xs">#{item.itemNumber}</span>{' '}
          {item.title || <span className="text-cream/40 italic">Untitled</span>}
        </span>
        {commentCount && commentCount > 0 ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-cream/30 shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {commentCount}
          </span>
        ) : null}
      </div>

      {/* Location */}
      <span className="text-xs text-cream/50 truncate">{item.location || '—'}</span>

      {/* Assignee */}
      <span className="text-xs text-cream/50 truncate">{item.assigneeLabel || '—'}</span>

      {/* Priority */}
      {priorityCfg ? (
        <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded text-center ${priorityCfg.className}`}>
          {priorityCfg.label}
        </span>
      ) : (
        <span className="text-cream/20 text-xs text-center">—</span>
      )}

      {/* Due */}
      <span className={`text-[11px] tabular-nums ${item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10) && item.status !== 'DONE' ? 'text-red-400' : 'text-cream/30'}`}>
        {item.dueDate ? shortDate(item.dueDate + 'T00:00:00') : '—'}
      </span>

      {/* Actions: kebab */}
      <div className="flex items-center justify-end gap-1">
        {onRename && (
          <div className="relative">
            <button
              type="button"
              onClick={handleMenuToggle}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-cream/10 transition-colors text-cream/20 hover:text-cream/40"
              aria-label="Item actions"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                <div className="absolute right-0 top-7 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                  <button type="button" onClick={startRename} className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors">Rename</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTap() }} className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors">Edit details</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
