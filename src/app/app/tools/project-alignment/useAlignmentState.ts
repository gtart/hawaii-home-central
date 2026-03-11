'use client'

import { useCallback } from 'react'
import { useCollectionState, type ActivityEventHint } from '@/hooks/useCollectionState'
import type {
  AlignmentPayload,
  AlignmentItem,
  AlignmentItemStatus,
  AlignmentItemType,
  AlignmentArtifactLink,
  AlignmentPhoto,
  CostImpactStatus,
  ScheduleImpactStatus,
  WaitingOnRole,
} from '@/data/alignment'
import { DEFAULT_ALIGNMENT_PAYLOAD, RESOLVED_STATUSES } from '@/data/alignment'

function ensureShape(raw: unknown): AlignmentPayload {
  if (!raw || typeof raw !== 'object') return DEFAULT_ALIGNMENT_PAYLOAD
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.items)) return DEFAULT_ALIGNMENT_PAYLOAD
  const nextItemNumber = typeof obj.nextItemNumber === 'number'
    ? obj.nextItemNumber
    : (obj.items as unknown[]).length + 1
  return {
    version: 1,
    nextItemNumber,
    items: obj.items as AlignmentItem[],
  }
}

function genId() {
  return `al_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function now() {
  return new Date().toISOString()
}

export function useAlignmentState(opts?: { collectionId?: string | null }) {
  const collResult = useCollectionState<AlignmentPayload>({
    collectionId: opts?.collectionId ?? null,
    toolKey: 'project_alignment',
    localStorageKey: 'hhc_alignment_v1',
    defaultValue: DEFAULT_ALIGNMENT_PAYLOAD,
  })

  const { state: rawState, setState, isLoaded, isSyncing, noAccess } = collResult
  const collectionTitle = collResult.title

  function mapAccess(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
    if (a === 'OWNER') return 'OWNER'
    if (a === 'EDITOR' || a === 'EDIT') return 'EDIT'
    if (a === 'VIEWER' || a === 'VIEW') return 'VIEW'
    return a as 'OWNER' | 'EDIT' | 'VIEW' | null
  }
  const access = mapAccess(collResult.access)
  const readOnly = access === 'VIEW'

  const payload = ensureShape(rawState)

  // ── Item CRUD ──

  const addItem = useCallback(
    (item: {
      title: string
      current_issue: string
      type?: AlignmentItemType
      area_label?: string
      summary?: string
      original_expectation?: string
      proposed_resolution?: string
      current_agreed_answer?: string
      cost_impact_status?: CostImpactStatus
      cost_impact_amount_text?: string
      schedule_impact_status?: ScheduleImpactStatus
      schedule_impact_text?: string
      waiting_on_role?: WaitingOnRole
      created_by_name?: string
      created_by_email?: string
    }) => {
      const id = genId()
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'item',
        entityId: id,
        summaryText: `Created alignment item: "${item.title}"`,
        entityLabel: item.title,
      }]
      setState((prev) => ({
        ...prev,
        nextItemNumber: prev.nextItemNumber + 1,
        items: [
          ...prev.items,
          {
            id,
            itemNumber: prev.nextItemNumber,
            title: item.title,
            type: item.type || 'open_question',
            status: 'open' as AlignmentItemStatus,
            area_label: item.area_label || '',
            summary: item.summary || '',
            original_expectation: item.original_expectation || '',
            current_issue: item.current_issue,
            proposed_resolution: item.proposed_resolution || '',
            current_agreed_answer: item.current_agreed_answer || '',
            cost_impact_status: item.cost_impact_status || 'unknown',
            cost_impact_amount_text: item.cost_impact_amount_text || '',
            schedule_impact_status: item.schedule_impact_status || 'unknown',
            schedule_impact_text: item.schedule_impact_text || '',
            waiting_on_role: item.waiting_on_role || 'none',
            artifact_links: [],
            photos: [],
            guest_responses: [],
            created_by_name: item.created_by_name,
            created_by_email: item.created_by_email,
            created_at: ts,
            updated_at: ts,
          },
        ],
      }), events)
      return id
    },
    [setState]
  )

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<AlignmentItem, 'id' | 'itemNumber' | 'created_at' | 'artifact_links' | 'photos' | 'guest_responses'>>) => {
      const events: ActivityEventHint[] = []
      const item = payload.items.find((i) => i.id === id)
      const title = item?.title || 'item'

      // Log status changes
      if (updates.status && updates.status !== item?.status) {
        const isResolving = RESOLVED_STATUSES.has(updates.status)
        events.push({
          action: isResolving ? 'resolved' : 'status_changed',
          entityType: 'item',
          entityId: id,
          summaryText: isResolving
            ? `Resolved #${item?.itemNumber}: "${title}"`
            : `Changed #${item?.itemNumber} status to ${updates.status}`,
          entityLabel: title,
        })
      }

      // Log agreed answer changes + auto-set answer metadata
      if (updates.current_agreed_answer !== undefined && updates.current_agreed_answer !== item?.current_agreed_answer) {
        updates.answer_updated_at = now()
        events.push({
          action: 'answer_updated',
          entityType: 'item',
          entityId: id,
          summaryText: `Updated agreed answer on #${item?.itemNumber}: "${title}"`,
          entityLabel: title,
        })
      }

      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) => {
          if (it.id !== id) return it
          const updated = { ...it, ...updates, updated_at: now() }
          // Set resolved_at when entering a resolved status
          if (updates.status && RESOLVED_STATUSES.has(updates.status) && !it.resolved_at) {
            updated.resolved_at = now()
          }
          // Clear resolved_at when re-opening
          if (updates.status && !RESOLVED_STATUSES.has(updates.status) && it.resolved_at) {
            updated.resolved_at = undefined
          }
          return updated
        }),
      }), events.length > 0 ? events : undefined)
    },
    [setState, payload.items]
  )

  const deleteItem = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it.id !== id),
      }))
    },
    [setState]
  )

  // ── Supersede ──

  const markSuperseded = useCallback(
    (oldItemId: string, newItemId: string) => {
      const oldItem = payload.items.find((i) => i.id === oldItemId)
      const newItem = payload.items.find((i) => i.id === newItemId)
      const events: ActivityEventHint[] = [{
        action: 'status_changed',
        entityType: 'item',
        entityId: oldItemId,
        summaryText: `#${oldItem?.itemNumber} superseded by #${newItem?.itemNumber}: "${newItem?.title}"`,
        entityLabel: oldItem?.title || 'item',
      }]
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) => {
          if (it.id === oldItemId) {
            return { ...it, status: 'superseded' as AlignmentItemStatus, superseded_by_id: newItemId, resolved_at: it.resolved_at || now(), updated_at: now() }
          }
          if (it.id === newItemId) {
            return { ...it, supersedes_id: oldItemId, updated_at: now() }
          }
          return it
        }),
      }), events)
    },
    [setState, payload.items]
  )

  // ── Artifact Links ──

  const addArtifactLink = useCallback(
    (itemId: string, link: Omit<AlignmentArtifactLink, 'id' | 'created_at'>) => {
      const linkId = genId()
      const item = payload.items.find((i) => i.id === itemId)
      const events: ActivityEventHint[] = [{
        action: 'artifact_linked',
        entityType: 'item',
        entityId: itemId,
        summaryText: `Linked #${item?.itemNumber} to ${link.entity_label}`,
        entityLabel: item?.title || 'item',
      }]
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId
            ? { ...it, artifact_links: [...it.artifact_links, { ...link, id: linkId, created_at: now() }], updated_at: now() }
            : it
        ),
      }), events)
      return linkId
    },
    [setState, payload.items]
  )

  const removeArtifactLink = useCallback(
    (itemId: string, linkId: string) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId
            ? { ...it, artifact_links: it.artifact_links.filter((l) => l.id !== linkId), updated_at: now() }
            : it
        ),
      }))
    },
    [setState]
  )

  // ── Photos ──

  const addPhoto = useCallback(
    (itemId: string, photo: Omit<AlignmentPhoto, 'id' | 'created_at'>) => {
      const photoId = genId()
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId
            ? { ...it, photos: [...it.photos, { ...photo, id: photoId, created_at: now() }], updated_at: now() }
            : it
        ),
      }))
      return photoId
    },
    [setState]
  )

  const removePhoto = useCallback(
    (itemId: string, photoId: string) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId
            ? { ...it, photos: it.photos.filter((p) => p.id !== photoId), updated_at: now() }
            : it
        ),
      }))
    },
    [setState]
  )

  return {
    payload,
    isLoaded,
    isSyncing,
    access,
    readOnly,
    noAccess,
    title: collectionTitle,
    projectId: collResult.projectId,
    addItem,
    updateItem,
    deleteItem,
    markSuperseded,
    addArtifactLink,
    removeArtifactLink,
    addPhoto,
    removePhoto,
  }
}

export type AlignmentStateAPI = ReturnType<typeof useAlignmentState>
