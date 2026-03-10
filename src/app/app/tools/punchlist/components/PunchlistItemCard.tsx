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

export function PunchlistItemCard({ item, onTap, onStatusChange, onRename, selected, onToggleSelect, commentCount }: Props) {
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
      <div className="bg-basalt-50 rounded-card p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <label className="text-[10px] uppercase tracking-wider text-cream/30 mb-1.5 block">Rename item</label>
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false) }}
          autoFocus
          className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 mb-2"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setRenaming(false)} className="text-xs text-cream/40 hover:text-cream/60 px-3 py-1.5 transition-colors">Cancel</button>
          <button type="button" onClick={submitRename} className="text-xs bg-sandstone text-basalt font-medium px-3 py-1.5 rounded-lg hover:bg-sandstone-light transition-colors">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-basalt-50 rounded-card p-4 sm:p-5 cursor-pointer active:bg-basalt-50/80 transition-colors relative ${selected ? 'ring-1 ring-sandstone/30 bg-sandstone/5' : ''}`}
      onClick={onTap}
    >
      {/* Selection checkbox */}
      {onToggleSelect && (
        <label className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(item.id)}
            className="w-4 h-4 rounded border-cream/30 bg-transparent text-sandstone focus:ring-sandstone/30 focus:ring-offset-0 cursor-pointer"
          />
        </label>
      )}

      {/* Kebab menu */}
      {onRename && (
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={handleMenuToggle}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-cream/10 transition-colors text-cream/30 hover:text-cream/50"
            aria-label="Item actions"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
              <div className="absolute right-0 top-8 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[140px]">
                <button type="button" onClick={startRename} className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors">Rename</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onTap() }} className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors">Edit details</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Top row: photo thumb + info */}
      <div className={`flex gap-4 ${onToggleSelect ? 'pl-6' : ''}`}>
        {/* Photo thumbnail */}
        {item.photos.length > 0 && (
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative">
            <img
              src={item.photos[0].thumbnailUrl || item.photos[0].url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {item.photos.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                +{item.photos.length - 1}
              </span>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-cream font-medium text-sm sm:text-base truncate">
            <span className="text-cream/30 font-normal">#{item.itemNumber}</span>{' '}
            {item.title || <span className="text-cream/40 italic font-normal">Untitled</span>}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {item.location && <span className="text-cream/50 text-xs">{item.location}</span>}
            {item.location && item.assigneeLabel && <span className="text-cream/20">&middot;</span>}
            {item.assigneeLabel && <span className="text-cream/50 text-xs">{item.assigneeLabel}</span>}
            {priorityCfg && (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityCfg.className}`}>
                  {priorityCfg.label}
                </span>
              </>
            )}
            {item.dueDate && (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className={`text-[10px] ${item.dueDate < new Date().toISOString().slice(0, 10) && item.status !== 'DONE' ? 'text-red-400' : 'text-cream/40'}`}>
                  {item.dueDate < new Date().toISOString().slice(0, 10) && item.status !== 'DONE' ? 'Overdue' : 'Due'}{' '}
                  {new Date(item.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
            {commentCount && commentCount > 0 ? (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-cream/35">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {commentCount}
                </span>
              </>
            ) : null}
          </div>

          {item.notes && (
            <p className="text-cream/40 text-xs mt-2 line-clamp-2 leading-relaxed">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Latest comment */}
      {item.comments && item.comments.length > 0 && (() => {
        const latest = item.comments[item.comments.length - 1]
        return (
          <div className="mt-3 pt-3 border-t border-cream/5 flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-cream/25 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-cream/40 text-xs line-clamp-1">{latest.text}</p>
              <p className="text-cream/25 text-[10px] mt-0.5">
                {latest.authorName} &middot; {new Date(latest.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Bottom row: status badge + date */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream/5">
        {onStatusChange ? (
          <button
            type="button"
            onClick={cycleStatus}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text} hover:opacity-80 active:scale-95 transition-all cursor-pointer`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </button>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        )}

        <span className="text-cream/30 text-[11px]">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
