'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ChangeStatus } from '@/data/project-summary'
import { CHANGE_STATUS_CONFIG, CHANGE_STATUS_CYCLE } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import type { PrefillDraft } from '../ToolContent'
import { SectionHeader } from './SectionHeader'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'
import { LinkPills } from './LinkPills'
import { AttachMenu } from './AttachMenu'

interface ChangesSectionProps {
  api: ProjectSummaryStateAPI
  commentCounts?: Map<string, number>
  /** Draft from cross-tool navigation — displayed in form, NOT persisted until explicit save */
  prefillDraft?: PrefillDraft | null
  /** Called when draft is saved or dismissed so parent can clear state */
  onDraftConsumed?: () => void
  /** Entry ID to auto-expand and scroll to (from ?focus= query param) */
  focusEntryId?: string
}

export function ChangesSection({ api, commentCounts, prefillDraft, onDraftConsumed, focusEntryId }: ChangesSectionProps) {
  const { payload, readOnly, addChange, updateChange, deleteChange, addLink, removeLink } = api
  const { changes } = payload
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  // Draft link context from prefill — held locally until explicit save
  const [draftLink, setDraftLink] = useState<PrefillDraft | null>(null)
  const focusRef = useRef<HTMLDivElement>(null)

  // When prefillDraft arrives, open the add form with prefilled values — no writes
  useEffect(() => {
    if (!prefillDraft) return
    setNewTitle(prefillDraft.title)
    setNewDescription(prefillDraft.description)
    setDraftLink(prefillDraft)
    setShowAddForm(true)
  }, [prefillDraft])

  // Auto-expand and scroll to focused entry
  useEffect(() => {
    if (!focusEntryId) return
    const exists = changes.some((c) => c.id === focusEntryId)
    if (exists) {
      setExpandedId(focusEntryId)
      // Scroll after render
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
    // If we had a draft link from prefill, attach it now that user explicitly saved
    if (changeId && draftLink) {
      addLink('changes', changeId, {
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

  function cycleStatus(change: { id: string; status: ChangeStatus }) {
    const idx = CHANGE_STATUS_CYCLE.indexOf(change.status)
    const next = CHANGE_STATUS_CYCLE[(idx + 1) % CHANGE_STATUS_CYCLE.length]
    updateChange(change.id, { status: next })
  }

  return (
    <SectionHeader
      title="Changes"
      count={changes.length}
      onAdd={() => setShowAddForm(!showAddForm)}
      addLabel="Add Change"
      readOnly={readOnly}
    >
      {changes.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/30 italic">No changes recorded yet.</p>
      )}

      <div className="space-y-2">
        {changes.map((change) => {
          const config = CHANGE_STATUS_CONFIG[change.status]
          const isExpanded = expandedId === change.id
          const commentCount = commentCounts?.get(change.id) || 0

          return (
            <div
              key={change.id}
              ref={change.id === focusEntryId ? focusRef : undefined}
              className={`rounded-lg bg-cream/[0.02] border group ${
                change.id === focusEntryId ? 'border-sandstone/30 ring-1 ring-sandstone/20' : 'border-cream/[0.04]'
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : change.id)}
              >
                <svg
                  className={`w-3 h-3 text-cream/20 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <span className="text-sm text-cream/70 flex-1 truncate">{change.title}</span>

                <StatusBadge
                  label={config.label}
                  color={config.color}
                  bgColor={config.bgColor}
                  onClick={readOnly ? undefined : () => cycleStatus(change)}
                  readOnly={readOnly}
                />

                {change.cost_impact && (
                  <span className="text-[10px] text-cream/35 shrink-0">{change.cost_impact}</span>
                )}

                {(change.attachments?.length || 0) > 0 && (
                  <span className="text-[10px] text-cream/25 shrink-0 flex items-center gap-0.5">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {change.attachments!.length}
                  </span>
                )}

                {commentCount > 0 && (
                  <span className="text-[10px] text-cream/25 shrink-0">
                    {commentCount} comment{commentCount !== 1 ? 's' : ''}
                  </span>
                )}

                {api.collectionId && (
                  <Link
                    href={`/app/tools/project-summary/${api.collectionId}/change/${change.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-[10px] text-sandstone/40 hover:text-sandstone transition-colors opacity-0 group-hover:opacity-100"
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
                        className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(change.id) }}
                      className="shrink-0 text-cream/15 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
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
                <div className="px-3 pb-3 pt-1 border-t border-cream/[0.04] space-y-2">
                  <div>
                    <label className="text-[10px] text-cream/30 block mb-0.5">Description</label>
                    <InlineEdit
                      value={change.description || ''}
                      onSave={(v) => updateChange(change.id, { description: v || undefined })}
                      placeholder="What changed?"
                      readOnly={readOnly}
                      multiline
                      displayClassName="text-xs text-cream/50"
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-cream/30 block mb-0.5">Requested By</label>
                      <InlineEdit
                        value={change.requested_by || ''}
                        onSave={(v) => updateChange(change.id, { requested_by: v || undefined })}
                        placeholder="Who requested?"
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/50"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/30 block mb-0.5">Cost Impact</label>
                      <InlineEdit
                        value={change.cost_impact || ''}
                        onSave={(v) => updateChange(change.id, { cost_impact: v || undefined })}
                        placeholder="e.g. +$2,500"
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/50"
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream/30 block mb-0.5">Schedule Impact</label>
                      <InlineEdit
                        value={change.schedule_impact || ''}
                        onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                        placeholder="e.g. adds 1 week"
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/50"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {(change.final_note || !readOnly) && (
                    <div>
                      <label className="text-[10px] text-cream/30 block mb-0.5">Note</label>
                      <InlineEdit
                        value={change.final_note || ''}
                        onSave={(v) => updateChange(change.id, { final_note: v || undefined })}
                        placeholder="Any additional notes..."
                        readOnly={readOnly}
                        displayClassName="text-xs text-cream/40"
                        className="text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <LinkPills
                      links={change.links}
                      onRemove={readOnly ? undefined : (linkId) => removeLink('changes', change.id, linkId)}
                      readOnly={readOnly}
                    />
                    <AttachMenu
                      readOnly={readOnly}
                      onAttach={(link) => addLink('changes', change.id, link)}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className={`mt-3 p-3 rounded-lg border space-y-2 ${
          draftLink ? 'border-sandstone/20 bg-sandstone/[0.04]' : 'border-cream/10 bg-cream/[0.03]'
        }`}>
          {draftLink && (
            <div className="flex items-center gap-2 text-[11px] text-sandstone/70 mb-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Draft from {draftLink.linkType === 'selection' ? 'Selections' : 'Fix List'}
              <span className="text-cream/30">— review and save</span>
            </div>
          )}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-sm text-cream/80 placeholder-cream/20 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') handleCancelAdd() }}
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-xs text-cream/60 placeholder-cream/20 outline-none focus:border-sandstone/30 resize-none"
          />
          {draftLink && (
            <div className="flex items-center gap-1.5 text-[10px] text-cream/40">
              <span className="text-cream/25">
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
              className="px-3 py-1.5 text-xs text-cream/40 hover:text-cream/60 transition-colors"
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
