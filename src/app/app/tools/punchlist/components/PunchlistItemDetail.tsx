'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { PunchlistItem, PunchlistPhoto } from '../types'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { STATUS_CONFIG, STATUS_CYCLE, PRIORITY_CONFIG } from '../constants'
import { PhotoLightbox } from './PhotoLightbox'
import { uploadFile } from '../utils'

interface Props {
  item: PunchlistItem
  api: PunchlistStateAPI
  onClose: () => void
  onEdit: () => void
}

export function PunchlistItemDetail({ item, api, onClose, onEdit }: Props) {
  const { readOnly, setStatus, deleteItem, addPhoto } = api
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoSaved, setPhotoSaved] = useState(false)
  const detailCameraRef = useRef<HTMLInputElement>(null)
  const detailGalleryRef = useRef<HTMLInputElement>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handlePhotoFiles(files: FileList | null, ref: React.RefObject<HTMLInputElement | null>) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.size === 0) {
      setPhotoError('Camera returned an empty photo — try again')
      if (ref.current) ref.current.value = ''
      return
    }
    setPhotoError('')
    setPhotoUploading(true)
    try {
      const uploaded = await uploadFile(file)
      addPhoto(item.id, uploaded)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      setPhotoSaved(true)
      savedTimerRef.current = setTimeout(() => setPhotoSaved(false), 2000)
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setPhotoUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

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
      onClose()
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-5 py-3 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors p-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <h2 className="text-base font-medium text-cream truncate flex-1 mx-3 text-center">
            <span className="text-cream/30">#{item.itemNumber}</span>{' '}
            {item.title || <span className="text-cream/40 italic font-normal">Untitled</span>}
          </h2>

          {!readOnly && (
            <button
              type="button"
              onClick={onEdit}
              className="text-sandstone text-sm font-medium shrink-0"
            >
              Edit
            </button>
          )}
          {readOnly && <div className="w-8" />}
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Photo gallery — horizontal scroll */}
          {item.photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
              {item.photos.map((photo, i) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="shrink-0 w-48 h-36 rounded-lg overflow-hidden snap-start"
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Add photo — editors/owners only */}
          {!readOnly && (
            <div>
              {/* Hidden file inputs */}
              <input
                ref={detailCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoFiles(e.target.files, detailCameraRef)}
                className="hidden"
                tabIndex={-1}
              />
              <input
                ref={detailGalleryRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoFiles(e.target.files, detailGalleryRef)}
                className="hidden"
                tabIndex={-1}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => detailCameraRef.current?.click()}
                  disabled={photoUploading}
                  className="flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream/60 disabled:opacity-50 transition-colors"
                >
                  {photoUploading ? (
                    <div className="w-3.5 h-3.5 border border-cream/20 border-t-sandstone rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                  Camera
                </button>
                <span className="text-cream/15">|</span>
                <button
                  type="button"
                  onClick={() => detailGalleryRef.current?.click()}
                  disabled={photoUploading}
                  className="flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream/60 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Photos
                </button>
                {photoSaved && <span className="text-xs text-emerald-400 ml-2">Saved ✓</span>}
                {photoError && <span className="text-xs text-red-400 ml-2">{photoError}</span>}
              </div>
            </div>
          )}

          {/* Status + Priority row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cycleStatus}
              disabled={readOnly}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text} ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
              } transition-opacity`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </button>

            {priorityCfg && (
              <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded ${priorityCfg.className}`}>
                {priorityCfg.label}
              </span>
            )}
          </div>

          {/* Detail fields */}
          <div className="space-y-3">
            <DetailRow label="Location" value={item.location || '—'} />
            <DetailRow label="Assignee" value={item.assigneeLabel || '—'} />
            <DetailRow
              label="Created"
              value={
                item.createdByName
                  ? `${item.createdByName} · ${new Date(item.createdAt).toLocaleDateString()}`
                  : new Date(item.createdAt).toLocaleDateString()
              }
            />
            <DetailRow label="Updated" value={new Date(item.updatedAt).toLocaleDateString()} />
            {item.completedAt && (
              <DetailRow label="Completed" value={new Date(item.completedAt).toLocaleDateString()} />
            )}
          </div>

          {/* Additional Information section */}
          {item.notes && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-cream/30 mb-2">Additional Information</h3>
              <p className="text-sm text-cream/60 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Comments section */}
          <CommentsSection item={item} api={api} readOnly={readOnly} />

          {/* Delete button */}
          {!readOnly && (
            <div className="pt-3 border-t border-cream/5">
              <button
                type="button"
                onClick={handleDelete}
                className={`text-xs transition-colors ${
                  confirmDelete
                    ? 'text-red-400 font-medium'
                    : 'text-cream/30 hover:text-red-400'
                }`}
              >
                {confirmDelete ? 'Tap again to delete this item' : 'Delete item'}
              </button>
            </div>
          )}
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
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cream/40">{label}</span>
      <span className="text-sm text-cream/70">{value}</span>
    </div>
  )
}

const COMMENTS_PER_PAGE = 10
const MAX_COMMENT_LENGTH = 400

function CommentsSection({ item, api, readOnly }: { item: PunchlistItem; api: PunchlistStateAPI; readOnly: boolean }) {
  const [page, setPage] = useState(0)
  const allComments = [...(item.comments || [])].reverse()
  const totalPages = Math.max(1, Math.ceil(allComments.length / COMMENTS_PER_PAGE))
  const pageComments = allComments.slice(page * COMMENTS_PER_PAGE, (page + 1) * COMMENTS_PER_PAGE)

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-cream/30 mb-3">
        Comments {allComments.length > 0 && `(${allComments.length})`}
      </h3>

      {/* Comment input — editors/owners only, at top */}
      {!readOnly && <CommentInput itemId={item.id} api={api} />}

      {allComments.length === 0 && (
        <p className="text-xs text-cream/20 mt-3">No comments yet.</p>
      )}

      <div className="space-y-3 mt-3">
        {pageComments.map((comment) => (
          <div key={comment.id} className="pb-3 border-b border-cream/5 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-cream/70">{comment.authorName}</span>
              <span className="text-cream/20">&middot;</span>
              <span className="text-[11px] text-cream/30">
                {new Date(comment.createdAt).toLocaleDateString()}{' '}
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-cream/50 whitespace-pre-wrap">{comment.text}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-cream/5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs text-cream/40 hover:text-cream disabled:opacity-30 transition-colors"
          >
            Newer
          </button>
          <span className="text-[11px] text-cream/30">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs text-cream/40 hover:text-cream disabled:opacity-30 transition-colors"
          >
            Older
          </button>
        </div>
      )}
    </div>
  )
}

function CommentInput({ itemId, api }: { itemId: string; api: PunchlistStateAPI }) {
  const { data: session } = useSession()
  const [text, setText] = useState('')

  function handleSubmit() {
    if (!text.trim() || !session?.user) return
    api.addComment(itemId, {
      text: text.trim().slice(0, MAX_COMMENT_LENGTH),
      authorName: session.user.name || 'Unknown',
      authorEmail: session.user.email || '',
    })
    setText('')
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="Add a comment..."
          maxLength={MAX_COMMENT_LENGTH}
          className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-3 py-2 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors disabled:opacity-30"
        >
          Post
        </button>
      </div>
      {text.length > 0 && (
        <p className={`text-[10px] mt-1 text-right ${text.length >= MAX_COMMENT_LENGTH ? 'text-red-400' : 'text-cream/25'}`}>
          {text.length}/{MAX_COMMENT_LENGTH}
        </p>
      )}
    </div>
  )
}
