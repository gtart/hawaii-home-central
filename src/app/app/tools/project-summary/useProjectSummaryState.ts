'use client'

import { useCallback } from 'react'
import { useCollectionState, type ActivityEventHint } from '@/hooks/useCollectionState'
import type {
  ProjectSummaryPayload,
  SummaryDocument,
  SummaryChange,
  SummaryLink,
  ChangeAttachment,
  ChangeStatus,
  PlanStatus,
  PlanItemCategory,
  PlanItem,
  Milestone,
} from '@/data/project-summary'
import { DEFAULT_PROJECT_SUMMARY_PAYLOAD, ensureShape } from '@/data/project-summary'

function genId() {
  return `ps_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function now() {
  return new Date().toISOString()
}

export function useProjectSummaryState(opts?: { collectionId?: string | null }) {
  const collResult = useCollectionState<ProjectSummaryPayload>({
    collectionId: opts?.collectionId ?? null,
    toolKey: 'project_summary',
    localStorageKey: 'hhc_project_summary_v1',
    defaultValue: DEFAULT_PROJECT_SUMMARY_PAYLOAD,
  })

  const { state: rawState, setState, isLoaded, isSyncing, noAccess } = collResult

  function mapAccess(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
    if (a === 'OWNER') return 'OWNER'
    if (a === 'EDITOR' || a === 'EDIT') return 'EDIT'
    if (a === 'VIEWER' || a === 'VIEW') return 'VIEW'
    return a as 'OWNER' | 'EDIT' | 'VIEW' | null
  }

  const access = mapAccess(collResult.access)
  const readOnly = access === 'VIEW'
  const payload = ensureShape(rawState)

  // ── Plan: Scope ──

  const updatePlanScope = useCallback(
    (scope: string) => {
      const events: ActivityEventHint[] = [{
        action: 'updated',
        entityType: 'summary',
        summaryText: 'Updated plan scope',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          plan: { ...p.plan, scope, content_changed_since_status: true, updated_at: now() },
        }
      }, events)
    },
    [setState]
  )

  // ── Plan: Status ──

  const updatePlanStatus = useCallback(
    (status: PlanStatus, actor?: string, note?: string) => {
      const events: ActivityEventHint[] = [{
        action: 'status_changed',
        entityType: 'summary',
        summaryText: `Plan status changed to ${status}`,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const milestone: Milestone = {
          id: genId(),
          event: `plan_${status}`,
          label: `Plan marked as ${status}`,
          ...(actor ? { actor } : {}),
          ...(note ? { note } : {}),
          timestamp: now(),
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            status,
            status_changed_at: now(),
            content_changed_since_status: false,
            updated_at: now(),
          },
          milestones: [...p.milestones, milestone],
        }
      }, events)
    },
    [setState]
  )

  // ── Plan: Items ──

  const addPlanItem = useCallback(
    (category: PlanItemCategory, text: string, createdBy?: string) => {
      const id = genId()
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'plan_item',
        entityId: id,
        summaryText: `Added ${category.replace(/_/g, ' ')} item: "${text}"`,
        entityLabel: text,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const newItem: PlanItem = {
          id,
          text,
          category,
          ...(createdBy ? { created_by: createdBy } : {}),
          created_at: ts,
          updated_at: ts,
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            [category]: [...p.plan[category], newItem],
            content_changed_since_status: true,
            updated_at: ts,
          },
        }
      }, events)
      return id
    },
    [setState]
  )

  const updatePlanItem = useCallback(
    (id: string, updates: { text?: string; category?: PlanItemCategory }, updatedBy?: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        const ts = now()

        // If category changed, move between lists
        if (updates.category) {
          const categories: PlanItemCategory[] = ['included', 'not_included', 'still_to_decide']
          let item: PlanItem | undefined
          let sourceCategory: PlanItemCategory | undefined

          for (const cat of categories) {
            const found = p.plan[cat].find((i) => i.id === id)
            if (found) {
              item = found
              sourceCategory = cat
              break
            }
          }

          if (!item || !sourceCategory) return p

          const updatedItem = {
            ...item,
            ...(updates.text !== undefined ? { text: updates.text } : {}),
            category: updates.category,
            ...(updatedBy ? { updated_by: updatedBy } : {}),
            updated_at: ts,
          }

          const newPlan = { ...p.plan, content_changed_since_status: true, updated_at: ts }

          if (sourceCategory === updates.category) {
            // Same category, just update text
            newPlan[sourceCategory] = newPlan[sourceCategory].map((i) =>
              i.id === id ? updatedItem : i
            )
          } else {
            // Move to new category
            newPlan[sourceCategory] = newPlan[sourceCategory].filter((i) => i.id !== id)
            newPlan[updates.category] = [...newPlan[updates.category], updatedItem]
          }

          return { ...p, plan: newPlan }
        }

        // No category change — update text in place
        const categories: PlanItemCategory[] = ['included', 'not_included', 'still_to_decide']
        const newPlan = { ...p.plan, content_changed_since_status: true, updated_at: ts }
        for (const cat of categories) {
          if (newPlan[cat].some((i) => i.id === id)) {
            newPlan[cat] = newPlan[cat].map((i) =>
              i.id === id ? { ...i, ...(updates.text !== undefined ? { text: updates.text } : {}), ...(updatedBy ? { updated_by: updatedBy } : {}), updated_at: ts } : i
            )
            break
          }
        }
        return { ...p, plan: newPlan }
      })
    },
    [setState]
  )

  const deletePlanItem = useCallback(
    (id: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        const ts = now()
        return {
          ...p,
          plan: {
            ...p.plan,
            included: p.plan.included.filter((i) => i.id !== id),
            not_included: p.plan.not_included.filter((i) => i.id !== id),
            still_to_decide: p.plan.still_to_decide.filter((i) => i.id !== id),
            content_changed_since_status: true,
            updated_at: ts,
          },
        }
      })
    },
    [setState]
  )

  // ── Budget ──

  const updateBudget = useCallback(
    (updates: Partial<ProjectSummaryPayload['budget']>) => {
      const events: ActivityEventHint[] = [{
        action: 'updated',
        entityType: 'summary',
        summaryText: 'Updated budget',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          budget: { ...p.budget, ...updates, updated_at: now() },
          plan: { ...p.plan, content_changed_since_status: true },
        }
      }, events)
    },
    [setState]
  )

  // ── Documents ──

  const addDocument = useCallback(
    (doc: Omit<SummaryDocument, 'id' | 'created_at' | 'updated_at' | 'sort_order'>) => {
      const id = genId()
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'document',
        entityId: id,
        summaryText: `Added document: "${doc.label}"`,
        entityLabel: doc.label,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          documents: [...p.documents, { ...doc, id, sort_order: p.documents.length, created_at: ts, updated_at: ts }],
        }
      }, events)
      return id
    },
    [setState]
  )

  const updateDocument = useCallback(
    (id: string, updates: Partial<Omit<SummaryDocument, 'id' | 'created_at'>>) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          documents: p.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updated_at: now() } : d
          ),
        }
      })
    },
    [setState]
  )

  const deleteDocument = useCallback(
    (id: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          documents: p.documents.filter((d) => d.id !== id),
        }
      })
    },
    [setState]
  )

  // ── Changes ──

  const addChange = useCallback(
    (change: { title: string; description?: string; requested_by?: string; status?: ChangeStatus }) => {
      const id = genId()
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'change',
        entityId: id,
        summaryText: `Added change: "${change.title}"`,
        entityLabel: change.title,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: [...p.changes, {
            id,
            title: change.title,
            description: change.description,
            requested_by: change.requested_by,
            status: change.status || 'requested',
            incorporated: false,
            links: [],
            created_at: ts,
            updated_at: ts,
          }],
        }
      }, events)
      return id
    },
    [setState]
  )

  const updateChange = useCallback(
    (id: string, updates: Partial<Omit<SummaryChange, 'id' | 'created_at' | 'links' | 'incorporated' | 'incorporated_at' | 'incorporated_by'>>) => {
      const events: ActivityEventHint[] = []
      const existing = payload.changes.find((c) => c.id === id)

      if (updates.status && updates.status !== existing?.status) {
        events.push({
          action: 'status_changed',
          entityType: 'change',
          entityId: id,
          summaryText: `Changed "${existing?.title}" status to ${updates.status}`,
          entityLabel: existing?.title || 'change',
        })
      }

      setState((prev) => {
        const p = ensureShape(prev)
        const change = p.changes.find((c) => c.id === id)
        if (!change) return p

        // Track if change was edited after contractor acceptance
        let changedSinceAccepted = change.changed_since_accepted
        if (change.status === 'accepted_by_contractor' && !updates.status) {
          changedSinceAccepted = true
        }
        // Reset flag if status is changing
        if (updates.status && updates.status !== change.status) {
          changedSinceAccepted = undefined
        }

        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === id ? {
              ...c,
              ...updates,
              ...(changedSinceAccepted !== undefined ? { changed_since_accepted: changedSinceAccepted } : {}),
              updated_at: now(),
            } : c
          ),
        }
      }, events.length > 0 ? events : undefined)
    },
    [setState, payload.changes]
  )

  const deleteChange = useCallback(
    (id: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.filter((c) => c.id !== id),
        }
      })
    },
    [setState]
  )

  // ── Incorporate Change ──

  const incorporateChange = useCallback(
    (changeId: string, actor?: string) => {
      const existing = payload.changes.find((c) => c.id === changeId)
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'updated',
        entityType: 'change',
        entityId: changeId,
        summaryText: `Incorporated change: "${existing?.title}"`,
        entityLabel: existing?.title || 'change',
      }]

      setState((prev) => {
        const p = ensureShape(prev)
        const milestone: Milestone = {
          id: genId(),
          event: 'change_incorporated',
          label: `Incorporated: ${existing?.title || 'change'}`,
          ...(actor ? { actor } : {}),
          timestamp: ts,
          relatedEntityId: changeId,
        }
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId ? {
              ...c,
              incorporated: true,
              incorporated_at: ts,
              ...(actor ? { incorporated_by: actor } : {}),
              updated_at: ts,
            } : c
          ),
          milestones: [...p.milestones, milestone],
        }
      }, events)
    },
    [setState, payload.changes]
  )

  // ── Change attachments and private notes ──

  const addChangeAttachment = useCallback(
    (changeId: string, attachment: Omit<ChangeAttachment, 'id'>) => {
      const attachId = genId()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'attachment',
        entityId: attachId,
        summaryText: `Added attachment: "${attachment.label}"`,
        entityLabel: attachment.label,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId
              ? { ...c, attachments: [...(c.attachments || []), { ...attachment, id: attachId }], updated_at: now() }
              : c
          ),
        }
      }, events)
      return attachId
    },
    [setState]
  )

  const removeChangeAttachment = useCallback(
    (changeId: string, attachmentId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId
              ? { ...c, attachments: (c.attachments || []).filter((a) => a.id !== attachmentId), updated_at: now() }
              : c
          ),
        }
      })
    },
    [setState]
  )

  const updateChangePrivateNotes = useCallback(
    (changeId: string, notes: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId
              ? { ...c, private_notes: notes || undefined, updated_at: now() }
              : c
          ),
        }
      })
    },
    [setState]
  )

  // ── Links (on changes only) ──

  const addLink = useCallback(
    (entryId: string, link: Omit<SummaryLink, 'id'>) => {
      const linkId = genId()
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((entry) =>
            entry.id === entryId
              ? { ...entry, links: [...entry.links, { ...link, id: linkId }], updated_at: now() }
              : entry
          ),
        }
      })
      return linkId
    },
    [setState]
  )

  const removeLink = useCallback(
    (entryId: string, linkId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((entry) =>
            entry.id === entryId
              ? { ...entry, links: entry.links.filter((l) => l.id !== linkId), updated_at: now() }
              : entry
          ),
        }
      })
    },
    [setState]
  )

  // ── Milestones ──

  const addMilestone = useCallback(
    (event: string, label: string, actor?: string, note?: string, relatedEntityId?: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        const milestone: Milestone = {
          id: genId(),
          event,
          label,
          ...(actor ? { actor } : {}),
          ...(note ? { note } : {}),
          timestamp: now(),
          ...(relatedEntityId ? { relatedEntityId } : {}),
        }
        return {
          ...p,
          milestones: [...p.milestones, milestone],
        }
      })
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
    title: collResult.title,
    projectId: collResult.projectId,
    conflictBanner: collResult.conflictBanner,
    viewOnlyAttempt: collResult.viewOnlyAttempt,
    collectionId: collResult.collectionId,
    // Plan
    updatePlanScope,
    updatePlanStatus,
    addPlanItem,
    updatePlanItem,
    deletePlanItem,
    // Budget
    updateBudget,
    // Documents
    addDocument,
    updateDocument,
    deleteDocument,
    // Changes
    addChange,
    updateChange,
    deleteChange,
    incorporateChange,
    addChangeAttachment,
    removeChangeAttachment,
    updateChangePrivateNotes,
    // Links
    addLink,
    removeLink,
    // Milestones
    addMilestone,
  }
}

export type ProjectSummaryStateAPI = ReturnType<typeof useProjectSummaryState>
