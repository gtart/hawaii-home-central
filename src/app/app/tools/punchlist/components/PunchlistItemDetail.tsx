'use client'

import { useState, useRef, useMemo } from 'react'

import type { PunchlistItem, PunchlistPhoto, PunchlistPriority } from '../types'
import type { CommentRow } from '@/hooks/useComments'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { STATUS_CONFIG, STATUS_CYCLE, PRIORITY_CONFIG } from '../constants'
import { LOCATION_SEEDS, ASSIGNEE_SEEDS } from '../utils'
import { PhotoLightbox } from './PhotoLightbox'
import { uploadFile } from '../utils'
import { DestinationPicker } from '@/components/app/DestinationPicker'
import { ProjectSummaryLinkBadge } from '@/components/app/ProjectSummaryLinkBadge'
import { CreateProjectSummaryEntryButton } from '@/components/app/CreateProjectSummaryEntryButton'
import { useCollectionTransfer } from '@/hooks/useCollectionTransfer'

type EditingField = 'title' | 'location' | 'assignee' | 'priority' | 'notes' | null

interface Props {
  item: PunchlistItem
  api: PunchlistStateAPI
  collectionId?: string
  projectId?: string
  onClose: () => void
  onMoveComplete?: (message: string) => void
  onOpenComments?: (ref?: import('@/components/app/CommentThread').RefEntity) => void
  allComments?: import('@/hooks/useComments').CommentRow[]
}

/** Small pencil icon button shown next to editable fields */
function PencilButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 text-cream/35 hover:text-sandstone transition-colors shrink-0"
      aria-label="Edit"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function PunchlistItemDetail({ item, api, collectionId, projectId, onClose, onMoveComplete, onOpenComments, allComments }: Props) {
  const { readOnly, updateItem, setStatus, deleteItem, addPhoto, payload } = api
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const { transfer, isTransferring } = useCollectionTransfer()
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [photoSaved, setPhotoSaved] = useState(false)
  const detailCameraRef = useRef<HTMLInputElement>(null)
  const detailGalleryRef = useRef<HTMLInputElement>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inline editing state
  const [editingField, setEditingField] = useState<EditingField>(null)
  const [editValue, setEditValue] = useState('')

  // Datalist options for location/assignee
  const locationOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.location).filter(Boolean))
    const all = new Set([...LOCATION_SEEDS, ...existing])
    return Array.from(all).sort()
  }, [payload.items])

  const assigneeOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.assigneeLabel).filter(Boolean))
    const all = new Set([...ASSIGNEE_SEEDS, ...existing])
    return Array.from(all).sort()
  }, [payload.items])

  function startEditing(field: Exclude<EditingField, null | 'priority'>) {
    const current =
      field === 'title' ? item.title
        : field === 'location' ? item.location
          : field === 'assignee' ? item.assigneeLabel
            : item.notes ?? ''
    setEditValue(current)
    setEditingField(field)
  }

  function saveField() {
    if (!editingField || editingField === 'priority') return
    const trimmed = editValue.trim()
    const updates: Record<string, string | undefined> = {}
    if (editingField === 'title') updates.title = trimmed
    else if (editingField === 'location') updates.location = trimmed
    else if (editingField === 'assignee') updates.assigneeLabel = trimmed
    else if (editingField === 'notes') updates.notes = trimmed || undefined
    updateItem(item.id, updates)
    setEditingField(null)
  }

  function cancelEditing() {
    setEditingField(null)
  }

  function handleFieldKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && editingField !== 'notes') {
      e.preventDefault()
      saveField()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  function handleNotesKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  function cyclePriority() {
    if (readOnly) return
    const cycle: (PunchlistPriority | undefined)[] = [undefined, 'LOW', 'MED', 'HIGH']
    const idx = cycle.indexOf(item.priority)
    const next = cycle[(idx + 1) % cycle.length]
    updateItem(item.id, { priority: next })
  }

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
      <div className="relative bg-stone border-t sm:border border-cream/15 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-stone border-b border-cream/15 px-5 py-3 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={onClose}
            className="text-cream/55 hover:text-cream transition-colors p-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {editingField === 'title' ? (
            <div className="flex-1 mx-3">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleFieldKeyDown}
                onBlur={saveField}
                autoFocus
                className="w-full bg-stone-200 border border-sandstone/40 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/60"
                placeholder="Item title..."
              />
            </div>
          ) : (
            <h2 className="text-base font-medium text-cream truncate flex-1 mx-3 text-center group/title">
              <span className="text-cream/45">#{item.itemNumber}</span>{' '}
              {item.title || <span className="text-cream/55 italic font-normal">Untitled</span>}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => startEditing('title')}
                  className="inline-block ml-1.5 align-middle p-0.5 text-cream/30 hover:text-sandstone transition-colors"
                  aria-label="Edit title"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </h2>
          )}

          <div className="w-8 shrink-0" />
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Photo gallery — horizontal scroll */}
          {item.photos.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory max-w-full">
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
                  className="flex items-center gap-1.5 text-xs text-cream/55 hover:text-cream/70 disabled:opacity-50 transition-colors"
                >
                  {photoUploading ? (
                    <div className="w-3.5 h-3.5 border border-cream/35 border-t-sandstone rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                  Camera
                </button>
                <span className="text-cream/30">|</span>
                <button
                  type="button"
                  onClick={() => detailGalleryRef.current?.click()}
                  disabled={photoUploading}
                  className="flex items-center gap-1.5 text-xs text-cream/55 hover:text-cream/70 disabled:opacity-50 transition-colors"
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

            <button
              type="button"
              onClick={cyclePriority}
              disabled={readOnly}
              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
              } ${priorityCfg ? priorityCfg.className : 'bg-stone-200 text-cream/40'}`}
            >
              {priorityCfg ? priorityCfg.label : 'No priority'}
            </button>
          </div>

          {/* Detail fields */}
          <div className="space-y-3">
            {/* Location — inline editable */}
            <EditableDetailRow
              label="Location"
              value={item.location || '—'}
              isEditing={editingField === 'location'}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onStartEdit={() => startEditing('location')}
              onSave={saveField}
              onCancel={cancelEditing}
              onKeyDown={handleFieldKeyDown}
              canEdit={!readOnly}
              placeholder="e.g. Master Bathroom"
              datalistId="detail-locations"
              datalistOptions={locationOptions}
            />

            {/* Assignee — inline editable */}
            <EditableDetailRow
              label="Assignee"
              value={item.assigneeLabel || '—'}
              isEditing={editingField === 'assignee'}
              editValue={editValue}
              onEditValueChange={setEditValue}
              onStartEdit={() => startEditing('assignee')}
              onSave={saveField}
              onCancel={cancelEditing}
              onKeyDown={handleFieldKeyDown}
              canEdit={!readOnly}
              placeholder="e.g. GC, Plumber"
              datalistId="detail-assignees"
              datalistOptions={assigneeOptions}
            />

            {/* Due Date */}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-cream/45 w-20 shrink-0">Due date</span>
              <input
                type="date"
                value={item.dueDate || ''}
                onChange={(e) => updateItem(item.id, { dueDate: e.target.value || null })}
                disabled={readOnly}
                className="bg-transparent text-sm text-cream/70 focus:outline-none focus:text-cream [color-scheme:dark] disabled:opacity-50 cursor-pointer"
              />
            </div>

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

          {/* Additional Information section — inline editable */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-wider text-cream/45">Additional Information</h3>
              {!readOnly && editingField !== 'notes' && (
                <PencilButton onClick={() => startEditing('notes')} />
              )}
            </div>
            {editingField === 'notes' ? (
              <div>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleNotesKeyDown}
                  rows={3}
                  autoFocus
                  placeholder="Optional additional details…"
                  className="w-full bg-stone-200 border border-sandstone/40 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/60 resize-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={saveField}
                    className="text-xs px-3 py-1 bg-sandstone/20 text-sandstone rounded-lg hover:bg-sandstone/30 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-xs px-3 py-1 text-cream/55 hover:text-cream/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-cream/70 whitespace-pre-wrap leading-relaxed">
                {item.notes || <span className="text-cream/35 italic">None</span>}
              </p>
            )}
          </div>

          {/* Cross-tool: Project Summary entries linked to this fix item */}
          {projectId && (
            <div className="space-y-2">
              <ProjectSummaryLinkBadge projectId={projectId} entityId={item.id} />
              {!readOnly && (
                <CreateProjectSummaryEntryButton
                  artifactType="fix_item"
                  entityId={item.id}
                  entityLabel={item.title}
                  toolKey="punchlist"
                  collectionId={collectionId}
                />
              )}
            </div>
          )}

          {/* Comments preview */}
          <ItemCommentsPreview
            itemId={item.id}
            itemTitle={item.title}
            collectionId={collectionId}
            allComments={allComments}
            onOpenComments={onOpenComments}
            readOnly={readOnly}
          />

          {/* Actions */}
          {!readOnly && (
            <div className="pt-3 border-t border-cream/10 space-y-3">
              {collectionId && projectId && (
                <button
                  type="button"
                  onClick={() => setMoveOpen(true)}
                  disabled={isTransferring}
                  className="flex items-center gap-2 text-xs text-cream/55 hover:text-cream/70 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {isTransferring ? 'Moving...' : 'Move to another list...'}
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className={`text-xs transition-colors ${
                  confirmDelete
                    ? 'text-red-400 font-medium'
                    : 'text-cream/45 hover:text-red-400'
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

      {/* Destination picker for move */}
      {moveOpen && collectionId && projectId && (
        <DestinationPicker
          toolKey="punchlist"
          projectId={projectId}
          excludeCollectionId={collectionId}
          actionLabel="Move"
          title="Move fix to..."
          onClose={() => setMoveOpen(false)}
          onConfirm={async (dest) => {
            const result = await transfer({
              sourceCollectionId: collectionId,
              destinationCollectionId: dest.collectionId,
              operation: 'move',
              entityType: 'punchlist_item',
              entityId: item.id,
            })
            if (result.success) {
              deleteItem(item.id)
              onMoveComplete?.(`Moved "${item.title}" to ${dest.collectionTitle}`)
              onClose()
            }
            setMoveOpen(false)
          }}
        />
      )}
    </div>
  )
}

/** Read-only detail row (Created, Updated, Completed) */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cream/55">{label}</span>
      <span className="text-sm text-cream/80">{value}</span>
    </div>
  )
}

/** Detail row with inline edit support */
function EditableDetailRow({
  label,
  value,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSave,
  onCancel,
  onKeyDown,
  canEdit,
  placeholder,
  datalistId,
  datalistOptions,
}: {
  label: string
  value: string
  isEditing: boolean
  editValue: string
  onEditValueChange: (v: string) => void
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  canEdit: boolean
  placeholder?: string
  datalistId?: string
  datalistOptions?: string[]
}) {
  if (isEditing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-cream/55 shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onSave}
            autoFocus
            placeholder={placeholder}
            list={datalistId}
            className="w-40 sm:w-48 bg-stone-200 border border-sandstone/40 rounded-lg px-2.5 py-1 text-sm text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/60 text-right"
          />
          {datalistId && datalistOptions && (
            <datalist id={datalistId}>
              {datalistOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between group/row">
      <span className="text-xs text-cream/55">{label}</span>
      <span className="flex items-center gap-1 text-sm text-cream/80">
        {value}
        {canEdit && <PencilButton onClick={onStartEdit} />}
      </span>
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

/** Compact comment preview for item detail — shows last 3 comments + link to sidebar */
function ItemCommentsPreview({
  itemId,
  itemTitle,
  collectionId,
  allComments,
  onOpenComments,
  readOnly,
}: {
  itemId: string
  itemTitle: string
  collectionId?: string
  allComments?: CommentRow[]
  onOpenComments?: (ref?: import('@/components/app/CommentThread').RefEntity) => void
  readOnly: boolean
}) {
  // Filter to comments that reference this item
  const itemComments = useMemo(() => {
    if (!allComments) return []
    return allComments
      .filter((c) => c.refEntityId === itemId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }, [allComments, itemId])

  const totalCount = useMemo(() => {
    if (!allComments) return 0
    return allComments.filter((c) => c.refEntityId === itemId).length
  }, [allComments, itemId])

  const handleOpenSidebar = () => {
    onOpenComments?.({ id: itemId, label: itemTitle })
  }

  // If no sidebar integration, don't show anything
  if (!collectionId || !onOpenComments) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-cream/45">
          Comments {totalCount > 0 && `(${totalCount})`}
        </h3>
        <button
          type="button"
          onClick={handleOpenSidebar}
          className="text-[11px] text-sandstone/70 hover:text-sandstone transition-colors"
        >
          {totalCount > 0 ? 'View all' : 'Add comment'} →
        </button>
      </div>

      {itemComments.length > 0 ? (
        <div className="space-y-2">
          {itemComments.map((comment) => (
            <div key={comment.id} className="pb-2 border-b border-cream/10 last:border-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-cream/80">{comment.authorName || 'Unknown'}</span>
                <span className="text-[10px] text-cream/40">{relativeTime(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-cream/65 whitespace-pre-wrap line-clamp-2">{comment.text}</p>
            </div>
          ))}
          {totalCount > 3 && (
            <button
              type="button"
              onClick={handleOpenSidebar}
              className="text-xs text-cream/45 hover:text-cream/65 transition-colors"
            >
              +{totalCount - 3} more comment{totalCount - 3 !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-cream/35">No comments on this fix yet.</p>
      )}
    </div>
  )
}
