'use client'

import { useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useToolState } from '@/hooks/useToolState'
import { IdeasBoard } from '../../components/IdeasBoard'
import { IdeasPackModal } from '../../components/IdeasPackModal'
import { getHeuristicsConfig, matchDecision } from '@/lib/decisionHeuristics'
import { findKitsForDecisionTitle, applyKitToDecision } from '@/lib/finish-decision-kits'
import {
  STATUS_CONFIG_V3,
  ROOM_TYPE_OPTIONS_V3,
  type DecisionV3,
  type OptionV3,
  type StatusV3,
  type RoomV3,
  type RoomTypeV3,
  type SelectionComment,
  type FinishDecisionsPayloadV3,
} from '@/data/finish-decisions'

const COMMENTS_PER_PAGE = 10
const MAX_COMMENT_LENGTH = 400

export function DecisionDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const decisionId = params.decisionId as string
  const [optionsOpen, setOptionsOpen] = useState(true)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [draftRef, setDraftRef] = useState<{ optionId: string; optionLabel: string } | null>(null)
  const [ideasPackOpen, setIdeasPackOpen] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  const { state, setState, isLoaded, readOnly } = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })

  const v3State =
    state.version === 3
      ? (state as FinishDecisionsPayloadV3)
      : { version: 3 as const, rooms: [] }

  // Find the room and decision
  let foundRoom: RoomV3 | undefined
  let foundDecision: DecisionV3 | undefined

  for (const room of v3State.rooms) {
    const decision = room.decisions.find((d) => d.id === decisionId)
    if (decision) {
      foundRoom = room
      foundDecision = decision
      break
    }
  }

  const updateDecision = (updates: Partial<DecisionV3>) => {
    if (!foundRoom) return
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) =>
        r.id === foundRoom!.id
          ? {
              ...r,
              decisions: r.decisions.map((d) =>
                d.id === decisionId
                  ? { ...d, ...updates, updatedAt: new Date().toISOString() }
                  : d
              ),
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }))
  }

  const addOption = () => {
    if (!foundDecision) return
    updateDecision({
      options: [
        ...foundDecision.options,
        {
          id: crypto.randomUUID(),
          name: '',
          notes: '',
          urls: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })
  }

  const updateOption = (optionId: string, updates: Partial<OptionV3>) => {
    if (!foundDecision) return
    updateDecision({
      options: foundDecision.options.map((opt) =>
        opt.id === optionId
          ? { ...opt, ...updates, updatedAt: new Date().toISOString() }
          : opt
      ),
    })
  }

  const deleteOption = (optionId: string) => {
    if (!foundDecision) return
    if (confirm('Delete this selection?')) {
      updateDecision({
        options: foundDecision.options.filter((opt) => opt.id !== optionId),
      })
    }
  }

  const selectOption = (optionId: string) => {
    if (!foundDecision) return
    updateDecision({
      options: foundDecision.options.map((opt) => ({
        ...opt,
        isSelected: opt.id === optionId,
        updatedAt: new Date().toISOString(),
      })),
    })
  }

  const addComment = (comment: {
    text: string
    authorName: string
    authorEmail: string
    refOptionId?: string
    refOptionLabel?: string
  }) => {
    if (!foundDecision) return
    const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    updateDecision({
      comments: [
        ...(foundDecision.comments || []),
        {
          id,
          text: comment.text,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          createdAt: new Date().toISOString(),
          ...(comment.refOptionId ? { refOptionId: comment.refOptionId, refOptionLabel: comment.refOptionLabel } : {}),
        },
      ],
    })
  }

  const handleStatusChange = (newStatus: StatusV3) => {
    if (!foundDecision) return
    const oldStatus = foundDecision.status
    if (oldStatus === newStatus) return

    const systemComment: SelectionComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: `Status changed: ${STATUS_CONFIG_V3[oldStatus].label} \u2192 ${STATUS_CONFIG_V3[newStatus].label}`,
      authorName: session?.user?.name || 'System',
      authorEmail: '',
      createdAt: new Date().toISOString(),
    }
    updateDecision({
      status: newStatus,
      comments: [...(foundDecision.comments || []), systemComment],
    })
  }

  function openGlobalCommentComposer() {
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => commentInputRef.current?.focus(), 300)
  }

  function handleCommentOnOption(optionId: string, optionLabel: string) {
    setDraftRef({ optionId, optionLabel })
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => commentInputRef.current?.focus(), 300)
  }

  const availableKits = foundRoom && foundDecision
    ? findKitsForDecisionTitle(foundDecision.title, foundRoom.type as RoomTypeV3)
    : []

  function handleApplyKitToDecision(kit: import('@/data/finish-decision-kits').FinishDecisionKit) {
    if (!foundDecision) return
    const result = applyKitToDecision(foundDecision, kit)
    updateDecision({ options: result.decision.options })
  }

  const deleteDecision = () => {
    if (!foundRoom || !foundDecision) return
    if (confirm(`Delete "${foundDecision.title}"? This will also delete all selections.`)) {
      setState((prev) => ({
        ...prev,
        rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) =>
          r.id === foundRoom!.id
            ? {
                ...r,
                decisions: r.decisions.filter((d) => d.id !== decisionId),
                updatedAt: new Date().toISOString(),
              }
            : r
        ),
      }))
      router.push('/app/tools/finish-decisions')
    }
  }

  if (!isLoaded) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center py-12 text-cream/50">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!foundDecision || !foundRoom) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/app/tools/finish-decisions')}
            className="text-sandstone hover:text-sandstone-light text-sm mb-6"
          >
            ← Back to Selections
          </button>
          <div className="bg-basalt-50 rounded-card p-12 text-center">
            <p className="text-cream/50 mb-4">Selection not found.</p>
            <Button onClick={() => router.push('/app/tools/finish-decisions')}>
              Go to Selections List
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const roomTypeLabel = ROOM_TYPE_OPTIONS_V3.find((t) => t.value === foundRoom.type)?.label

  // eslint-disable-next-line react/no-unstable-nested-components -- colocated for clarity
  function GuidancePanel({
    decision,
    roomType,
    onDismiss,
  }: {
    decision: DecisionV3
    roomType: string
    onDismiss: (key: string) => void
  }) {
    const [collapsed, setCollapsed] = useState(true)
    const config = getHeuristicsConfig()
    const selectedOption = decision.options.find((opt) => opt.isSelected)

    const result = useMemo(
      () =>
        matchDecision(
          config,
          decision.title,
          roomType,
          selectedOption?.name,
          decision.dismissedSuggestionKeys
        ),
      [config, decision.title, roomType, selectedOption?.name, decision.dismissedSuggestionKeys]
    )

    const tipCount =
      result.milestones.length + result.impacts.length + result.advice.length
    const hasContent = tipCount > 0

    if (!hasContent) return null

    return (
      <div className="mb-8 bg-basalt-50 rounded-card border border-sandstone/10 overflow-hidden">
        {/* Clickable header — always visible */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-basalt-50/80 transition-colors"
        >
          <h3 className="text-sm font-medium text-sandstone">
            Guidance{collapsed ? ` — ${tipCount} tip${tipCount !== 1 ? 's' : ''}` : ''}
          </h3>
          <span className="text-cream/30 text-xs">{collapsed ? '▶' : '▼'}</span>
        </button>

        {/* Expandable content */}
        {!collapsed && (
          <div className="px-4 pb-4 space-y-3">
            {/* Timing / Milestones */}
            {result.milestones.length > 0 && (
              <div>
                <span className="text-xs text-cream/50 uppercase tracking-wide">Timing</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {result.milestones.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 bg-sandstone/15 text-sandstone text-xs px-2.5 py-1 rounded-full"
                    >
                      {m.label}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDismiss(`m:${m.id}`) }}
                        className="text-sandstone/30 hover:text-sandstone/60 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coordination Impacts */}
            {result.impacts.length > 0 && (
              <div>
                <span className="text-xs text-cream/50 uppercase tracking-wide">
                  Coordination watchouts
                </span>
                <ul className="mt-1.5 space-y-1">
                  {result.impacts.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center justify-between text-sm text-cream/70"
                    >
                      <span>• {i.label}</span>
                      <button
                        onClick={() => onDismiss(`i:${i.id}`)}
                        className="text-cream/20 hover:text-cream/50 text-xs ml-2 shrink-0"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advice */}
            {result.advice.length > 0 && (
              <div>
                <span className="text-xs text-cream/50 uppercase tracking-wide">Advice</span>
                <ul className="mt-1.5 space-y-1.5">
                  {result.advice.map((a) => (
                    <li
                      key={a.key}
                      className="flex items-start justify-between text-sm text-cream/60"
                    >
                      <span className="leading-relaxed">{a.text}</span>
                      <button
                        onClick={() => onDismiss(a.key)}
                        className="text-cream/20 hover:text-cream/50 text-xs ml-2 shrink-0 mt-0.5"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pt-20 md:pt-24 pb-36 md:pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.push('/app/tools/finish-decisions')}
          className="text-sandstone hover:text-sandstone-light text-sm mb-4"
        >
          ← Back to Selections
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="default" className="text-xs">
              {foundRoom.name}
            </Badge>
            {roomTypeLabel && roomTypeLabel.toLowerCase() !== foundRoom.name.toLowerCase() && (
              <Badge variant="default" className="text-xs">
                {roomTypeLabel}
              </Badge>
            )}
          </div>

          {/* Title: click-to-edit on mobile, always-editable on desktop */}
          <div className="hidden md:block">
            <Input
              value={foundDecision.title}
              onChange={(e) => updateDecision({ title: e.target.value })}
              className="text-2xl font-serif"
              readOnly={readOnly}
            />
          </div>
          <div className="md:hidden">
            {editingTitle ? (
              <Input
                autoFocus
                value={foundDecision.title}
                onChange={(e) => updateDecision({ title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                className="text-2xl font-serif"
                readOnly={readOnly}
              />
            ) : (
              <h1
                className="text-2xl font-serif text-cream cursor-text"
                onClick={() => !readOnly && setEditingTitle(true)}
              >
                {foundDecision.title || <span className="text-cream/30">Untitled</span>}
              </h1>
            )}
          </div>
        </div>

        {/* Status + Due Date: compact row on mobile, full sections on desktop */}
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <select
            value={foundDecision.status}
            onChange={(e) => handleStatusChange(e.target.value as StatusV3)}
            disabled={readOnly}
            className="flex-1 bg-basalt-50 text-cream rounded-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone disabled:opacity-50"
          >
            {Object.entries(STATUS_CONFIG_V3).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={foundDecision.dueDate || ''}
            onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
            disabled={readOnly}
            className="bg-basalt-50 text-cream rounded-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark] disabled:opacity-50"
          />
        </div>

        {/* Desktop: full status section */}
        <div className="hidden md:block mb-4">
          <Select
            label="Status"
            value={foundDecision.status}
            onChange={(e) => handleStatusChange(e.target.value as StatusV3)}
            options={Object.entries(STATUS_CONFIG_V3).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
            disabled={readOnly}
          />
        </div>

        {/* Desktop: full due date section */}
        <div className="hidden md:block mb-4">
          <label className="block text-sm text-cream/70 mb-1.5">Due Date</label>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="date"
              value={foundDecision.dueDate || ''}
              onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
              disabled={readOnly}
              className="bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark] disabled:opacity-50"
            />
            {!readOnly && foundDecision.dueDate && (
              <button
                onClick={() => updateDecision({ dueDate: null })}
                className="text-xs text-cream/40 hover:text-cream/70"
              >
                Clear
              </button>
            )}
          </div>
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Next week', days: 7 },
                { label: 'In two weeks', days: 14 },
                { label: 'In a month', days: 30 },
                { label: 'In several months', days: 90 },
              ].map((chip) => {
                const target = new Date()
                target.setDate(target.getDate() + chip.days)
                const iso = target.toISOString().split('T')[0]
                const isActive = foundDecision.dueDate === iso

                return (
                  <button
                    key={chip.label}
                    onClick={() => updateDecision({ dueDate: iso })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                        : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                    }`}
                  >
                    {chip.label}
                  </button>
                )
              })}
              <button
                onClick={() => updateDecision({ dueDate: null })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  foundDecision.dueDate === null || foundDecision.dueDate === undefined
                    ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                    : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                }`}
              >
                TBD
              </button>
            </div>
          )}
        </div>

        {/* Notes: collapsed on mobile, full on desktop */}
        <div className="mb-8">
          {/* Desktop: full textarea */}
          <div className="hidden md:block">
            <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
            <textarea
              value={foundDecision.notes}
              onChange={(e) => updateDecision({ notes: e.target.value })}
              readOnly={readOnly}
              className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[120px]"
              placeholder="General notes about this decision..."
            />
          </div>
          {/* Mobile: collapsed preview */}
          <div className="md:hidden">
            {notesExpanded ? (
              <>
                <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
                <textarea
                  autoFocus
                  value={foundDecision.notes}
                  onChange={(e) => updateDecision({ notes: e.target.value })}
                  readOnly={readOnly}
                  className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[100px]"
                  placeholder="General notes about this decision..."
                />
                <button
                  type="button"
                  onClick={() => setNotesExpanded(false)}
                  className="text-xs text-cream/40 mt-1"
                >
                  Collapse
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setNotesExpanded(true)}
                className="w-full text-left"
              >
                {foundDecision.notes ? (
                  <p className="text-sm text-cream/50 line-clamp-2">{foundDecision.notes}</p>
                ) : (
                  <p className="text-sm text-cream/30 italic">Add notes...</p>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Ideas board (collapsible) */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setOptionsOpen(!optionsOpen)}
              className="flex items-center gap-2 text-lg font-medium text-cream hover:text-cream/80 transition-colors"
            >
              <span className="text-cream/30 text-xs">{optionsOpen ? '▼' : '▶'}</span>
              Ideas{foundDecision.options.length > 0 ? ` — ${foundDecision.options.length}` : ''}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => router.push('/app/save-from-web')}
                className="text-xs text-sandstone hover:text-sandstone-light transition-colors font-medium"
              >
                + Save from web
              </button>
            )}
            {!readOnly && availableKits.length > 0 && (
              <button
                type="button"
                onClick={() => setIdeasPackOpen(true)}
                className="text-xs text-sandstone hover:text-sandstone-light transition-colors font-medium"
              >
                + Add ideas from pack
              </button>
            )}
          </div>

          <IdeasBoard
            decision={foundDecision}
            readOnly={readOnly}
            showContent={optionsOpen}
            userEmail={session?.user?.email || ''}
            userName={session?.user?.name || 'Unknown'}
            activeCardId={activeCardId}
            setActiveCardId={setActiveCardId}
            onAddOption={(opt) => updateDecision({ options: [...foundDecision.options, opt] })}
            onUpdateOption={updateOption}
            onDeleteOption={(id) => {
              updateDecision({ options: foundDecision.options.filter((o) => o.id !== id) })
            }}
            onSelectOption={selectOption}
            onUpdateDecision={updateDecision}
            onAddComment={addComment}
            onCommentOnOption={handleCommentOnOption}
            onOpenGlobalComment={openGlobalCommentComposer}
            comments={foundDecision.comments || []}
          />
        </div>

        {/* Comments */}
        <div className="mb-8">
          <CommentsSection
            comments={foundDecision.comments || []}
            onAddComment={addComment}
            readOnly={readOnly}
            commentInputRef={commentInputRef}
            draftRef={draftRef}
            onClearDraftRef={() => setDraftRef(null)}
            onOpenCard={(optId) => {
              setOptionsOpen(true)
              setActiveCardId(optId)
            }}
          />
        </div>

        {/* Guidance Panel — at the bottom */}
        <GuidancePanel
          decision={foundDecision}
          roomType={foundRoom.type}
          onDismiss={(key) => {
            updateDecision({
              dismissedSuggestionKeys: [
                ...(foundDecision.dismissedSuggestionKeys || []),
                key,
              ],
            })
          }}
        />

        {/* Delete Selection */}
        {!readOnly && (
          <div className="pt-6 border-t border-cream/10">
            <Button variant="danger" onClick={deleteDecision}>
              Delete Selection
            </Button>
          </div>
        )}
      </div>

      {/* Ideas Pack Modal (decision-level) */}
      {ideasPackOpen && foundRoom && (
        <IdeasPackModal
          roomType={foundRoom.type as RoomTypeV3}
          roomName={foundRoom.name}
          decisionTitle={foundDecision.title}
          appliedKitIds={foundRoom.appliedKitIds || []}
          onApply={handleApplyKitToDecision}
          onClose={() => setIdeasPackOpen(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comments Components
// ---------------------------------------------------------------------------

function CommentsSection({
  comments,
  onAddComment,
  readOnly,
  commentInputRef,
  draftRef,
  onClearDraftRef,
  onOpenCard,
}: {
  comments: SelectionComment[]
  onAddComment: (comment: { text: string; authorName: string; authorEmail: string; refOptionId?: string; refOptionLabel?: string }) => void
  readOnly: boolean
  commentInputRef?: React.RefObject<HTMLTextAreaElement | null>
  draftRef?: { optionId: string; optionLabel: string } | null
  onClearDraftRef?: () => void
  onOpenCard?: (optionId: string) => void
}) {
  const [page, setPage] = useState(0)
  const allComments = [...comments].reverse()
  const totalPages = Math.max(1, Math.ceil(allComments.length / COMMENTS_PER_PAGE))
  const pageComments = allComments.slice(page * COMMENTS_PER_PAGE, (page + 1) * COMMENTS_PER_PAGE)

  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-cream/30 mb-1">
        Comments {allComments.length > 0 && `(${allComments.length})`}
      </h3>
      <p className="text-[11px] text-cream/20 mb-3">
        Comments are shared with collaborators who can access this tool.
      </p>

      {!readOnly && <CommentInput onAddComment={onAddComment} inputRef={commentInputRef} draftRef={draftRef} onClearDraftRef={onClearDraftRef} />}

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
            <p className="text-sm text-cream/50 whitespace-pre-wrap">
              {comment.refOptionId && comment.refOptionLabel && (
                <button
                  type="button"
                  onClick={() => onOpenCard?.(comment.refOptionId!)}
                  className="inline-flex items-center gap-0.5 mr-1.5 px-1.5 py-0.5 bg-sandstone/10 text-sandstone/80 hover:text-sandstone text-[11px] rounded-full transition-colors align-middle"
                >
                  ↗ Re: {comment.refOptionLabel}
                </button>
              )}
              {comment.text}
            </p>
          </div>
        ))}
      </div>

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

function CommentInput({
  onAddComment,
  inputRef,
  draftRef,
  onClearDraftRef,
}: {
  onAddComment: (comment: { text: string; authorName: string; authorEmail: string; refOptionId?: string; refOptionLabel?: string }) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  draftRef?: { optionId: string; optionLabel: string } | null
  onClearDraftRef?: () => void
}) {
  const { data: session } = useSession()
  const [text, setText] = useState('')

  function handleSubmit() {
    if (!text.trim() || !session?.user) return
    onAddComment({
      text: text.trim().slice(0, MAX_COMMENT_LENGTH),
      authorName: session.user.name || 'Unknown',
      authorEmail: session.user.email || '',
      ...(draftRef ? { refOptionId: draftRef.optionId, refOptionLabel: draftRef.optionLabel } : {}),
    })
    setText('')
    onClearDraftRef?.()
  }

  return (
    <div>
      {/* Draft ref pill */}
      {draftRef && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sandstone/15 text-sandstone text-xs rounded-full">
            Re: {draftRef.optionLabel}
            <button
              type="button"
              onClick={() => onClearDraftRef?.()}
              className="text-sandstone/50 hover:text-sandstone ml-0.5"
            >
              ×
            </button>
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={draftRef ? `Comment on ${draftRef.optionLabel}...` : 'Add a comment...'}
          maxLength={MAX_COMMENT_LENGTH}
          className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 resize-none"
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
