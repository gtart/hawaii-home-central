'use client'

import { useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import { useToolState } from '@/hooks/useToolState'
import { IdeasBoard, AddIdeaMenu, type IdeasBoardAddActions } from '../../components/IdeasBoard'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { IdeasPackModal } from '../../components/IdeasPackModal'
import { getHeuristicsConfig, matchDecision } from '@/lib/decisionHeuristics'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForDecisionTitle, applyKitToDecision } from '@/lib/finish-decision-kits'
import {
  STATUS_CONFIG_V3,
  ROOM_EMOJI_MAP,
  type DecisionV3,
  type OptionV3,
  type StatusV3,
  type StatusLogEntry,
  type RoomV3,
  type RoomTypeV3,
  type SelectionComment,
  type FinishDecisionsPayloadV3,
} from '@/data/finish-decisions'
import { isUncategorized, ensureUncategorizedDecision, findUncategorizedDecision, moveOption as moveOptionHelper } from '@/lib/decisionHelpers'
import { MoveIdeaSheet } from '../../components/MoveIdeaSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { relativeTime } from '@/lib/relativeTime'

const COMMENTS_PER_PAGE = 10
const MAX_COMMENT_LENGTH = 400

function truncateLabel(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

export function DecisionDetailContent({
  kits = [],
  emojiMap = {},
}: {
  kits?: FinishDecisionKit[]
  emojiMap?: Record<string, string>
}) {
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
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [moveOptionId, setMoveOptionId] = useState<string | null>(null)
  const [assignToast, setAssignToast] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const addActionsRef = useRef<IdeasBoardAddActions | null>(null)

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
    if (confirm('Delete this option?')) {
      updateDecision({
        options: foundDecision.options.filter((opt) => opt.id !== optionId),
      })
    }
  }

  const selectOption = (optionId: string) => {
    if (!foundDecision) return
    // Uncategorized selections cannot have a "Final" pick
    if (isUncategorized(foundDecision)) return

    const alreadySelected = foundDecision.options.find((o) => o.id === optionId)?.isSelected
    const isToggleOff = !!alreadySelected
    const userName = session?.user?.name || 'Unknown'
    const now = new Date().toISOString()

    const updates: Partial<DecisionV3> = {
      options: foundDecision.options.map((opt) => ({
        ...opt,
        isSelected: isToggleOff ? false : opt.id === optionId,
        updatedAt: now,
      })),
      finalSelection: isToggleOff
        ? null
        : { optionId, selectedBy: userName, selectedAt: now },
    }

    // Auto-update status unless already Ordered or Done
    const st = foundDecision.status
    if (st !== 'ordered' && st !== 'done') {
      updates.status = isToggleOff ? 'deciding' : 'selected'
      // Also log status change
      const newStatus = isToggleOff ? 'deciding' : 'selected'
      updates.statusLog = [
        ...(foundDecision.statusLog || []),
        { status: newStatus as StatusV3, markedBy: userName, markedAt: now },
      ]
    }

    updateDecision(updates)
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
    // Uncategorized selections stay in "deciding" status
    if (isUncategorized(foundDecision)) return
    const oldStatus = foundDecision.status
    if (oldStatus === newStatus) return

    const userName = session?.user?.name || 'Unknown'
    const now = new Date().toISOString()

    updateDecision({
      status: newStatus,
      statusLog: [
        ...(foundDecision.statusLog || []),
        { status: newStatus, markedBy: userName, markedAt: now },
      ],
    })
  }

  function openGlobalCommentComposer() {
    setCommentsOpen(true)
    setTimeout(() => commentInputRef.current?.focus(), 300)
  }

  function handleCommentOnOption(optionId: string, optionLabel: string) {
    setDraftRef({ optionId, optionLabel })
    setCommentsOpen(true)
    setTimeout(() => commentInputRef.current?.focus(), 300)
  }

  const availableKits = foundRoom && foundDecision
    ? findKitsForDecisionTitle(kits, foundDecision.title, foundRoom.type as RoomTypeV3)
    : []

  function handleApplyKitToDecision(kit: import('@/data/finish-decision-kits').FinishDecisionKit, _targetRoomId?: string) {
    if (!foundDecision) return
    const result = applyKitToDecision(foundDecision, kit)
    updateDecision({ options: result.decision.options })
  }

  function moveOptionCrossRoom(
    optionId: string,
    targetRoomId: string,
    targetDecisionId: string | null,
    newSelectionTitle?: string,
  ) {
    if (!foundRoom || !foundDecision) return

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV3
      const updated = moveOptionHelper(
        payload.rooms,
        foundRoom!.id,
        foundDecision!.id,
        optionId,
        targetRoomId,
        targetDecisionId,
        newSelectionTitle,
      )
      return { ...payload, rooms: updated }
    })

    const targetRoom = v3State.rooms.find((r) => r.id === targetRoomId)
    const targetName = newSelectionTitle
      || targetRoom?.decisions.find((d) => d.id === targetDecisionId)?.title
      || 'Uncategorized'
    const roomName = targetRoom?.name || 'Room'
    setAssignToast(`Moved to ${roomName} → ${targetName}`)
    setMoveOptionId(null)
    setActiveCardId(null)
    setTimeout(() => setAssignToast(null), 3000)
  }

  function handleImportToDecision(
    targetRoomId: string,
    targetDecisionId: string | null,
    newTitle: string | undefined,
    result: { name: string; notes: string; sourceUrl: string; selectedImages: import('@/data/finish-decisions').OptionImageV3[] }
  ) {
    const now = new Date().toISOString()
    const firstImage = result.selectedImages[0]
    const newOption: OptionV3 = {
      id: crypto.randomUUID(),
      kind: firstImage ? 'image' : 'text',
      name: result.name,
      notes: result.notes,
      urls: result.sourceUrl ? [{ id: crypto.randomUUID(), url: result.sourceUrl, linkImage: firstImage?.url }] : [],
      images: result.selectedImages.length > 0 ? result.selectedImages : undefined,
      heroImageId: firstImage?.id || null,
      imageUrl: firstImage?.url,
      thumbnailUrl: firstImage?.url,
      createdAt: now,
      updatedAt: now,
    }

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV3
      let finalDecisionId = targetDecisionId

      const newRooms = payload.rooms.map((r) => {
        if (r.id !== targetRoomId) return r

        let decisions = r.decisions
        // If creating a new selection
        if (!finalDecisionId && newTitle) {
          const newDecision: DecisionV3 = {
            id: crypto.randomUUID(),
            title: newTitle,
            status: 'deciding' as StatusV3,
            notes: '',
            options: [],
            createdAt: now,
            updatedAt: now,
          }
          finalDecisionId = newDecision.id
          decisions = [...decisions, newDecision]
        }

        // If still no target, fall back to uncategorized
        if (!finalDecisionId) {
          const roomWithUncat = ensureUncategorizedDecision({ ...r, decisions })
          decisions = roomWithUncat.decisions
          const uncat = findUncategorizedDecision(roomWithUncat)
          finalDecisionId = uncat?.id || null
        }

        return {
          ...r,
          decisions: decisions.map((d) =>
            d.id === finalDecisionId
              ? { ...d, options: [...d.options, newOption], updatedAt: now }
              : d
          ),
          updatedAt: now,
        }
      })

      return { ...payload, rooms: newRooms }
    })

    // Show toast
    const targetRoom = v3State.rooms.find((r) => r.id === targetRoomId)
    const roomName = targetRoom?.name || 'Room'
    const selectionName = newTitle || targetRoom?.decisions.find((d) => d.id === targetDecisionId)?.title || 'Uncategorized'
    setAssignToast(`Saved to ${roomName} → ${selectionName}`)
    setTimeout(() => setAssignToast(null), 4000)
  }

  const deleteDecision = () => {
    if (!foundRoom || !foundDecision) return
    if (confirm(`Delete "${foundDecision.title}"? This decision and all its options will be permanently deleted.`)) {
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
            ← Back to Decisions
          </button>
          <div className="bg-basalt-50 rounded-card p-12 text-center">
            <p className="text-cream/50">Decision not found.</p>
          </div>
        </div>
      </div>
    )
  }

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

  const isSystemUncategorized = isUncategorized(foundDecision)
  // Filter: only show user comments (non-empty authorEmail), not system comments
  const userComments = (foundDecision.comments || []).filter((c) => c.authorEmail !== '')
  const commentCount = userComments.length
  const lastUserComment = [...userComments].reverse()[0]
  const statusCfg = STATUS_CONFIG_V3[foundDecision.status]
  const formattedDue = foundDecision.dueDate
    ? new Date(foundDecision.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const finalPick = foundDecision.options.find((o) => o.isSelected)
  const optionsCount = foundDecision.options.length
  // Latest status log entry (for "Marked X by Y on Z" line)
  const latestStatusLog = foundDecision.statusLog?.length
    ? foundDecision.statusLog[foundDecision.statusLog.length - 1]
    : null
  // Done without final warning
  const doneWithoutFinal = foundDecision.status === 'done' && !finalPick

  return (
    <div className="pt-20 md:pt-24 pb-36 md:pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.push(`/app/tools/finish-decisions/room/${foundRoom.id}`)}
          className="inline-flex items-center gap-1.5 text-sandstone hover:text-sandstone-light text-sm mb-4"
        >
          <span>←</span>
          <span>Back to Room Decisions:</span>
          <span className="inline-flex items-center gap-1 bg-cream/10 rounded-full px-2 py-0.5 text-cream/60 text-xs">
            {ROOM_EMOJI_MAP[foundRoom.type as RoomTypeV3] || '📁'} {foundRoom.name}
          </span>
        </button>

        {/* Desktop header: title + status + due in one row */}
        <div className="hidden md:flex items-center gap-3 mb-2">
          <div className="flex-1">
            <Input
              value={foundDecision.title}
              onChange={(e) => updateDecision({ title: e.target.value })}
              className="text-2xl font-serif"
              readOnly={readOnly || isSystemUncategorized}
            />
          </div>
          {!isSystemUncategorized && (
            <div className="flex items-center gap-1 shrink-0">
              {Object.entries(STATUS_CONFIG_V3).map(([key, config]) => {
                const isActive = foundDecision.status === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !readOnly && handleStatusChange(key as StatusV3)}
                    disabled={readOnly}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                      isActive
                        ? config.pillClass
                        : 'bg-transparent text-cream/30 border-transparent hover:text-cream/50'
                    } disabled:cursor-default`}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          )}
          <input
            type="date"
            value={foundDecision.dueDate || ''}
            onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
            disabled={readOnly}
            className="bg-basalt-50 text-cream rounded-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark] disabled:opacity-50 shrink-0"
          />
        </div>

        {/* Mobile header: title + controls */}
        <div className="md:hidden mb-2">
          {isSystemUncategorized ? (
            <h1 className="text-2xl font-serif text-cream">Uncategorized</h1>
          ) : editingTitle ? (
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
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {!isSystemUncategorized && Object.entries(STATUS_CONFIG_V3).map(([key, config]) => {
              const isActive = foundDecision.status === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !readOnly && handleStatusChange(key as StatusV3)}
                  disabled={readOnly}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                    isActive
                      ? config.pillClass
                      : 'bg-transparent text-cream/30 border-transparent hover:text-cream/50'
                  } disabled:cursor-default`}
                >
                  {config.label}
                </button>
              )
            })}
            <input
              type="date"
              value={foundDecision.dueDate || ''}
              onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
              disabled={readOnly}
              className="bg-basalt-50 text-cream rounded-input px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark] disabled:opacity-50 ml-auto"
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-2">
          {formattedDue && (
            <>
              <span className="text-cream/40">Due {formattedDue}</span>
              <span className="text-cream/20">·</span>
            </>
          )}
          <span className="text-cream/40">
            {optionsCount} option{optionsCount !== 1 ? 's' : ''}
          </span>
          <span className="text-cream/20">·</span>
          <button
            type="button"
            onClick={openGlobalCommentComposer}
            className="inline-flex items-center gap-1.5 bg-cream/10 hover:bg-cream/15 rounded-full px-2.5 py-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-cream/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {commentCount > 0 ? (
              <>
                <span className="text-cream/60 font-medium">{commentCount}</span>
                {lastUserComment && (
                  <span className="hidden md:inline text-cream/35">
                    · {lastUserComment.authorName.split(' ')[0]} {relativeTime(lastUserComment.createdAt)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-cream/40">Comments</span>
            )}
          </button>
          {doneWithoutFinal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-medium rounded-full border border-red-400/20">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              No final selected
            </span>
          )}
        </div>

        {/* Status marked-by line */}
        {latestStatusLog && foundDecision.status !== 'deciding' && (
          <p className="text-[11px] text-cream/30 mb-4">
            Marked {STATUS_CONFIG_V3[latestStatusLog.status].label} by {latestStatusLog.markedBy} on{' '}
            {new Date(latestStatusLog.markedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}

        {/* Final Decision Section */}
        <div className="mb-6">
          {finalPick ? (() => {
            const hero = getHeroImage(finalPick)
            const heroSrc = hero?.thumbnailUrl || hero?.url
            const finalComments = userComments.filter((c) => c.refOptionId === finalPick.id)
            return (
              <div className="border border-sandstone/25 bg-sandstone/5 rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Final selection image */}
                  {heroSrc && (
                    <div className="md:w-48 md:h-auto flex-shrink-0">
                      <ImageWithFallback
                        src={displayUrl(heroSrc)}
                        alt={finalPick.name || 'Final decision'}
                        className="w-full h-48 md:h-full object-cover"
                        fallback={
                          <div className="w-full h-48 md:h-full flex items-center justify-center bg-basalt">
                            <span className="text-3xl opacity-20">🖼️</span>
                          </div>
                        }
                      />
                    </div>
                  )}

                  {/* Final selection details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] text-sandstone font-semibold">
                        Final decision selected:
                      </span>
                      <span className="text-[11px] text-cream/70 font-medium">
                        {finalPick.name || 'Untitled'}
                      </span>
                      {foundDecision.finalSelection && (
                        <>
                          <span className="text-cream/25">&middot;</span>
                          <span className="px-1.5 py-0.5 bg-cream/10 text-cream/50 text-[10px] rounded-full">
                            {foundDecision.finalSelection.selectedBy}
                          </span>
                          <span className="text-cream/25">&middot;</span>
                          <span className="text-[10px] text-cream/35">
                            {new Date(foundDecision.finalSelection.selectedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => selectOption(finalPick.id)}
                          className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors ml-auto"
                        >
                          Unselect
                        </button>
                      )}
                    </div>
                    <h3 className="font-serif text-lg text-sandstone mb-1">
                      {finalPick.name || <span className="text-sandstone/50 italic">Untitled</span>}
                    </h3>
                    {finalPick.notes && (
                      <p className="text-sm text-cream/60 whitespace-pre-wrap mb-2">{finalPick.notes}</p>
                    )}
                    {finalPick.urls && finalPick.urls.length > 0 && (
                      <div className="mb-2">
                        {finalPick.urls.map((u) => (
                          <a
                            key={u.id}
                            href={u.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sandstone/60 hover:text-sandstone underline"
                          >
                            {u.linkTitle || u.url}
                          </a>
                        ))}
                      </div>
                    )}
                    {finalComments.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-sandstone/15 space-y-2 max-h-[120px] overflow-y-auto">
                        <p className="text-[10px] text-cream/30 uppercase tracking-wide font-medium">Comments</p>
                        {finalComments.slice(-3).map((c) => (
                          <div key={c.id} className="text-xs">
                            <span className="text-cream/50 font-medium">{c.authorName}</span>
                            <span className="text-cream/20 mx-1">·</span>
                            <span className="text-cream/25">{relativeTime(c.createdAt)}</span>
                            <p className="text-cream/60 mt-0.5">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveCardId(finalPick.id)}
                      className="mt-3 text-xs text-sandstone/60 hover:text-sandstone transition-colors"
                    >
                      View full details →
                    </button>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className={`border rounded-xl p-5 text-center ${doneWithoutFinal ? 'border-red-400/20 bg-red-500/3' : 'border-cream/10 bg-cream/3'}`}>
              <p className="text-sm text-cream/40">
                No final decision yet {doneWithoutFinal && <span className="text-red-400/60">— marked Done without a pick</span>}
              </p>
              {!readOnly && (
                <p className="text-xs text-cream/25 mt-1">
                  Pick from options below, or add one and mark it final.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Options board */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setOptionsOpen(!optionsOpen)}
              className="flex items-center gap-2 text-lg font-medium text-cream hover:text-cream/80 transition-colors md:pointer-events-none"
            >
              <span className="text-cream/30 text-xs md:hidden">{optionsOpen ? '▼' : '▶'}</span>
              Options Board
              <span className="text-cream/30 font-normal">&middot;</span>
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-cream/10 text-cream/50 text-xs font-medium rounded-full">
                {foundDecision.options.length}
              </span>
            </button>
            <div className="flex-1" />
            {!readOnly && (
              <AddIdeaMenu
                onPhoto={() => addActionsRef.current?.triggerPhoto()}
                onNote={() => addActionsRef.current?.triggerNote()}
                onWeb={() => addActionsRef.current?.triggerWeb()}
                onPack={availableKits.length > 0 ? () => setIdeasPackOpen(true) : undefined}
                uploading={addActionsRef.current?.uploading}
              />
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
            hideFinalize={isSystemUncategorized}
            onUpdateDecision={updateDecision}
            onAddComment={addComment}
            onCommentOnOption={handleCommentOnOption}
            onOpenGlobalComment={openGlobalCommentComposer}
            comments={foundDecision.comments || []}
            hasKits={availableKits.length > 0}
            onOpenPack={() => setIdeasPackOpen(true)}
            rooms={v3State.rooms}
            currentRoomId={foundRoom.id}
            currentDecisionId={foundDecision.id}
            onImportToDecision={handleImportToDecision}
            onMoveOption={(optId) => setMoveOptionId(optId)}
            addActionsRef={addActionsRef}
          />
        </div>

        {/* Notes — collapsed by default, secondary to Ideas */}
        <div className="mb-4">
          {notesExpanded ? (
            <>
              <textarea
                autoFocus
                value={foundDecision.notes}
                onChange={(e) => updateDecision({ notes: e.target.value })}
                readOnly={readOnly}
                className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[60px] md:min-h-[60px]"
                placeholder="Notes..."
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

        {/* Guidance Panel */}
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

        {/* Delete selection */}
        {!readOnly && !isSystemUncategorized && (
          <div className="mt-8 pt-4 border-t border-cream/10">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
            >
              Delete Decision
            </button>
          </div>
        )}
      </div>

      {/* Comments Panel — desktop: side panel, mobile: bottom sheet */}
      {commentsOpen && (
        <>
          {/* Desktop: right side panel */}
          <div className="hidden md:block fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={() => setCommentsOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-96 bg-basalt-50 border-l border-cream/10 shadow-xl overflow-y-auto">
              <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-4 z-10">
                <h2 className="text-lg font-medium text-cream">Comments</h2>
                <button
                  type="button"
                  onClick={() => setCommentsOpen(false)}
                  className="text-cream/40 hover:text-cream transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <CommentsSection
                  comments={userComments}
                  onAddComment={addComment}
                  readOnly={readOnly}
                  commentInputRef={commentInputRef}
                  draftRef={draftRef}
                  onClearDraftRef={() => setDraftRef(null)}
                  onOpenCard={(optId) => {
                    setOptionsOpen(true)
                    setActiveCardId(optId)
                    setCommentsOpen(false)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mobile: bottom sheet */}
          <div className="md:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={() => setCommentsOpen(false)} />
            <div className="relative bg-basalt-50 border-t border-cream/10 rounded-t-xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-3 z-10 rounded-t-xl">
                <h2 className="text-lg font-medium text-cream">Comments</h2>
                <button
                  type="button"
                  onClick={() => setCommentsOpen(false)}
                  className="text-cream/40 hover:text-cream transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <CommentsSection
                  comments={userComments}
                  onAddComment={addComment}
                  readOnly={readOnly}
                  commentInputRef={commentInputRef}
                  draftRef={draftRef}
                  onClearDraftRef={() => setDraftRef(null)}
                  onOpenCard={(optId) => {
                    setOptionsOpen(true)
                    setActiveCardId(optId)
                    setCommentsOpen(false)
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ideas Pack Modal (decision-level) */}
      {ideasPackOpen && foundRoom && (
        <IdeasPackModal
          roomType={foundRoom.type as RoomTypeV3}
          roomName={foundRoom.name}
          decisionTitle={foundDecision.title}
          appliedKitIds={foundRoom.appliedKitIds || []}
          decisionAppliedKitIds={[...new Set(
            foundDecision.options
              .filter((o) => o.origin?.kitId)
              .map((o) => o.origin!.kitId)
          )]}
          ownedKitIds={(state as FinishDecisionsPayloadV3).ownedKitIds || []}
          onApply={handleApplyKitToDecision}
          onClose={() => setIdeasPackOpen(false)}
          kits={kits}
        />
      )}

      {/* Move Idea Sheet */}
      {moveOptionId && foundRoom && foundDecision && (() => {
        const opt = foundDecision.options.find((o) => o.id === moveOptionId)
        return opt ? (
          <MoveIdeaSheet
            options={[opt]}
            sourceRoomId={foundRoom.id}
            sourceDecisionId={foundDecision.id}
            rooms={v3State.rooms}
            onMove={(targetRoomId, targetDecisionId, newTitle) => {
              moveOptionCrossRoom(moveOptionId, targetRoomId, targetDecisionId, newTitle)
            }}
            onClose={() => setMoveOptionId(null)}
          />
        ) : null
      })()}

      {/* Delete selection confirm */}
      {deleteConfirmOpen && (
        <ConfirmDialog
          title="Delete this decision?"
          message="All options, comments, and images in this decision will be permanently lost. This cannot be undone."
          confirmLabel="Delete Decision"
          confirmVariant="danger"
          onConfirm={() => {
            setDeleteConfirmOpen(false)
            deleteDecision()
          }}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}

      {/* Toast */}
      {assignToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl text-sm text-cream/80">
          {assignToast}
        </div>
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

      <CommentInput onAddComment={onAddComment} inputRef={commentInputRef} draftRef={draftRef} onClearDraftRef={onClearDraftRef} />

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
            <div className="text-sm text-cream/50 whitespace-pre-wrap">
              {comment.refOptionId && comment.refOptionLabel && (
                <button
                  type="button"
                  onClick={() => onOpenCard?.(comment.refOptionId!)}
                  className="inline-flex items-center gap-0.5 mr-1.5 px-1.5 py-0.5 bg-sandstone/10 text-sandstone/80 hover:text-sandstone text-[11px] rounded-full transition-colors align-middle"
                >
                  ↗ Re: {truncateLabel(comment.refOptionLabel)}
                </button>
              )}
              {comment.text}
            </div>
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
