'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ChangeStatus } from '@/data/project-summary'
import { CHANGE_STATUS_CONFIG, CHANGE_STATUS_ORDER } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import type { PrefillDraft } from '../ToolContent'
import { SectionHeader } from './SectionHeader'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'
import { LinkPills } from './LinkPills'
import { AttachMenu } from './AttachMenu'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'

/** Normalize a cost string into dollar format if it looks like a number */
function formatCost(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (trimmed.includes('$')) return trimmed
  const match = trimmed.match(/^([+-]?)\s*([0-9][0-9,]*\.?\d*)$/)
  if (!match) return trimmed
  const sign = match[1]
  const num = parseFloat(match[2].replace(/,/g, ''))
  if (isNaN(num)) return trimmed
  return `${sign}$${num.toLocaleString()}`
}

interface ChangesSectionProps {
  api: ProjectSummaryStateAPI
  commentCounts?: Map<string, number>
  prefillDraft?: PrefillDraft | null
  onDraftConsumed?: () => void
  focusEntryId?: string
}

/** Statuses that count as "approval" — warn if change has unresolved open items (PCV1-055) */
const APPROVAL_STATUSES = new Set<ChangeStatus>(['approved_by_homeowner', 'accepted_by_contractor', 'done'])

/** Status dropdown for changes — custom div-based, never native <select> */
function StatusDropdown({
  status,
  onChange,
  readOnly,
  unresolvedItemCount,
}: {
  status: ChangeStatus
  onChange: (status: ChangeStatus) => void
  readOnly?: boolean
  /** Number of unresolved open items on this change (PCV1-055) */
  unresolvedItemCount?: number
}) {
  const [open, setOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<ChangeStatus | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const config = CHANGE_STATUS_CONFIG[status]

  return (
    <div className="relative" ref={ref}>
      <StatusBadge
        label={config.label}
        color={config.color}
        bgColor={config.bgColor}
        onClick={readOnly ? undefined : () => setOpen(!open)}
        readOnly={readOnly}
      />
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-cream/15 bg-basalt shadow-xl py-1">
          {CHANGE_STATUS_ORDER.map((s) => {
            const cfg = CHANGE_STATUS_CONFIG[s]
            const isActive = s === status
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (s === status) { setOpen(false); return }
                  // PCV1-055: warn when approving with unresolved items
                  if (APPROVAL_STATUSES.has(s) && (unresolvedItemCount ?? 0) > 0) {
                    setPendingStatus(s)
                    setOpen(false)
                    return
                  }
                  onChange(s)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                  isActive ? 'bg-stone-200' : 'hover:bg-stone-hover'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.bgColor} ${isActive ? 'ring-1 ring-cream/35' : ''}`} />
                <span className={cfg.color}>{cfg.label}</span>
                {isActive && <span className="text-cream/45 ml-auto text-[10px]">Current</span>}
              </button>
            )
          })}
        </div>
      )}
      {/* PCV1-055: Unresolved items warning before approval */}
      {pendingStatus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-sm rounded-xl border border-cream/15 bg-basalt p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
              </svg>
              Items Still to Decide
            </h3>
            <p className="text-xs text-cream/65 leading-relaxed">
              This change has <strong className="text-amber-400">{unresolvedItemCount} item{unresolvedItemCount !== 1 ? 's' : ''} still to decide</strong>.
              You can still proceed, but the items will remain tracked.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setPendingStatus(null)} className="text-xs text-cream/45 hover:text-cream/65 transition-colors px-3 py-1.5">
                Go Back
              </button>
              <button
                type="button"
                onClick={() => { onChange(pendingStatus); setPendingStatus(null) }}
                className="text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors px-3 py-1.5 rounded-lg"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Guided incorporation dialog (PCV1-007) */
function IncorporateDialog({
  change,
  openItemCount,
  onConfirm,
  onDismiss,
}: {
  change: { id: string; title: string; cost_impact?: string; schedule_impact?: string }
  openItemCount: number
  onConfirm: (note: string) => void
  onDismiss: () => void
}) {
  const [mergeNote, setMergeNote] = useState('')

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-cream/15 bg-basalt p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-semibold text-cream">Add to Your Plan</h3>
        <p className="text-sm text-cream/70 leading-relaxed">
          This will mark <span className="text-cream/90">&ldquo;{change.title}&rdquo;</span> as part of your plan.
        </p>

        {/* Impact summary */}
        {(change.cost_impact || change.schedule_impact) && (
          <div className="rounded-lg bg-stone-50 border border-cream/12 px-3 py-2 space-y-1">
            <div className="text-[10px] text-cream/45 uppercase tracking-wider font-medium">Impact</div>
            {change.cost_impact && (
              <div className="text-xs text-cream/70">Cost: <span className="text-cream/90">{change.cost_impact}</span></div>
            )}
            {change.schedule_impact && (
              <div className="text-xs text-cream/70">Schedule: <span className="text-cream/90">{change.schedule_impact}</span></div>
            )}
          </div>
        )}

        {/* Open items warning */}
        {openItemCount > 0 && (
          <div className="text-[11px] text-amber-400/60 bg-amber-400/8 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
            </svg>
            {openItemCount} item{openItemCount !== 1 ? 's' : ''} still to decide in the plan
          </div>
        )}

        {/* Merge note */}
        <div>
          <label className="text-[10px] text-cream/45 block mb-1">Note (optional)</label>
          <textarea
            value={mergeNote}
            onChange={(e) => setMergeNote(e.target.value)}
            placeholder="Any notes about adding this to the plan..."
            rows={2}
            className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-cream/55 hover:text-cream/70 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(mergeNote.trim())}
            className="px-3 py-1.5 text-xs bg-teal-400/20 text-teal-400 hover:bg-teal-400/30 rounded-md transition-colors"
          >
            Add to Your Plan
          </button>
        </div>
      </div>
    </div>
  )
}

type ChangeTab = 'accepted' | 'pending' | 'not_approved'

const ACCEPTED_STATUSES = new Set<ChangeStatus>(['approved_by_homeowner', 'accepted_by_contractor', 'done'])
const PENDING_STATUSES = new Set<ChangeStatus>(['requested', 'awaiting_homeowner'])
const NOT_APPROVED_STATUSES = new Set<ChangeStatus>(['closed'])

export function ChangesSection({ api, commentCounts, prefillDraft, onDraftConsumed, focusEntryId }: ChangesSectionProps) {
  const { payload, readOnly, addChange, updateChange, deleteChange, incorporateChange, addChangeAttachment, addLink, removeLink } = api
  const { changes } = payload
  const [activeTab, setActiveTab] = useState<ChangeTab>('accepted')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingChangeId, setUploadingChangeId] = useState<string | null>(null)
  const changeFileInputRef = useRef<HTMLInputElement>(null)
  const [draftLink, setDraftLink] = useState<PrefillDraft | null>(null)
  const [incorporatingChangeId, setIncorporatingChangeId] = useState<string | null>(null)
  const focusRef = useRef<HTMLDivElement>(null)

  const openItemCount = payload.plan.open_items.filter(i => i.status === 'open' || i.status === 'waiting').length

  useEffect(() => {
    if (!prefillDraft) return
    setNewTitle(prefillDraft.title)
    setNewDescription(prefillDraft.description)
    setDraftLink(prefillDraft)
    setShowAddForm(true)
  }, [prefillDraft])

  useEffect(() => {
    if (!focusEntryId) return
    const exists = changes.some((c) => c.id === focusEntryId)
    if (exists) {
      setExpandedId(focusEntryId)
      requestAnimationFrame(() => {
        focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [focusEntryId, changes])

  function handleAdd() {
    if (!newTitle.trim()) return
    const changeId = addChange({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
    })
    if (changeId && draftLink) {
      addLink(changeId, {
        linkType: draftLink.linkType,
        toolKey: draftLink.toolKey,
        collectionId: draftLink.collectionId,
        entityId: draftLink.entityId,
        label: draftLink.entityLabel,
      })
    }
    setNewTitle('')
    setNewDescription('')
    setDraftLink(null)
    setShowAddForm(false)
    onDraftConsumed?.()
  }

  function handleCancelAdd() {
    setShowAddForm(false)
    setNewTitle('')
    setNewDescription('')
    if (draftLink) {
      setDraftLink(null)
      onDraftConsumed?.()
    }
  }

  return (
    <SectionHeader
      title="Changes"
      count={changes.length}
      readOnly={readOnly}
    >
      {/* Hidden file input for inline change uploads */}
      <input
        ref={changeFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file || !uploadingChangeId) return
          try {
            const result = await uploadProjectSummaryFile(file)
            addChangeAttachment(uploadingChangeId, {
              type: 'file',
              url: result.url,
              label: file.name.replace(/\.[^.]+$/, ''),
              fileName: result.fileName,
              fileSize: result.fileSize,
              mimeType: result.mimeType,
              uploadedAt: new Date().toISOString(),
            })
          } catch {
            // Upload error — silently fail for inline (detail page has error display)
          } finally {
            setUploadingChangeId(null)
            if (changeFileInputRef.current) changeFileInputRef.current.value = ''
          }
        }}
      />

      {/* Guided incorporation dialog (PCV1-007) */}
      {incorporatingChangeId && (() => {
        const change = changes.find((c) => c.id === incorporatingChangeId)
        if (!change) return null
        return (
          <IncorporateDialog
            change={change}
            openItemCount={openItemCount}
            onConfirm={(note) => {
              incorporateChange(change.id, undefined, note || undefined)
              setIncorporatingChangeId(null)
            }}
            onDismiss={() => setIncorporatingChangeId(null)}
          />
        )
      })()}

      {changes.length === 0 && !showAddForm && (
        <div className="text-sm text-cream/55 space-y-1.5">
          <p>No changes yet.</p>
          <p className="text-xs text-cream/50">When something deviates from the approved plan — a new material, added work, or a removed scope item — add it here. Each change is tracked separately so the original plan stays intact. You can also link related Selections or Fix Items to each change.</p>
        </div>
      )}

      {/* Tab bar: Accepted / Pending Review / Not Approved */}
      {changes.length > 0 && (() => {
        const acceptedChanges = changes.filter((c) => ACCEPTED_STATUSES.has(c.status) || c.incorporated)
        const pendingChanges = changes.filter((c) => PENDING_STATUSES.has(c.status) && !c.incorporated)
        const notApprovedChanges = changes.filter((c) => NOT_APPROVED_STATUSES.has(c.status) && !c.incorporated)

        const tabs: { key: ChangeTab; label: string; count: number; items: typeof changes }[] = [
          { key: 'accepted', label: 'Accepted', count: acceptedChanges.length, items: acceptedChanges },
          { key: 'pending', label: 'Pending Review', count: pendingChanges.length, items: pendingChanges },
          { key: 'not_approved', label: 'Not Approved', count: notApprovedChanges.length, items: notApprovedChanges },
        ]

        const currentItems = tabs.find((t) => t.key === activeTab)?.items ?? []

        function renderChangeRow(change: typeof changes[0]) {
          const isExpanded = expandedId === change.id
          const commentCount = commentCounts?.get(change.id) || 0
          const canIncorporate = (change.status === 'accepted_by_contractor' || change.status === 'done') && !change.incorporated

          return (
            <div
              key={change.id}
              ref={change.id === focusEntryId ? focusRef : undefined}
              className={`rounded-lg bg-stone-50 border group ${
                change.id === focusEntryId ? 'border-sandstone/30 ring-1 ring-sandstone/20' : 'border-cream/12'
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : change.id)}
              >
                <svg
                  className={`w-3 h-3 text-cream/45 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <span className="text-sm text-cream/80 flex-1 truncate">{change.title}</span>

                {change.incorporated && (
                  <span className="text-[9px] text-teal-400/50 bg-teal-400/5 px-1.5 py-0.5 rounded-full shrink-0 hidden md:inline-flex">
                    In Plan
                  </span>
                )}

                {change.changed_since_accepted && (
                  <span className="text-[9px] text-amber-400/50 shrink-0 hidden md:inline" title="Edited since contractor accepted">
                    Modified
                  </span>
                )}

                <div onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={change.status}
                    onChange={(status) => updateChange(change.id, { status })}
                    readOnly={readOnly}
                    unresolvedItemCount={(change.open_items || []).filter((i) => i.status === 'open' || i.status === 'waiting').length}
                  />
                </div>

                {change.cost_impact && (
                  <span className="text-[10px] text-cream/60 shrink-0 hidden md:inline">{change.cost_impact}</span>
                )}

                {(change.attachments?.length || 0) > 0 && (
                  <span className="text-[10px] text-cream/50 shrink-0 hidden md:flex items-center gap-0.5">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {change.attachments!.length}
                  </span>
                )}

                {commentCount > 0 && (
                  <span className="text-[10px] text-cream/50 shrink-0 hidden md:inline">
                    {commentCount} comment{commentCount !== 1 ? 's' : ''}
                  </span>
                )}

                {api.collectionId && (
                  <Link
                    href={`/app/tools/project-summary/${api.collectionId}/change/${change.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-[10px] text-sandstone/40 hover:text-sandstone transition-colors md:opacity-0 md:group-hover:opacity-100"
                  >
                    Details →
                  </Link>
                )}

                {!readOnly && (
                  confirmDelete === change.id ? (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => { deleteChange(change.id); setConfirmDelete(null) }}
                        className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-cream/45 hover:text-cream/65 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(change.id) }}
                      className="shrink-0 text-cream/30 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete change"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-cream/12 space-y-2">
                  <div>
                    <label className="text-[10px] text-cream/55 block mb-0.5">What Changed</label>
                    <InlineEdit
                      value={change.description || ''}
                      onSave={(v) => updateChange(change.id, { description: v || undefined })}
                      placeholder="What changed?"
                      readOnly={readOnly}
                      multiline
                      displayClassName="text-xs text-cream/70"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-cream/55 block mb-0.5">Reason (optional)</label>
                    <InlineEdit
                      value={change.rationale || ''}
                      onSave={(v) => updateChange(change.id, { rationale: v || undefined })}
                      placeholder="Why was this change needed?"
                      readOnly={readOnly}
                      multiline
                      displayClassName="text-xs text-cream/70"
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-cream/55 block mb-0.5">Requested By</label>
                      <InlineEdit
                        value={change.requested_by || ''}
                        onSave={(v) => updateChange(change.id, { requested_by: v || undefined })}
                        placeholder="Who requested?"
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/70"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/55 block mb-0.5">Cost Impact</label>
                      <InlineEdit
                        value={change.cost_impact || ''}
                        onSave={(v) => updateChange(change.id, { cost_impact: v ? formatCost(v) : undefined })}
                        placeholder="e.g. +$2,500"
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/70"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/55 block mb-0.5">Schedule Impact</label>
                      <InlineEdit
                        value={change.schedule_impact || ''}
                        onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                        placeholder="e.g. adds 1 week"
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/70"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Linked Selections & Fix Items — shown early for discoverability */}
                  <div>
                    {(change.links.length > 0 || !readOnly) && (
                      <label className="text-[10px] text-cream/55 uppercase tracking-wider font-medium block mb-1">Linked Selections &amp; Fix Items</label>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <LinkPills
                        links={change.links}
                        onRemove={readOnly ? undefined : (linkId) => removeLink(change.id, linkId)}
                        readOnly={readOnly}
                      />
                      <AttachMenu
                        readOnly={readOnly}
                        onAttach={(link) => addLink(change.id, link)}
                        projectId={api.projectId}
                      />
                    </div>
                  </div>

                  {/* Contractor Response */}
                  <div>
                    <label className="text-[10px] text-cream/55 block mb-0.5">Note from Contractor (optional)</label>
                    <InlineEdit
                      value={change.contractor_response || ''}
                      onSave={(v) => updateChange(change.id, { contractor_response: v || undefined })}
                      placeholder="Contractor's response to this change..."
                      readOnly={readOnly}
                      multiline
                      displayClassName="text-xs text-cream/70"
                      className="text-xs"
                    />
                  </div>

                  {(change.final_note || !readOnly) && (
                    <div>
                      <label className="text-[10px] text-cream/55 block mb-0.5">Additional Notes (optional)</label>
                      <InlineEdit
                        value={change.final_note || ''}
                        onSave={(v) => updateChange(change.id, { final_note: v || undefined })}
                        placeholder="Any additional notes..."
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/55"
                        className="text-xs"
                      />
                    </div>
                  )}

                  {/* Incorporate action (PCV1-007: guided flow) */}
                  {canIncorporate && !readOnly && (
                    <button
                      type="button"
                      onClick={() => setIncorporatingChangeId(change.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-teal-400 bg-teal-400/10 hover:bg-teal-400/20 rounded-md transition-colors"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      Add to Your Plan
                    </button>
                  )}

                  {/* Incorporation traceability */}
                  {change.incorporated && change.incorporated_at && (
                    <div className="text-[10px] text-teal-400/40">
                      Added to plan on {new Date(change.incorporated_at).toLocaleDateString()}
                      {change.incorporated_by && ` by ${change.incorporated_by}`}
                    </div>
                  )}

                  {/* Changed since accepted warning */}
                  {change.changed_since_accepted && (
                    <div className="text-[10px] text-amber-400/50 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                        <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                      </svg>
                      Edited since contractor accepted
                    </div>
                  )}

                  {/* Attachments + inline upload */}
                  {((change.attachments?.length || 0) > 0 || !readOnly) && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-cream/55">Attachments</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              setUploadingChangeId(change.id)
                              setTimeout(() => changeFileInputRef.current?.click(), 0)
                            }}
                            disabled={uploadingChangeId === change.id}
                            className="inline-flex items-center gap-1 text-[10px] text-cream/50 hover:text-cream/65 transition-colors disabled:opacity-50"
                          >
                            {uploadingChangeId === change.id ? (
                              <div className="w-2.5 h-2.5 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                            ) : (
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                              </svg>
                            )}
                            {uploadingChangeId === change.id ? 'Uploading...' : 'Upload'}
                          </button>
                        )}
                      </div>
                      {(change.attachments || []).map((att) => (
                        <div key={att.id} className="flex items-center gap-1.5 text-[10px] text-cream/55 ml-1">
                          <svg className="w-2.5 h-2.5 text-cream/45 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:text-cream/70 truncate">{att.label}</a>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        }

        return (
          <>
            {/* Tabs */}
            <div className="flex gap-0 border-b border-cream/12 mb-3 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'text-cream/90'
                      : 'text-cream/45 hover:text-cream/65'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'pending' && tab.count > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-medium">
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sandstone/60 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {currentItems.length === 0 && (
              <p className="text-xs text-cream/45 italic py-2">
                {activeTab === 'accepted' && 'No accepted changes yet.'}
                {activeTab === 'pending' && 'No changes pending review.'}
                {activeTab === 'not_approved' && 'No rejected changes.'}
              </p>
            )}

            <div className="space-y-2">
              {currentItems.map((change) => renderChangeRow(change))}
            </div>
          </>
        )
      })()}

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className={`mt-3 p-3 rounded-lg border space-y-2 ${
          draftLink ? 'border-sandstone/20 bg-sandstone/[0.04]' : 'border-cream/15 bg-stone-50'
        }`}>
          {draftLink && (
            <div className="flex items-center gap-2 text-[11px] text-sandstone/70 mb-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Draft from {draftLink.linkType === 'selection' ? 'Selections' : 'Fix List'}
              <span className="text-cream/45">— review and save</span>
            </div>
          )}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') handleCancelAdd() }}
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
          />
          {draftLink && (
            <div className="flex items-center gap-1.5 text-[10px] text-cream/55">
              <span className="text-cream/40">
                <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {draftLink.linkType === 'selection' ? (
                    <>
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  ) : (
                    <>
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  )}
                </svg>
              </span>
              Will link: {draftLink.entityLabel}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancelAdd}
              className="px-3 py-1.5 text-xs text-cream/55 hover:text-cream/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 text-xs bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md transition-colors disabled:opacity-30"
            >
              {draftLink ? 'Save Change' : 'Add Change'}
            </button>
          </div>
        </div>
      )}
    </SectionHeader>
  )
}
