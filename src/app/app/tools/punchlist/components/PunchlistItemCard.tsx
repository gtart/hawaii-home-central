'use client'

import { useState } from 'react'
import type { PunchlistItem, PunchlistStatus } from '../types'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { PhotoLightbox } from './PhotoLightbox'

const STATUS_CONFIG: Record<PunchlistStatus, { label: string; dot: string; bg: string; text: string }> = {
  OPEN: { label: 'Open', dot: 'bg-red-400', bg: 'bg-red-400/10', text: 'text-red-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400' },
  DONE: { label: 'Done', dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
}

const STATUS_CYCLE: PunchlistStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE']

const PRIORITY_CONFIG = {
  HIGH: { label: 'High', className: 'bg-red-400/15 text-red-400' },
  MED: { label: 'Med', className: 'bg-amber-400/15 text-amber-400' },
  LOW: { label: 'Low', className: 'bg-cream/10 text-cream/40' },
}

interface Props {
  item: PunchlistItem
  api: PunchlistStateAPI
  onEdit: () => void
}

export function PunchlistItemCard({ item, api, onEdit }: Props) {
  const { setStatus, readOnly, deleteItem } = api
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusCfg = STATUS_CONFIG[item.status]
  const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null

  function cycleStatus() {
    if (readOnly) return
    const idx = STATUS_CYCLE.indexOf(item.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setStatus(item.id, next)
  }

  function handleDelete() {
    if (confirmDelete) {
      deleteItem(item.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <>
      <div className="bg-basalt-50 rounded-card p-4 sm:p-5">
        {/* Top row: photo thumb + info */}
        <div className="flex gap-4">
          {/* Photo thumbnail */}
          {item.photos.length > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative cursor-pointer"
            >
              <img
                src={item.photos[0].url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.photos.length > 1 && (
                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                  +{item.photos.length - 1}
                </span>
              )}
            </button>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-cream font-medium text-sm sm:text-base truncate">
                {item.title}
              </h3>
              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-cream/30 hover:text-cream/60 transition-colors p-1"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`transition-colors p-1 ${
                      confirmDelete
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-cream/30 hover:text-red-400'
                    }`}
                    title={confirmDelete ? 'Click again to confirm' : 'Delete'}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-cream/50 text-xs">{item.location}</span>
              <span className="text-cream/20">·</span>
              <span className="text-cream/50 text-xs">{item.assigneeLabel}</span>
              {priorityCfg && (
                <>
                  <span className="text-cream/20">·</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityCfg.className}`}>
                    {priorityCfg.label}
                  </span>
                </>
              )}
            </div>

            {item.notes && (
              <p className="text-cream/40 text-xs mt-2 line-clamp-2 leading-relaxed">
                {item.notes}
              </p>
            )}
          </div>
        </div>

        {/* Bottom row: status toggle */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream/5">
          <button
            type="button"
            onClick={cycleStatus}
            disabled={readOnly}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text} ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
            } transition-opacity`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </button>

          <span className="text-cream/30 text-[11px]">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={item.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
