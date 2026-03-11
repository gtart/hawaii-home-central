'use client'

import { useState } from 'react'
import type { AlignmentItem, AlignmentItemStatus, AlignmentItemType, CostImpactStatus, ScheduleImpactStatus, WaitingOnRole } from '@/data/alignment'
import type { RefEntity } from '@/components/app/CommentThread'
import type { AlignmentStateAPI } from '../useAlignmentState'
import { STATUS_CONFIG, TYPE_CONFIG, COST_IMPACT_CONFIG, SCHEDULE_IMPACT_CONFIG, WAITING_ON_CONFIG } from '../constants'
import { ArtifactLinkSection } from './ArtifactLinkSection'
import { EvidencePhotos } from './EvidencePhotos'
import { GuestResponseCard } from './GuestResponseCard'

interface Props {
  item: AlignmentItem
  api: AlignmentStateAPI
  collectionId?: string
  onBack: () => void
  onOpenComments?: (ref?: RefEntity) => void
  commentCount: number
}

export function AlignmentItemDetail({ item, api, collectionId, onBack, onOpenComments, commentCount }: Props) {
  const { readOnly } = api
  const statusCfg = STATUS_CONFIG[item.status]
  const typeCfg = TYPE_CONFIG[item.type]

  // Collapsible sections
  const [showOriginal, setShowOriginal] = useState(!!item.original_expectation)
  const [showProposed, setShowProposed] = useState(!!item.proposed_resolution)
  const [showDelete, setShowDelete] = useState(false)

  // Editable state for inline editing
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function startEdit(field: string, value: string) {
    if (readOnly) return
    setEditingField(field)
    setEditValue(value)
  }

  function saveEdit(field: string) {
    if (editValue.trim() !== (item as unknown as Record<string, unknown>)[field]) {
      api.updateItem(item.id, { [field]: editValue.trim() } as Partial<AlignmentItem>)
    }
    setEditingField(null)
  }

  function handleStatusChange(status: AlignmentItemStatus) {
    api.updateItem(item.id, { status })
  }

  function handleDelete() {
    api.deleteItem(item.id)
    onBack()
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-cream/40 hover:text-cream/70 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to list
      </button>

      {/* ── 1. Header ── */}
      <div className="flex items-start gap-3">
        <span className="text-sm text-cream/30 font-mono mt-1 shrink-0">#{item.itemNumber}</span>
        <div className="flex-1 min-w-0">
          {editingField === 'title' ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit('title')}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit('title'); if (e.key === 'Escape') setEditingField(null) }}
              className="w-full text-lg font-serif text-cream bg-transparent border-b border-sandstone/40 focus:outline-none py-0.5"
              autoFocus
            />
          ) : (
            <h2
              className={`text-lg font-serif text-cream ${!readOnly ? 'cursor-pointer hover:text-sandstone transition-colors' : ''}`}
              onClick={() => startEdit('title', item.title)}
            >
              {item.title}
            </h2>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-[11px] text-cream/40 bg-cream/5 px-2 py-0.5 rounded-full">{typeCfg.label}</span>
            {item.area_label && (
              <span className="text-[11px] text-cream/30">{item.area_label}</span>
            )}
            {item.waiting_on_role !== 'none' && (
              <span className="text-[11px] text-cream/50">
                Waiting on: <span className="text-cream/70">{WAITING_ON_CONFIG[item.waiting_on_role].label}</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenComments && (
              <button
                type="button"
                onClick={() => onOpenComments({ id: item.id, label: item.title })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-cream/40 hover:text-cream/60 bg-cream/5 hover:bg-cream/8 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {commentCount > 0 && commentCount}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Current Agreed Answer — PROMINENT ── */}
      <div className="rounded-xl border-2 border-emerald-400/20 bg-emerald-400/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Current Agreed Answer</h3>
          {!readOnly && item.current_agreed_answer && editingField !== 'current_agreed_answer' && (
            <button
              type="button"
              onClick={() => startEdit('current_agreed_answer', item.current_agreed_answer)}
              className="text-[10px] text-emerald-400/50 hover:text-emerald-400 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        {editingField === 'current_agreed_answer' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => saveEdit('current_agreed_answer')}
            rows={3}
            className="w-full bg-transparent border border-emerald-400/20 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none focus:border-emerald-400/40 resize-none"
            autoFocus
          />
        ) : item.current_agreed_answer ? (
          <p className="text-sm text-cream leading-relaxed">{item.current_agreed_answer}</p>
        ) : (
          <button
            type="button"
            onClick={() => startEdit('current_agreed_answer', '')}
            disabled={readOnly}
            className="text-sm text-emerald-400/40 hover:text-emerald-400/60 italic transition-colors disabled:cursor-default"
          >
            {readOnly ? 'No agreed answer yet' : 'Click to add the current agreed answer...'}
          </button>
        )}
      </div>

      {/* ── 3. Current Issue ── */}
      <Section
        title="Current Issue"
        value={item.current_issue}
        fieldKey="current_issue"
        editingField={editingField}
        editValue={editValue}
        readOnly={readOnly}
        onStartEdit={startEdit}
        onSaveEdit={saveEdit}
        onChangeValue={setEditValue}
        onCancel={() => setEditingField(null)}
      />

      {/* ── 4. Original Expectation — collapsible ── */}
      <CollapsibleSection
        title="Original Expectation"
        isOpen={showOriginal}
        onToggle={() => setShowOriginal(!showOriginal)}
        hasContent={!!item.original_expectation}
      >
        <Section
          value={item.original_expectation}
          fieldKey="original_expectation"
          editingField={editingField}
          editValue={editValue}
          readOnly={readOnly}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onChangeValue={setEditValue}
          onCancel={() => setEditingField(null)}
          placeholder="What was originally understood or agreed?"
        />
      </CollapsibleSection>

      {/* ── 5. Proposed Resolution — collapsible ── */}
      <CollapsibleSection
        title="Proposed Resolution"
        isOpen={showProposed}
        onToggle={() => setShowProposed(!showProposed)}
        hasContent={!!item.proposed_resolution}
      >
        <Section
          value={item.proposed_resolution}
          fieldKey="proposed_resolution"
          editingField={editingField}
          editValue={editValue}
          readOnly={readOnly}
          onStartEdit={startEdit}
          onSaveEdit={saveEdit}
          onChangeValue={setEditValue}
          onCancel={() => setEditingField(null)}
          placeholder="What do you think should happen?"
        />
      </CollapsibleSection>

      {/* ── 6. Cost / Schedule Impact ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-cream/8 bg-basalt-50 p-4">
          <h4 className="text-xs font-medium text-cream/40 mb-2">Cost Impact</h4>
          {readOnly ? (
            <div>
              <span className={`text-sm font-medium ${COST_IMPACT_CONFIG[item.cost_impact_status].className}`}>
                {COST_IMPACT_CONFIG[item.cost_impact_status].label}
              </span>
              {item.cost_impact_amount_text && (
                <span className="text-sm text-cream/60 ml-2">{item.cost_impact_amount_text}</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={item.cost_impact_status}
                onChange={(e) => api.updateItem(item.id, { cost_impact_status: e.target.value as CostImpactStatus })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
              >
                {Object.entries(COST_IMPACT_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={item.cost_impact_amount_text}
                onChange={(e) => api.updateItem(item.id, { cost_impact_amount_text: e.target.value })}
                placeholder="$800, TBD, included..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
              />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-cream/8 bg-basalt-50 p-4">
          <h4 className="text-xs font-medium text-cream/40 mb-2">Schedule Impact</h4>
          {readOnly ? (
            <div>
              <span className={`text-sm font-medium ${SCHEDULE_IMPACT_CONFIG[item.schedule_impact_status].className}`}>
                {SCHEDULE_IMPACT_CONFIG[item.schedule_impact_status].label}
              </span>
              {item.schedule_impact_text && (
                <span className="text-sm text-cream/60 ml-2">{item.schedule_impact_text}</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={item.schedule_impact_status}
                onChange={(e) => api.updateItem(item.id, { schedule_impact_status: e.target.value as ScheduleImpactStatus })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
              >
                {Object.entries(SCHEDULE_IMPACT_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={item.schedule_impact_text}
                onChange={(e) => api.updateItem(item.id, { schedule_impact_text: e.target.value })}
                placeholder="+2 days, TBD..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── 7. Related Artifacts ── */}
      <ArtifactLinkSection item={item} api={api} />

      {/* ── 8. Evidence / Photos ── */}
      <EvidencePhotos item={item} api={api} collectionId={collectionId} />

      {/* ── 9. Guest Responses ── */}
      {item.guest_responses.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-cream/40 mb-3">
            Contractor Responses ({item.guest_responses.length})
          </h3>
          <div className="space-y-3">
            {item.guest_responses.map((resp) => (
              <GuestResponseCard key={resp.id} response={resp} />
            ))}
          </div>
        </div>
      )}

      {/* ── Status / metadata controls ── */}
      {!readOnly && (
        <div className="rounded-xl border border-cream/8 bg-basalt-50 p-4 space-y-3">
          <h4 className="text-xs font-medium text-cream/40 mb-2">Item Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-cream/30 mb-1">Status</label>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(e.target.value as AlignmentItemStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-cream/30 mb-1">Type</label>
              <select
                value={item.type}
                onChange={(e) => api.updateItem(item.id, { type: e.target.value as AlignmentItemType })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
              >
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-cream/30 mb-1">Waiting On</label>
              <select
                value={item.waiting_on_role}
                onChange={(e) => api.updateItem(item.id, { waiting_on_role: e.target.value as WaitingOnRole })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40"
              >
                {Object.entries(WAITING_ON_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-cream/30 mb-1">Area</label>
            <input
              type="text"
              value={item.area_label}
              onChange={(e) => api.updateItem(item.id, { area_label: e.target.value })}
              placeholder="Kitchen, Master Bath..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40"
            />
          </div>
          <div>
            <label className="block text-[11px] text-cream/30 mb-1">Summary</label>
            <textarea
              value={item.summary}
              onChange={(e) => api.updateItem(item.id, { summary: e.target.value })}
              placeholder="Brief summary of this alignment item..."
              rows={2}
              className="w-full px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/10 text-cream text-sm placeholder:text-cream/20 focus:outline-none focus:border-sandstone/40 resize-none"
            />
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-cream/8">
            {showDelete ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-red-400">Delete this item permanently?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDelete(false)}
                  className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
              >
                Delete item...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-[11px] text-cream/20 flex items-center gap-4">
        <span>Created {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span>Updated {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        {item.resolved_at && (
          <span>Resolved {new Date(item.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──

function Section({
  title,
  value,
  fieldKey,
  editingField,
  editValue,
  readOnly,
  onStartEdit,
  onSaveEdit,
  onChangeValue,
  onCancel,
  placeholder,
}: {
  title?: string
  value: string
  fieldKey: string
  editingField: string | null
  editValue: string
  readOnly: boolean
  onStartEdit: (field: string, value: string) => void
  onSaveEdit: (field: string) => void
  onChangeValue: (v: string) => void
  onCancel: () => void
  placeholder?: string
}) {
  const isEditing = editingField === fieldKey

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-cream/40">{title}</h3>
          {!readOnly && value && !isEditing && (
            <button
              type="button"
              onClick={() => onStartEdit(fieldKey, value)}
              className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}
      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={() => onSaveEdit(fieldKey)}
          onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-basalt border border-cream/10 text-cream text-sm focus:outline-none focus:border-sandstone/40 resize-none"
          autoFocus
        />
      ) : value ? (
        <p
          className={`text-sm text-cream/80 leading-relaxed whitespace-pre-wrap ${!readOnly ? 'cursor-pointer hover:text-cream transition-colors' : ''}`}
          onClick={() => !readOnly && onStartEdit(fieldKey, value)}
        >
          {value}
        </p>
      ) : !readOnly ? (
        <button
          type="button"
          onClick={() => onStartEdit(fieldKey, '')}
          className="text-sm text-cream/25 hover:text-cream/40 italic transition-colors"
        >
          {placeholder || 'Click to add...'}
        </button>
      ) : null}
    </div>
  )
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  hasContent,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  hasContent: boolean
  children: React.ReactNode
}) {
  return (
    <div className="border border-cream/8 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream/[0.02] transition-colors"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-cream/40">{title}</span>
        <div className="flex items-center gap-2">
          {!isOpen && !hasContent && (
            <span className="text-[10px] text-cream/20">Empty</span>
          )}
          <svg className={`w-4 h-4 text-cream/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}
