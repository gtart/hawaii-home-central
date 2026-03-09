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
  SELECTION_PRIORITY_CONFIG,
  type OptionV3,
  type StatusV3,
  type SelectionPriority,
  type StatusLogEntry,
  type SelectionV4,
  type SelectionComment,
  type FinishDecisionsPayloadV4,
} from '@/data/finish-decisions'
import { moveIdea, getUniqueTags } from '@/lib/decisionHelpers'
import { TagInput } from '../../components/TagInput'
import { DecisionFiles } from '../../components/DecisionFiles'
import { uploadFile as uploadFileForDecision } from '../../uploadFile'
import { MoveIdeaSheet } from '../../components/MoveIdeaSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { relativeTime } from '@/lib/relativeTime'
import { useComments, type CommentRow } from '@/hooks/useComments'
import { useProject } from '@/contexts/ProjectContext'

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
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [shareCreating, setShareCreating] = useState(false)
  const [draftRef, setDraftRef] = useState<{ optionId: string; optionLabel: string } | null>(null)
  const [ideasPackOpen, setIdeasPackOpen] = useState(false)
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false)
  const [moveOptionId, setMoveOptionId] = useState<string | null>(null)
  const [assignToast, setAssignToast] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const addActionsRef = useRef<IdeasBoardAddActions | null>(null)
  const { currentProject } = useProject()

  const collResult = useCollectionState<FinishDecisionsPayloadV4 | any>({
    collectionId: collectionId ?? null,
    toolKey: 'finish_decisions',
    localStorageKey: `hhc_finish_decisions_coll_${collectionId}`,
    defaultValue: { version: 4, selections: [] },
  })
  const toolResult = useToolState<FinishDecisionsPayloadV4 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 4, selections: [] },
  })
  const useCollectionMode = !!collectionId
  const result = useCollectionMode ? collResult : toolResult
  const { state, setState, isLoaded } = result
  const readOnly = useCollectionMode ? collResult.readOnly : toolResult.readOnly

  const v4State =
    state.version === 4
      ? (state as FinishDecisionsPayloadV4)
      : { version: 4 as const, selections: [] as SelectionV4[] }

  // Find the selection (was "decision")
  const foundDecision = v4State.selections.find((s) => s.id === decisionId)

  // Redirect when decision not found — must be in useEffect, not during render
  const shouldRedirect = isLoaded && !foundDecision
  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/app/tools/finish-decisions')
    }
  }, [shouldRedirect, router])

  // DB-backed comments for this decision
  const decisionComments = useComments({
    collectionId: collectionId ?? null,
    targetType: 'decision',
    targetId: decisionId,
  })
  // Collect unique locations from all decisions for autocomplete
  // NOTE: must be before early returns to keep hook order stable across renders
  const locationSuggestions = useMemo(() => {
    const locs = new Set<string>()
    for (const d of v4State.selections) {
      if (d.location?.trim()) locs.add(d.location.trim())
    }
    return Array.from(locs).sort()
  }, [v4State.selections])

  const allTags = useMemo(() => getUniqueTags(v4State.selections), [v4State.selections])

  // Guidance computation — must be before early returns to keep hook order stable
  const guidanceResult = useMemo(
    () => {
      if (!foundDecision) return { milestones: [], impacts: [], advice: [], matchedRuleIds: [] }
      // Use the first tag as a rough "room type" hint for heuristics, default to 'other'
      const hintType = (foundDecision.tags[0]?.toLowerCase().replace(/\s+/g, '_') || 'other') as any
      return matchDecision(
        getHeuristicsConfig(),
        foundDecision.title,
        hintType,
        foundDecision.options.find((o) => o.isSelected)?.name,
        foundDecision.dismissedSuggestionKeys,
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foundDecision?.title, foundDecision?.tags, foundDecision?.options, foundDecision?.dismissedSuggestionKeys]
  )

  const updateDecision = (updates: Partial<SelectionV4>, events?: ActivityEventHint[]) => {
    setState((prev) => ({
      ...prev,
      selections: (prev as FinishDecisionsPayloadV4).selections.map((s) =>
        s.id === decisionId
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
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
    const alreadySelected = foundDecision.options.find((o) => o.id === optionId)?.isSelected
    const isToggleOff = !!alreadySelected
    const userName = session?.user?.name || 'Unknown'
    const now = new Date().toISOString()

    const updates: Partial<SelectionV4> = {
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
      entityLabel: foundDecision.title,
    }]
    updateDecision(updates, events.length > 0 ? events : undefined)
  }

  // Bridge: matches old addComment signature but delegates to DB-backed hook
  const addComment = (comment: {
    text: string
    authorName: string
    authorEmail: string
    refOptionId?: string
    refOptionLabel?: string
  }) => {
    decisionComments.addComment({
      text: comment.text,
      ...(comment.refOptionId
        ? {
            refEntityType: 'option',
            refEntityId: comment.refOptionId,
            refEntityLabel: comment.refOptionLabel,
          }
        : {}),
    })
  }

  const handleStatusChange = (newStatus: StatusV3) => {
    if (!foundDecision) return
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
      entityLabel: foundDecision.title,
      detailText: statusLabel,
    }])
  }

  function openGlobalCommentComposer() {
    // On mobile, open the bottom sheet
    setMobileCommentsOpen(true)
    setTimeout(() => commentInputRef.current?.focus(), 300)
  }

  function handleCommentOnOption(optionId: string, optionLabel: string) {
    setDraftRef({ optionId, optionLabel })
    setMobileCommentsOpen(true)
    setTimeout(() => commentInputRef.current?.focus(), 300)
  }

  const availableKits = foundDecision
    ? findKitsForDecisionTitle(kits, foundDecision.title, 'other')
    : []

  function handleApplyKitToDecision(kit: import('@/data/finish-decision-kits').FinishDecisionKit) {
    if (!foundDecision) return
    const result = applyKitToDecision(foundDecision, kit)
    updateDecision({ options: result.decision.options })
  }

  function moveOptionToSelection(
    optionId: string,
    targetSelectionId: string | null,
    newSelectionTitle?: string,
  ) {
    if (!foundDecision) return

    const optionName = foundDecision.options.find((o) => o.id === optionId)?.name || 'option'
    const targetName = newSelectionTitle
      || v4State.selections.find((s) => s.id === targetSelectionId)?.title
      || 'New Selection'

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV4
      const updated = moveIdea(
        payload.selections,
        foundDecision!.id,
        optionId,
        targetSelectionId,
        newSelectionTitle,
      )
      return { ...payload, selections: updated }
    }, [
      {
        action: 'moved_out',
        entityType: 'option',
        entityId: optionId,
        summaryText: `Moved "${optionName}" out of "${foundDecision!.title}"`,
        entityLabel: optionName,
        detailText: `from ${foundDecision!.title}`,
      },
      {
        action: 'moved_in',
        entityType: 'option',
        entityId: optionId,
        summaryText: `Moved "${optionName}" into "${targetName}"`,
        entityLabel: optionName,
        detailText: `to ${targetName}`,
      },
    ])

    setAssignToast(`Moved to ${targetName}`)
    setMoveOptionId(null)
    setActiveCardId(null)
    setTimeout(() => setAssignToast(null), 3000)
  }

  function copyOptionToSelection(
    optionId: string,
    targetSelectionId: string | null,
    newSelectionTitle?: string,
  ) {
    if (!foundDecision) return
    const option = foundDecision.options.find((o) => o.id === optionId)
    if (!option) return

    const now = new Date().toISOString()
    const clone: OptionV3 = {
      ...option,
      id: crypto.randomUUID(),
      isSelected: false,
      votes: undefined,
      createdAt: now,
      updatedAt: now,
    }

    const targetName = newSelectionTitle
      || v4State.selections.find((s) => s.id === targetSelectionId)?.title
      || 'New Selection'

    setState((prev) => {
      const payload = prev as FinishDecisionsPayloadV4
      let resolvedTargetId = targetSelectionId
      let selections = [...payload.selections]

      // Create new selection if title provided and no target
      if (newSelectionTitle && !resolvedTargetId) {
        const newSelection: SelectionV4 = {
          id: crypto.randomUUID(),
          title: newSelectionTitle,
          status: 'deciding' as StatusV3,
          notes: '',
          options: [],
          tags: foundDecision?.tags ?? [],
          createdAt: now,
          updatedAt: now,
        }
        selections = [...selections, newSelection]
        resolvedTargetId = newSelection.id
      }

      if (!resolvedTargetId) return prev

      return {
        ...payload,
        selections: selections.map((s) =>
          s.id === resolvedTargetId
            ? { ...s, options: [...s.options, clone], updatedAt: now }
            : s
        ),
      }
    }, [{
      action: 'copied',
      entityType: 'option',
      entityId: optionId,
      summaryText: `Copied "${option.name || 'option'}" to "${targetName}"`,
      entityLabel: option.name || 'option',
      detailText: `to ${targetName}`,
    }])

    setAssignToast(`Copied to ${targetName}`)
    setTimeout(() => setAssignToast(null), 3000)
  }

  function handleImportToDecision(
    targetSelectionId: string | null,
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
      const payload = prev as FinishDecisionsPayloadV4
      let resolvedTargetId = targetSelectionId
      let selections = [...payload.selections]

      // If creating a new selection
      if (!resolvedTargetId && newTitle) {
        const newSelection: SelectionV4 = {
          id: crypto.randomUUID(),
          title: newTitle,
          status: 'deciding' as StatusV3,
          notes: '',
          options: [],
          tags: foundDecision?.tags ?? [],
          createdAt: now,
          updatedAt: now,
        }
        resolvedTargetId = newSelection.id
        selections = [...selections, newSelection]
      }

      // Default to current selection if no target
      if (!resolvedTargetId) {
        resolvedTargetId = foundDecision?.id ?? null
      }

      if (!resolvedTargetId) return prev

      return {
        ...payload,
        selections: selections.map((s) =>
          s.id === resolvedTargetId
            ? { ...s, options: [...s.options, newOption], updatedAt: now }
            : s
        ),
      }
    })

    const selectionName = newTitle || v4State.selections.find((s) => s.id === targetSelectionId)?.title || foundDecision?.title || 'Selection'
    setAssignToast(`Saved to ${selectionName}`)
    setTimeout(() => setAssignToast(null), 4000)
  }

  const deleteDecision = () => {
    if (!foundDecision) return
    setState((prev) => ({
      ...prev,
      selections: (prev as FinishDecisionsPayloadV4).selections.filter(
        (s) => s.id !== decisionId
      ),
    }))
    router.push('/app/tools/finish-decisions')
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

  if (!foundDecision) {
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
  const userComments = decisionComments.comments
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
      <div className="md:flex md:gap-6 md:max-w-6xl md:mx-auto">
      <div className="max-w-3xl md:max-w-none md:flex-1 mx-auto md:mx-0">
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
              readOnly={readOnly}
            />
          </div>
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
          <select
            value={foundDecision.priority || ''}
            onChange={(e) => !readOnly && updateDecision({ priority: (e.target.value || undefined) as SelectionPriority | undefined })}
            disabled={readOnly}
            className={`shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-sandstone/40 disabled:cursor-default [color-scheme:dark] ${foundDecision.priority ? SELECTION_PRIORITY_CONFIG[foundDecision.priority].className + ' border-current/20' : 'bg-basalt-50 text-cream/40 border-cream/10'}`}
          >
            <option value="">Priority</option>
            {Object.entries(SELECTION_PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={foundDecision.dueDate || ''}
            onChange={(e) => updateDecision({ dueDate: e.target.value || null })}
            disabled={readOnly}
            className="bg-basalt-50 text-cream rounded-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone [color-scheme:dark] disabled:opacity-50 shrink-0"
          />
          {collectionId && !readOnly && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 rounded-lg transition-colors"
              title="Share this selection"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
              </svg>
              Share
            </button>
          )}
        </div>

        {/* Mobile header: title + controls */}
        <div className="md:hidden mb-2">
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
          <div className="flex items-center gap-2 mt-2">
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
            <select
              value={foundDecision.priority || ''}
              onChange={(e) => !readOnly && updateDecision({ priority: (e.target.value || undefined) as SelectionPriority | undefined })}
              disabled={readOnly}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-sandstone/40 disabled:cursor-default [color-scheme:dark] ${foundDecision.priority ? SELECTION_PRIORITY_CONFIG[foundDecision.priority].className + ' border-current/20' : 'bg-basalt-50 text-cream/40 border-cream/10'}`}
            >
              <option value="">Priority</option>
              {Object.entries(SELECTION_PRIORITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
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

        {/* Tags */}
        <div className="mb-2">
          <TagInput
            tags={foundDecision.tags || []}
            allTags={allTags}
            onChange={(newTags) => updateDecision({ tags: newTags })}
            readOnly={readOnly}
          />
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
            <button
              type="button"
              onClick={() => setMobileCommentsOpen(true)}
              className={`md:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                commentCount > 0
                  ? 'bg-sandstone/20 text-sandstone hover:bg-sandstone/30'
                  : 'bg-cream/10 text-cream/50 hover:bg-cream/15 hover:text-cream/70'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'Comments'}
            </button>
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
            hideFinalize={false}
            hideCompare
            onUpdateDecision={updateDecision}
            onAddComment={addComment}
            onCommentOnOption={handleCommentOnOption}
            onOpenGlobalComment={openGlobalCommentComposer}
            comments={decisionComments.comments}
            hasKits={availableKits.length > 0}
            onOpenPack={() => setIdeasPackOpen(true)}
            selections={v4State.selections}
            currentSelectionId={foundDecision.id}
            onImportToDecision={handleImportToDecision}
            onMoveOption={(optId) => setMoveOptionId(optId)}
            onCopyOption={undefined}
            copyDisabledReason={undefined}
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
        {!readOnly && (
          <div className="mt-8 pt-4 border-t border-cream/10 space-y-3">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-xs text-red-400/50 hover:text-red-400 transition-colors"
            >
              Delete Selection
            </button>
          </div>
        )}
      </div>

      {/* Desktop: always-open side panel */}
      <aside className="hidden md:block w-80 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
        <div className="bg-basalt-50 border border-cream/10 rounded-card">
          <div className="border-b border-cream/10 px-4 py-3">
            <h2 className="text-sm font-medium text-cream flex items-center gap-2">
              <svg className="w-4 h-4 text-cream/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Comments
              {commentCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-cream/10 text-cream/50 text-xs font-medium rounded-full">
                  {commentCount}
                </span>
              )}
            </h2>
          </div>
          <div className="p-4">
            <CommentsSection
              comments={userComments}
              onAddComment={addComment}
              readOnly={readOnly}
              commentInputRef={commentInputRef}
              draftRef={draftRef}
              onClearDraftRef={() => setDraftRef(null)}
              onSetDraftRef={setDraftRef}
              onOpenCard={(optId) => setActiveCardId(optId)}
              options={foundDecision.options}
            />
          </div>
        </div>
      </aside>
      </div>{/* end flex wrapper */}

      {/* Mobile: fixed bottom bar + bottom sheet */}
      {!mobileCommentsOpen && (
        <button
          type="button"
          onClick={() => setMobileCommentsOpen(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 z-40 bg-basalt-50 border border-cream/15 rounded-xl shadow-lg px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-cream">
            <svg className="w-4 h-4 text-sandstone/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Comments
            {commentCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-sandstone/20 text-sandstone text-xs font-medium rounded-full">
                {commentCount}
              </span>
            )}
          </span>
          <svg className="w-4 h-4 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {mobileCommentsOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileCommentsOpen(false)} />
          <div className="relative bg-basalt-50 border-t border-cream/10 rounded-t-xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 flex items-center justify-between px-5 py-3 z-10 rounded-t-xl">
              <h2 className="text-base font-medium text-cream">Comments</h2>
              <button
                type="button"
                onClick={() => setMobileCommentsOpen(false)}
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
                onSetDraftRef={setDraftRef}
                onOpenCard={(optId) => {
                  setActiveCardId(optId)
                  setMobileCommentsOpen(false)
                }}
                options={foundDecision.options}
              />
            </div>
          </div>
        </div>
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
      {ideasPackOpen && (
        <IdeasPackModal
          decisionTitle={foundDecision.title}
          appliedKitIds={v4State.appliedKitIds || []}
          decisionAppliedKitIds={[...new Set(
            foundDecision.options
              .filter((o) => o.origin?.kitId)
              .map((o) => o.origin!.kitId)
          )]}
          ownedKitIds={v4State.ownedKitIds || []}
          onApply={handleApplyKitToDecision}
          onClose={() => setIdeasPackOpen(false)}
          kits={kits}
        />
      )}

      {/* Move Idea Sheet */}
      {moveOptionId && foundDecision && (() => {
        const opt = foundDecision.options.find((o) => o.id === moveOptionId)
        return opt ? (
          <MoveIdeaSheet
            options={[opt]}
            sourceSelectionId={foundDecision.id}
            selections={v4State.selections}
            onMove={(targetSelectionId, newTitle) => {
              moveOptionToSelection(moveOptionId, targetSelectionId, newTitle)
            }}
            onCopy={(targetSelectionId, newTitle) => {
              copyOptionToSelection(moveOptionId, targetSelectionId, newTitle)
            }}
            onClose={() => setMoveOptionId(null)}
          />
        ) : null
      })()}

      {/* Delete selection confirm */}
      {deleteConfirmOpen && (
        <ConfirmDialog
          title="Delete this selection?"
          message="All options, comments, and images in this selection will be permanently lost. This cannot be undone."
          confirmLabel="Delete Selection"
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

      {/* Per-selection share dialog */}
      {shareOpen && collectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShareOpen(false); setShareLink(null) }} />
          <div className="relative bg-basalt-50 border border-cream/15 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-medium text-cream mb-1">Share this selection</h3>
            <p className="text-sm text-cream/50 mb-4">
              Create a read-only link for &ldquo;{foundDecision.title}&rdquo;
            </p>

            {shareLink ? (
              <div className="space-y-3">
                <div className="bg-basalt border border-cream/15 rounded-lg p-3">
                  <p className="text-xs text-cream/40 mb-1">Share link</p>
                  <p className="text-sm text-cream/80 break-all font-mono">{shareLink}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(shareLink); }}
                  className="w-full py-2.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors text-sm"
                >
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => { setShareOpen(false); setShareLink(null) }}
                  className="w-full py-2 text-sm text-cream/50 hover:text-cream/70 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShareOpen(false); setShareLink(null) }}
                  className="px-4 py-1.5 text-sm text-cream/50 hover:text-cream/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={shareCreating}
                  onClick={async () => {
                    setShareCreating(true)
                    try {
                      const res = await fetch(`/api/collections/${collectionId}/share-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          settings: {
                            includeNotes: false,
                            includeComments: true,
                            includePhotos: true,
                            scope: {
                              mode: 'selected',
                              selectionIds: [foundDecision.id],
                              selectionLabels: [foundDecision.title],
                            },
                          },
                        }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        const token = data.token || data.shareToken?.token
                        if (token) {
                          setShareLink(`${window.location.origin}/share/finish_decisions/${token}`)
                        }
                      }
                    } catch { /* silent */ }
                    finally { setShareCreating(false) }
                  }}
                  className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
                >
                  {shareCreating ? 'Creating...' : 'Create link'}
                </button>
              </div>
            )}
          </div>
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
  onSetDraftRef,
  onOpenCard,
  options,
}: {
  comments: CommentRow[]
  onAddComment: (comment: { text: string; authorName: string; authorEmail: string; refOptionId?: string; refOptionLabel?: string }) => void
  readOnly: boolean
  commentInputRef?: React.RefObject<HTMLTextAreaElement | null>
  draftRef?: { optionId: string; optionLabel: string } | null
  onClearDraftRef?: () => void
  onSetDraftRef?: (ref: { optionId: string; optionLabel: string }) => void
  onOpenCard?: (optionId: string) => void
  options?: OptionV3[]
}) {
  const [page, setPage] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Chronological order (oldest first for chat-thread feel)
  const allComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  const totalPages = Math.max(1, Math.ceil(allComments.length / COMMENTS_PER_PAGE))
  // Show the LAST page by default (most recent comments)
  const effectivePage = page === 0 && totalPages > 1 ? totalPages - 1 : page
  const pageComments = allComments.slice(effectivePage * COMMENTS_PER_PAGE, (effectivePage + 1) * COMMENTS_PER_PAGE)

  // Scroll to bottom when comments change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments.length])

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs uppercase tracking-wider text-cream/30 mb-1">
        Comments {allComments.length > 0 && `(${allComments.length})`}
      </h3>
      <p className="text-[11px] text-cream/20 mb-3">
        Comments are shared with collaborators who can access this tool.
      </p>

      {/* Scrollable comment thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 mb-3">
        {allComments.length === 0 && (
          <p className="text-xs text-cream/20 mt-3">No comments yet.</p>
        )}

        {totalPages > 1 && effectivePage > 0 && (
          <div className="flex justify-center mb-3">
            <button
              type="button"
              onClick={() => setPage(effectivePage - 1)}
              className="text-xs text-cream/30 hover:text-cream/50 transition-colors"
            >
              Load older comments
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {pageComments.map((comment) => (
            <div key={comment.id} className="bg-basalt/50 border border-cream/8 rounded-lg p-3">
              <div className="flex items-start gap-2.5">
                {/* Avatar initial */}
                <span className="w-6 h-6 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  {/* Author + time */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-cream/70">{comment.authorName}</span>
                    <span className="text-[10px] text-cream/25">
                      {relativeTime(comment.createdAt)}
                    </span>
                  </div>
                  {/* Reference chip */}
                  {comment.refEntityId && comment.refEntityLabel ? (
                    <button
                      type="button"
                      onClick={() => onOpenCard?.(comment.refEntityId!)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 mb-1 rounded-full text-[10px] bg-sandstone/10 text-sandstone/70 hover:bg-sandstone/20 hover:text-sandstone transition-colors"
                    >
                      Re: {truncateLabel(comment.refEntityLabel, 30)}
                      <span className="text-sandstone/30">↗</span>
                    </button>
                  ) : null}
                  {/* Comment text */}
                  <p className="text-sm text-cream/60 whitespace-pre-wrap leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && effectivePage < totalPages - 1 && (
          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={() => setPage(effectivePage + 1)}
              className="text-xs text-cream/30 hover:text-cream/50 transition-colors"
            >
              Load newer comments
            </button>
          </div>
        )}
      </div>

      {/* Pinned composer */}
      <div className="border-t border-cream/10 pt-3 shrink-0">
        <CommentInput onAddComment={onAddComment} inputRef={commentInputRef} draftRef={draftRef} onClearDraftRef={onClearDraftRef} onSetDraftRef={onSetDraftRef} options={options} />
      </div>
    </div>
  )
}

function CommentInput({
  onAddComment,
  inputRef,
  draftRef,
  onClearDraftRef,
  onSetDraftRef,
  options,
}: {
  onAddComment: (comment: { text: string; authorName: string; authorEmail: string; refOptionId?: string; refOptionLabel?: string }) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  draftRef?: { optionId: string; optionLabel: string } | null
  onClearDraftRef?: () => void
  onSetDraftRef?: (ref: { optionId: string; optionLabel: string }) => void
  options?: OptionV3[]
}) {
  const { data: session } = useSession()
  const [text, setText] = useState('')
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const mentionRef = useRef<HTMLDivElement>(null)

  // Close mention picker on click outside
  useEffect(() => {
    if (!mentionOpen) return
    function handleClick(e: MouseEvent) {
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
        setMentionOpen(false)
        setMentionFilter('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mentionOpen])

  const filteredOptions = useMemo(() => {
    if (!options || options.length === 0) return []
    if (!mentionFilter) return options
    const q = mentionFilter.toLowerCase()
    return options.filter((o) => (o.name || 'Untitled').toLowerCase().includes(q))
  }, [options, mentionFilter])

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

  function handleTextChange(value: string) {
    setText(value.slice(0, MAX_COMMENT_LENGTH))

    // Detect @ trigger — check if the last word starts with @
    const cursorText = value
    const lastAtIndex = cursorText.lastIndexOf('@')
    if (lastAtIndex >= 0 && options && options.length > 0) {
      const beforeAt = cursorText[lastAtIndex - 1]
      // Only trigger if @ is at start or after whitespace
      if (lastAtIndex === 0 || beforeAt === ' ' || beforeAt === '\n') {
        const query = cursorText.slice(lastAtIndex + 1)
        // Only keep open if no space in query (user is still typing the mention)
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionOpen(true)
          setMentionFilter(query)
          return
        }
      }
    }
    if (mentionOpen) {
      setMentionOpen(false)
      setMentionFilter('')
    }
  }

  function handleSelectMention(opt: OptionV3) {
    // Remove the @query from text
    const lastAtIndex = text.lastIndexOf('@')
    const newText = lastAtIndex >= 0 ? text.slice(0, lastAtIndex) : text
    setText(newText)
    setMentionOpen(false)
    setMentionFilter('')
    onSetDraftRef?.({ optionId: opt.id, optionLabel: opt.name || 'Untitled' })
    inputRef?.current?.focus()
  }

  return (
    <div>
      {/* Draft ref pill */}
      {draftRef ? (
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
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
          {options && options.length > 0 ? 'Type @ to reference an option' : 'General comment on this selection'}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (mentionOpen && filteredOptions.length > 0) {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setMentionOpen(false)
                  setMentionFilter('')
                  return
                }
              }
              if (e.key === 'Enter' && !e.shiftKey && !mentionOpen) {
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

        {/* @ mention picker */}
        {mentionOpen && filteredOptions.length > 0 && (
          <div ref={mentionRef} className="absolute bottom-full mb-1 left-0 right-12 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto py-1">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-cream/25 border-b border-cream/8">
              Reference an option
            </div>
            {filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMention(opt)}
                className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 hover:text-cream transition-colors flex items-center gap-2"
              >
                {opt.isSelected && (
                  <span className="w-2 h-2 rounded-full bg-sandstone shrink-0" title="Final pick" />
                )}
                <span className="truncate">{opt.name || 'Untitled'}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-cream/30">No matching options</p>
            )}
          </div>
        )}
      </div>
      {text.length > 0 && (
        <p className={`text-[10px] mt-1 text-right ${text.length >= MAX_COMMENT_LENGTH ? 'text-red-400' : 'text-cream/25'}`}>
          {text.length}/{MAX_COMMENT_LENGTH}
        </p>
      )}
    </div>
  )
}
