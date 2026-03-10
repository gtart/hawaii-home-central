'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
  resolveSelectionAccess,
  type OptionV3,
  type StatusV3,
  type SelectionPriority,
  type StatusLogEntry,
  type SelectionV4,
  type FinishDecisionsPayloadV4,
} from '@/data/finish-decisions'
import { moveIdea, getUniqueTags } from '@/lib/decisionHelpers'
import { TagInput, LOCATION_SUGGESTIONS } from '../../components/TagInput'
import { DecisionFiles } from '../../components/DecisionFiles'
import { uploadFile as uploadFileForDecision } from '../../uploadFile'
import { MoveIdeaSheet } from '../../components/MoveIdeaSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useComments, type CommentRow } from '@/hooks/useComments'
import { CollapsibleCommentSidebar } from '@/components/app/CollapsibleCommentSidebar'
import type { RefEntity } from '@/components/app/CommentThread'
import { useProject } from '@/contexts/ProjectContext'
import { SelectionShareSheet } from '../../components/SelectionShareSheet'
import type { SelectionVisibility, SelectionAccess } from '@/data/finish-decisions'

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
  const [ideasPackOpen, setIdeasPackOpen] = useState(false)
  const [moveOptionId, setMoveOptionId] = useState<string | null>(null)
  const [assignToast, setAssignToast] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [commentInitialRef, setCommentInitialRef] = useState<RefEntity | null>(null)
  const [forceExpandComments, setForceExpandComments] = useState(false)
  const [deepLinkCommentId, setDeepLinkCommentId] = useState<string | null>(null)
  const addActionsRef = useRef<IdeasBoardAddActions | null>(null)
  const deepLinkProcessed = useRef(false)
  const searchParams = useSearchParams()
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
  const workspaceAccess = useCollectionMode ? (collResult.access || null) : null
  const isWorkspaceOwner = workspaceAccess === 'OWNER'

  const v4State =
    state.version === 4
      ? (state as FinishDecisionsPayloadV4)
      : { version: 4 as const, selections: [] as SelectionV4[] }

  // Find the selection (was "decision")
  const foundDecision = v4State.selections.find((s) => s.id === decisionId)

  // Check selection-level access for restricted selections
  const selectionAccess = foundDecision && session?.user?.email
    ? resolveSelectionAccess(foundDecision, session.user.email, workspaceAccess || 'VIEWER')
    : (foundDecision ? 'edit' : null) // no email = local mode, allow
  const selectionBlocked = foundDecision && selectionAccess === null

  // Redirect when decision not found or access blocked
  const shouldRedirect = isLoaded && (!foundDecision || selectionBlocked)
  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/app/tools/finish-decisions')
    }
  }, [shouldRedirect, router])

  // Deep-link: auto-open option / comments from query params (runs once)
  useEffect(() => {
    if (!foundDecision || deepLinkProcessed.current) return
    deepLinkProcessed.current = true

    const qOptionId = searchParams.get('optionId')
    const qComments = searchParams.get('comments')
    const qCommentId = searchParams.get('commentId')

    if (qOptionId) {
      const opt = foundDecision.options.find((o) => o.id === qOptionId)
      if (opt) {
        setActiveCardId(qOptionId)
      }
    }

    if (qCommentId) {
      setDeepLinkCommentId(qCommentId)
      // Open the sidebar so the highlighted comment is visible
      setForceExpandComments(true)
      setTimeout(() => setForceExpandComments(false), 100)
    } else if (qComments === '1' && !qOptionId) {
      // Only auto-open sidebar for selection-level comment links (no option)
      setForceExpandComments(true)
      setTimeout(() => setForceExpandComments(false), 100)
    }
  }, [foundDecision, searchParams])

  // DB-backed comments for this decision
  const decisionComments = useComments({
    collectionId: collectionId ?? null,
    targetType: 'decision',
    targetId: decisionId,
  })
  // Collect unique locations from all decisions for autocomplete
  // NOTE: must be before early returns to keep hook order stable across renders
  const locationSuggestions = useMemo(() => {
    const locs = new Set<string>(LOCATION_SUGGESTIONS)
    for (const d of v4State.selections) {
      if (d.location?.trim()) locs.add(d.location.trim())
    }
    return Array.from(locs).sort()
  }, [v4State.selections])

  const allTags = useMemo(() => getUniqueTags(v4State.selections), [v4State.selections])

  // Build ref entities for comment @ mentions (options/ideas) — must be before early returns for hook order
  const commentRefEntities: RefEntity[] = useMemo(() =>
    foundDecision
      ? (foundDecision.options || []).map((o) => ({ id: o.id, label: o.name || 'Untitled' }))
      : [],
    [foundDecision?.options]
  )

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
    setActiveCardId(null)
    setForceExpandComments(true)
    setTimeout(() => setForceExpandComments(false), 100)
  }

  function handleCommentOnOption(optionId: string, optionLabel: string) {
    // Open the option modal — its inline comment thread is the primary home
    setActiveCardId(optionId)
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
          {collectionId && (
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
              {foundDecision.visibility === 'restricted' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Restricted" />
              )}
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
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-cream/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[11px] uppercase tracking-wider text-cream/40 font-medium">Location</span>
          </div>
          <input
            type="text"
            list="location-suggestions"
            value={foundDecision.location || ''}
            onChange={(e) => updateDecision({ location: e.target.value })}
            placeholder="Where in the home? e.g. Kitchen"
            readOnly={readOnly}
            className="bg-basalt border border-cream/12 rounded-lg px-3 py-1.5 text-sm text-cream/70 placeholder:text-cream/25 focus:outline-none focus:text-cream focus:border-sandstone/40 transition-colors w-full max-w-[280px] disabled:opacity-50"
          />
          <datalist id="location-suggestions">
            {locationSuggestions.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {/* Labels */}
        <div className="mb-2">
          <span className="text-[11px] uppercase tracking-wider text-cream/30 font-medium mb-1 block">Labels</span>
          <TagInput
            tags={foundDecision.tags || []}
            allTags={allTags}
            onChange={(newTags) => updateDecision({ tags: newTags })}
            readOnly={readOnly}
            placeholder="Optional: urgency, type, style, phase..."
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
            onDeleteComment={decisionComments.deleteComment}
            onEditComment={decisionComments.editComment}
            currentUserId={session?.user?.id ?? null}
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

      <CollapsibleCommentSidebar
        title="Selection comments"
        storageKey="selections_comments_collapsed"
        comments={userComments}
        isLoading={decisionComments.isLoading}
        readOnly={readOnly}
        onAddComment={decisionComments.addComment}
        onDeleteComment={decisionComments.deleteComment}
        onEditComment={decisionComments.editComment}
        refEntities={commentRefEntities}
        refEntityType="option"
        refPickerLabel="Tag an option"
        initialRef={commentInitialRef}
        onClearInitialRef={() => setCommentInitialRef(null)}
        onNavigateToRef={(refId) => setActiveCardId(refId)}
        forceExpand={forceExpandComments}
        filterRefEntityId={null}
        filterRefEntityLabel={null}
        onClearFilter={undefined}
        currentUserId={session?.user?.id ?? null}
        highlightCommentId={deepLinkCommentId}
      />
      </div>{/* end flex wrapper */}

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

      {/* Per-selection share sheet */}
      {shareOpen && collectionId && currentProject && (
        <SelectionShareSheet
          selection={foundDecision}
          currentUserEmail={session?.user?.email || ''}
          isOwner={isWorkspaceOwner}
          projectId={currentProject.id}
          collectionId={collectionId}
          onUpdateVisibility={(visibility: SelectionVisibility, access: SelectionAccess[]) => {
            updateDecision({
              visibility,
              access: visibility === 'restricted' ? access : undefined,
              createdBy: foundDecision.createdBy || session?.user?.email || undefined,
            })
          }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}

