'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import { useToolState } from '@/hooks/useToolState'
import { useCollectionState, type ActivityEventHint } from '@/hooks/useCollectionState'
import { IdeasBoard, AddIdeaMenu, type IdeasBoardAddActions } from '../../components/IdeasBoard'
import { buildBoardHref } from '../../lib/routing'
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
import { DecisionFiles } from '../../components/DecisionFiles'
import { uploadFile as uploadFileForDecision } from '../../uploadFile'
import { MoveIdeaSheet } from '../../components/MoveIdeaSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { relativeTime } from '@/lib/relativeTime'
import { useProject } from '@/contexts/ProjectContext'
import { DestinationPicker } from '@/components/app/DestinationPicker'
import { useCollectionTransfer } from '@/hooks/useCollectionTransfer'

const COMMENTS_PER_PAGE = 10
const MAX_COMMENT_LENGTH = 400

function truncateLabel(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

function mapAccess(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
  if (!a) return null
  if (a === 'EDITOR') return 'EDIT'
  if (a === 'VIEWER') return 'VIEW'
  return a as 'OWNER' | 'EDIT' | 'VIEW'
}

export function DecisionDetailContent({
  kits = [],
  emojiMap = {},
  collectionId,
}: {
  kits?: FinishDecisionKit[]
  emojiMap?: Record<string, string>
  collectionId?: string
}) {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const decisionId = params.decisionId as string
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftRef, setDraftRef] = useState<{ optionId: string; optionLabel: string } | null>(null)
  const [ideasPackOpen, setIdeasPackOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [moveOptionId, setMoveOptionId] = useState<string | null>(null)
  const [assignToast, setAssignToast] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [moveDecisionOpen, setMoveDecisionOpen] = useState(false)
  const [copyOptionId, setCopyOptionId] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const addActionsRef = useRef<IdeasBoardAddActions | null>(null)
  const { currentProject } = useProject()
  const { transfer, isTransferring } = useCollectionTransfer()

  const collResult = useCollectionState<FinishDecisionsPayloadV3>({
    collectionId: collectionId ?? null,
    toolKey: 'finish_decisions',
    localStorageKey: `hhc_finish_decisions_coll_${collectionId}`,
    defaultValue: { version: 3, rooms: [] },
  })
  const toolResult = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })
  const useCollectionMode = !!collectionId
  const result = useCollectionMode ? collResult : toolResult
  const { state, setState, isLoaded } = result
  const readOnly = useCollectionMode ? collResult.readOnly : toolResult.readOnly

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

  // Redirect when decision not found — must be in useEffect, not during render
  const shouldRedirect = isLoaded && !foundDecision
  useEffect(() => {
    if (shouldRedirect) {
      const basePath = collectionId ? `/app/tools/finish-decisions/${collectionId}` : '/app/tools/finish-decisions'
      router.replace(basePath)
    }
  }, [shouldRedirect, collectionId, router])

  // Collect unique locations from all decisions for autocomplete
  // NOTE: must be before early returns to keep hook order stable across renders
  const locationSuggestions = useMemo(() => {
    const locs = new Set<string>()
    for (const room of v3State.rooms) {
      for (const d of room.decisions) {
        if (d.location?.trim()) locs.add(d.location.trim())
      }
    }
    return Array.from(locs).sort()
  }, [v3State.rooms])

  // Guidance computation — must be before early returns to keep hook order stable
  const guidanceResult = useMemo(
    () => {
      if (!foundDecision || !foundRoom) return { milestones: [], impacts: [], advice: [], matchedRuleIds: [] }
      return matchDecision(
        getHeuristicsConfig(),
        foundDecision.title,
        foundRoom.type,
        foundDecision.options.find((o) => o.isSelected)?.name,
        foundDecision.dismissedSuggestionKeys,
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foundDecision?.title, foundRoom?.type, foundDecision?.options, foundDecision?.dismissedSuggestionKeys]
  )

  const updateDecision = (updates: Partial<DecisionV3>, events?: ActivityEventHint[]) => {
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
    }), events)
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

    const events: ActivityEventHint[] = isToggleOff ? [] : [{
      action: 'selected',
      entityType: 'decision',
      entityId: decisionId,
      summaryText: `Selected option for: "${foundDecision.title}"`,
    }]
    updateDecision(updates, events.length > 0 ? events : undefined)
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
    }, [{
      action: 'commented',
      entityType: 'decision',
      entityId: decisionId,
      summaryText: `${comment.authorName} commented on "${foundDecision.title}": "${comment.text.length > 60 ? comment.text.slice(0, 60) + '…' : comment.text}"`,
    }])
  }

  const handleStatusChange = (newStatus: StatusV3) => {
    if (!foundDecision) return
    // Uncategorized selections stay in "deciding" status
    if (isUncategorized(foundDecision)) return
    const oldStatus = foundDecision.status
    if (oldStatus === newStatus) return

    const userName = session?.user?.name || 'Unknown'
    const now = new Date().toISOString()
    const statusLabel = STATUS_CONFIG_V3[newStatus]?.label || newStatus

    updateDecision({
      status: newStatus,
      statusLog: [
        ...(foundDecision.statusLog || []),
        { status: newStatus, markedBy: userName, markedAt: now },
      ],
    }, [{
      action: 'status_changed',
      entityType: 'decision',
      entityId: decisionId,
      summaryText: `Changed "${foundDecision.title}" → ${statusLabel}`,
    }])
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
      const basePath = collectionId ? `/app/tools/finish-decisions/${collectionId}` : '/app/tools/finish-decisions'
      router.push(basePath)
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
    // useEffect above handles the redirect
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center py-12 text-cream/50">
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  // Guidance content — used in the guidance modal
  // eslint-disable-next-line react/no-unstable-nested-components -- colocated for clarity
  function GuidancePanelContent({
    result,
    onDismiss,
  }: {
    result: ReturnType<typeof matchDecision>
    onDismiss: (key: string) => void
  }) {
    return (
      <div className="space-y-4">
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
                    onClick={() => onDismiss(`m:${m.id}`)}
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
    )
  }

  const isSystemUncategorized = isUncategorized(foundDecision)

  const guidanceTipCount = guidanceResult.milestones.length + guidanceResult.impacts.length + guidanceResult.advice.length

  function handleGuidanceDismiss(key: string) {
    if (!foundDecision) return
    updateDecision({
      dismissedSuggestionKeys: [
        ...(foundDecision.dismissedSuggestionKeys || []),
        key,
      ],
    })
  }

  // Filter: only show user comments (non-empty authorEmail), not system comments
  const userComments = (foundDecision.comments || []).filter((c) => c.authorEmail !== '')
  const commentCount = userComments.length
  const lastUserComment = [...userComments].reverse()[0]
  const statusCfg = STATUS_CONFIG_V3[foundDecision.status] ?? STATUS_CONFIG_V3.deciding
  const formattedDue = foundDecision.dueDate
    ? new Date(foundDecision.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const finalPick = (foundDecision.options ?? []).find((o) => o.isSelected)
  const optionsCount = (foundDecision.options ?? []).length
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
          onClick={() => router.push(buildBoardHref(collectionId))}
          className="inline-flex items-center gap-1.5 text-sandstone hover:text-sandstone-light text-sm mb-4"
        >
          <span>←</span>
          <span>Back to list</span>
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
            <select
              value={foundDecision.status}
              onChange={(e) => !readOnly && handleStatusChange(e.target.value as StatusV3)}
              disabled={readOnly}
              className={`shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-sandstone/40 disabled:cursor-default [color-scheme:dark] ${statusCfg.pillClass}`}
            >
              {Object.entries(STATUS_CONFIG_V3).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
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
          <div className="flex items-center gap-2 mt-2">
            {!isSystemUncategorized && (
              <select
                value={foundDecision.status}
                onChange={(e) => !readOnly && handleStatusChange(e.target.value as StatusV3)}
                disabled={readOnly}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-sandstone/40 disabled:cursor-default [color-scheme:dark] ${statusCfg.pillClass}`}
              >
                {Object.entries(STATUS_CONFIG_V3).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            )}
            <input
              type="date"
              value={foundDecision.dueDate || ''}
              onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
              disabled={readOnly}
              className="bg-basalt-50 text-cream rounded-input px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark] disabled:opacity-50 ml-auto"
            />
          </div>
        </div>

        {/* Location field */}
        {!isSystemUncategorized && (
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              type="text"
              list="location-suggestions"
              value={foundDecision.location || ''}
              onChange={(e) => updateDecision({ location: e.target.value })}
              placeholder="Add location..."
              readOnly={readOnly}
              className="bg-transparent text-sm text-cream/60 placeholder:text-cream/25 focus:outline-none focus:text-cream border-b border-transparent hover:border-cream/10 focus:border-sandstone/40 transition-colors max-w-[240px] disabled:opacity-50"
            />
            <datalist id="location-suggestions">
              {locationSuggestions.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
        )}

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
          {guidanceTipCount > 0 && (
            <>
              <span className="text-cream/20">·</span>
              <button
                type="button"
                onClick={() => setGuidanceOpen(true)}
                className="inline-flex items-center gap-1.5 bg-sandstone/10 hover:bg-sandstone/15 border border-sandstone/15 rounded-full px-2.5 py-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-sandstone/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
                <span className="text-xs text-sandstone font-medium">
                  {guidanceTipCount} tip{guidanceTipCount !== 1 ? 's' : ''}
                </span>
              </button>
            </>
          )}
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
            Marked {(STATUS_CONFIG_V3[latestStatusLog.status] ?? STATUS_CONFIG_V3.deciding).label} by {latestStatusLog.markedBy} on{' '}
            {new Date(latestStatusLog.markedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}

        {/* Final Decision Line */}
        <div className="mb-4">
          {finalPick ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-sandstone font-semibold">Final decision selected:</span>
                <button
                  type="button"
                  onClick={() => setActiveCardId(finalPick.id)}
                  className="text-[11px] text-cream/70 font-medium hover:text-cream transition-colors underline decoration-cream/20 hover:decoration-cream/40"
                >
                  {finalPick.name || 'Untitled'}
                </button>
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
              {finalPick.notes && (
                <p className="text-[11px] text-cream/40 mt-1 whitespace-pre-wrap line-clamp-3">{finalPick.notes}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-cream/35">
              No final decision yet &mdash; pick from options below, or add one and mark it final.
              {doneWithoutFinal && <span className="text-red-400/60 ml-1">(marked Done without a pick)</span>}
            </p>
          )}
        </div>

        {/* Options board */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="flex items-center gap-2 text-lg font-medium text-cream">
              Options
              <span className="text-cream/30 font-normal">&middot;</span>
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-cream/10 text-cream/50 text-xs font-medium rounded-full">
                {foundDecision.options.length}
              </span>
            </h2>
            <div className="flex-1" />
            {!readOnly && (
              <AddIdeaMenu
                onPhoto={() => addActionsRef.current?.triggerPhoto()}
                onNote={() => addActionsRef.current?.triggerNote()}
                onWeb={() => addActionsRef.current?.triggerWeb()}
                onImageUrl={() => addActionsRef.current?.triggerImageUrl()}
                onPack={availableKits.length > 0 ? () => setIdeasPackOpen(true) : undefined}
                uploading={addActionsRef.current?.uploading}
              />
            )}
          </div>

          <IdeasBoard
            decision={foundDecision}
            readOnly={readOnly}
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
            hideCompare
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
            onCopyOption={collectionId && currentProject ? (optId) => setCopyOptionId(optId) : undefined}
            addActionsRef={addActionsRef}
          />
        </div>

        {/* All Files — aggregated from all options + decision-level files */}
        <DecisionFiles
          decision={foundDecision}
          readOnly={readOnly}
          userName={session?.user?.name || 'Unknown'}
          userEmail={session?.user?.email || ''}
          onOpenOption={(optionId) => setActiveCardId(optionId)}
          onUpdateDecision={(patch) => updateDecision(patch)}
          onUploadFile={uploadFileForDecision}
        />

        {/* Actions */}
        {!readOnly && !isSystemUncategorized && (
          <div className="mt-8 pt-4 border-t border-cream/10 space-y-3">
            {collectionId && currentProject && (
              <button
                type="button"
                onClick={() => setMoveDecisionOpen(true)}
                disabled={isTransferring}
                className="flex items-center gap-2 text-xs text-cream/40 hover:text-cream/60 disabled:opacity-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isTransferring ? 'Moving...' : 'Move to another list...'}
              </button>
            )}
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
                <h2 className="text-lg font-medium text-cream">All Comments</h2>
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
                <h2 className="text-lg font-medium text-cream">All Comments</h2>
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

                    setActiveCardId(optId)
                    setCommentsOpen(false)
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Guidance Modal */}
      {guidanceOpen && guidanceTipCount > 0 && (
        <>
          {/* Desktop: centered modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setGuidanceOpen(false)} />
            <div className="relative bg-basalt-50 border border-cream/15 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-4 z-10 rounded-t-xl">
                <h2 className="text-lg font-medium text-sandstone">Guidance</h2>
                <button type="button" onClick={() => setGuidanceOpen(false)} className="text-cream/40 hover:text-cream transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                </button>
              </div>
              <div className="p-5">
                <GuidancePanelContent result={guidanceResult} onDismiss={handleGuidanceDismiss} />
              </div>
            </div>
          </div>

          {/* Mobile: bottom sheet */}
          <div className="md:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={() => setGuidanceOpen(false)} />
            <div className="relative bg-basalt-50 border-t border-cream/10 rounded-t-xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-3 z-10 rounded-t-xl">
                <h2 className="text-lg font-medium text-sandstone">Guidance</h2>
                <button type="button" onClick={() => setGuidanceOpen(false)} className="text-cream/40 hover:text-cream transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                </button>
              </div>
              <div className="p-5">
                <GuidancePanelContent result={guidanceResult} onDismiss={handleGuidanceDismiss} />
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

      {/* Move decision to another list */}
      {moveDecisionOpen && collectionId && currentProject && (
        <DestinationPicker
          toolKey="finish_decisions"
          projectId={currentProject.id}
          excludeCollectionId={collectionId}
          actionLabel="Move"
          title="Move selection to..."
          onClose={() => setMoveDecisionOpen(false)}
          onConfirm={async (dest) => {
            const result = await transfer({
              sourceCollectionId: collectionId,
              destinationCollectionId: dest.collectionId,
              operation: 'move',
              entityType: 'decision',
              entityId: decisionId,
              destinationRoomId: dest.roomId,
            })
            setMoveDecisionOpen(false)
            if (result.success) {
              const basePath = collectionId ? `/app/tools/finish-decisions/${collectionId}` : '/app/tools/finish-decisions'
              router.push(basePath)
            }
          }}
        />
      )}

      {/* Copy option to another list */}
      {copyOptionId && collectionId && currentProject && foundRoom && (
        <DestinationPicker
          toolKey="finish_decisions"
          projectId={currentProject.id}
          excludeCollectionId={collectionId}
          requireRoom
          requireDecision
          actionLabel="Copy"
          title="Copy option to..."
          onClose={() => setCopyOptionId(null)}
          onConfirm={async (dest) => {
            const result = await transfer({
              sourceCollectionId: collectionId,
              destinationCollectionId: dest.collectionId,
              operation: 'copy',
              entityType: 'option',
              entityId: copyOptionId,
              sourceDecisionId: decisionId,
              destinationRoomId: dest.roomId,
              destinationDecisionId: dest.decisionId,
            })
            setCopyOptionId(null)
            if (result.success) {
              setAssignToast(`Copied to ${result.destinationCollectionTitle || 'destination'}`)
              setTimeout(() => setAssignToast(null), 3000)
            }
          }}
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
            {comment.refOptionId && comment.refOptionLabel ? (
              <button
                type="button"
                onClick={() => onOpenCard?.(comment.refOptionId!)}
                className="flex items-center gap-1.5 mb-1 text-[11px] text-sandstone/70 hover:text-sandstone transition-colors"
              >
                <span className="w-1 h-1 rounded-full bg-sandstone/50 shrink-0" />
                On: {truncateLabel(comment.refOptionLabel, 40)}
                <span className="text-sandstone/30">↗</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-cream/25">
                <span className="w-1 h-1 rounded-full bg-cream/20 shrink-0" />
                General
              </div>
            )}
            <div className="text-sm text-cream/50 whitespace-pre-wrap">
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
      {draftRef ? (
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
          <button
            type="button"
            onClick={() => onClearDraftRef?.()}
            className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
          >
            Comment on the whole selection instead
          </button>
        </div>
      ) : (
        <div className="text-[11px] text-cream/20 mb-1">
          General comment on this selection
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
