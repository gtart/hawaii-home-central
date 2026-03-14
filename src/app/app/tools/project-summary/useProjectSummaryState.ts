'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
  OpenItem,
  OpenItemStatus,
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
  const { data: session } = useSession()
  const currentUserName = session?.user?.name ?? undefined

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

  // ── Plan: Approve (PCV1-003, PCV1-004) ──

  const approvePlan = useCallback(
    (actor?: string, note?: string) => {
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'status_changed',
        entityType: 'summary',
        summaryText: 'Plan approved and locked',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const currentRevision = p.plan.revision_number ?? 0
        const milestone: Milestone = {
          id: genId(),
          event: 'plan_approved',
          label: `Plan approved${currentRevision > 0 ? ` (revision ${currentRevision})` : ''}`,
          ...(actor ? { actor } : {}),
          ...(note ? { note } : {}),
          timestamp: ts,
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            status: 'approved' as PlanStatus,
            status_changed_at: ts,
            content_changed_since_status: false,
            approved_at: ts,
            ...(actor ? { approved_by: actor } : {}),
            updated_at: ts,
          },
          milestones: [...p.milestones, milestone],
        }
      }, events)
    },
    [setState]
  )

  // ── Plan: Unlock (PCV1-003, PCV1-004) ──

  const unlockPlan = useCallback(
    (actor?: string, reason?: string) => {
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'status_changed',
        entityType: 'summary',
        summaryText: 'Plan unlocked for revision',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const milestone: Milestone = {
          id: genId(),
          event: 'plan_unlocked',
          label: 'Plan unlocked for revision',
          ...(actor ? { actor } : {}),
          ...(reason ? { note: reason } : {}),
          timestamp: ts,
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            status: 'unlocked' as PlanStatus,
            status_changed_at: ts,
            content_changed_since_status: false,
            unlocked_at: ts,
            ...(actor ? { unlocked_by: actor } : {}),
            ...(reason ? { unlock_reason: reason } : {}),
            updated_at: ts,
          },
          milestones: [...p.milestones, milestone],
        }
      }, events)
    },
    [setState]
  )

  // ── Plan: Re-approve after revision (PCV1-004) ──

  const reapprovePlan = useCallback(
    (actor?: string, note?: string) => {
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'status_changed',
        entityType: 'summary',
        summaryText: 'Revised plan re-approved',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const nextRevision = (p.plan.revision_number ?? 0) + 1
        const milestone: Milestone = {
          id: genId(),
          event: 'plan_approved',
          label: `Plan re-approved (revision ${nextRevision})`,
          ...(actor ? { actor } : {}),
          ...(note ? { note } : {}),
          timestamp: ts,
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            status: 'approved' as PlanStatus,
            status_changed_at: ts,
            content_changed_since_status: false,
            approved_at: ts,
            ...(actor ? { approved_by: actor } : {}),
            // Clear unlock metadata
            unlocked_at: undefined,
            unlocked_by: undefined,
            unlock_reason: undefined,
            revision_number: nextRevision,
            updated_at: ts,
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

  // ── Plan: Open Items (PCV1-009 through PCV1-014) ──

  const addOpenItem = useCallback(
    (text: string, createdBy?: string) => {
      const id = genId()
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'plan_item',
        entityId: id,
        summaryText: `Added open item: "${text}"`,
        entityLabel: text,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const newItem: OpenItem = {
          id,
          text,
          status: 'open',
          ...(createdBy ? { created_by: createdBy } : {}),
          created_at: ts,
          updated_at: ts,
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            open_items: [...p.plan.open_items, newItem],
            content_changed_since_status: true,
            updated_at: ts,
          },
        }
      }, events)
      return id
    },
    [setState]
  )

  const updateOpenItem = useCallback(
    (id: string, updates: { text?: string; status?: OpenItemStatus; waiting_on?: string }, updatedBy?: string) => {
      const events: ActivityEventHint[] = []
      if (updates.status) {
        events.push({
          action: 'status_changed',
          entityType: 'plan_item',
          entityId: id,
          summaryText: `Open item status changed to ${updates.status}`,
        })
      }
      setState((prev) => {
        const p = ensureShape(prev)
        const ts = now()
        return {
          ...p,
          plan: {
            ...p.plan,
            open_items: p.plan.open_items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...(updates.text !== undefined ? { text: updates.text } : {}),
                    ...(updates.status ? { status: updates.status } : {}),
                    ...(updates.waiting_on !== undefined ? { waiting_on: updates.waiting_on || undefined } : {}),
                    ...(updatedBy ? { updated_by: updatedBy } : {}),
                    updated_at: ts,
                  }
                : item
            ),
            content_changed_since_status: true,
            updated_at: ts,
          },
        }
      }, events.length > 0 ? events : undefined)
    },
    [setState]
  )

  const resolveOpenItem = useCallback(
    (id: string, note?: string, actor?: string) => {
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'status_changed',
        entityType: 'plan_item',
        entityId: id,
        summaryText: 'Open item resolved',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        const milestone: Milestone = {
          id: genId(),
          event: 'open_item_resolved',
          label: `Resolved open item: ${p.plan.open_items.find((i) => i.id === id)?.text || 'item'}`,
          ...(actor ? { actor } : {}),
          ...(note ? { note } : {}),
          timestamp: ts,
        }
        return {
          ...p,
          plan: {
            ...p.plan,
            open_items: p.plan.open_items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: 'resolved' as OpenItemStatus,
                    resolved_at: ts,
                    ...(actor ? { resolved_by: actor } : {}),
                    ...(note ? { resolution_note: note } : {}),
                    updated_at: ts,
                  }
                : item
            ),
            content_changed_since_status: true,
            updated_at: ts,
          },
          milestones: [...p.milestones, milestone],
        }
      }, events)
    },
    [setState]
  )

  const deleteOpenItem = useCallback(
    (id: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          plan: {
            ...p.plan,
            open_items: p.plan.open_items.filter((i) => i.id !== id),
            content_changed_since_status: true,
            updated_at: now(),
          },
        }
      })
    },
    [setState]
  )

  // ── Change: Open Items (PCV1-009) ──

  const addChangeOpenItem = useCallback(
    (changeId: string, text: string, createdBy?: string) => {
      const id = genId()
      const ts = now()
      setState((prev) => {
        const p = ensureShape(prev)
        const newItem: OpenItem = {
          id,
          text,
          status: 'open',
          ...(createdBy ? { created_by: createdBy } : {}),
          created_at: ts,
          updated_at: ts,
        }
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId
              ? { ...c, open_items: [...(c.open_items || []), newItem], updated_at: ts }
              : c
          ),
        }
      })
      return id
    },
    [setState]
  )

  const updateChangeOpenItem = useCallback(
    (changeId: string, itemId: string, updates: { text?: string; status?: OpenItemStatus; waiting_on?: string; resolution_note?: string }, actor?: string) => {
      const ts = now()
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId
              ? {
                  ...c,
                  open_items: (c.open_items || []).map((item) =>
                    item.id === itemId
                      ? {
                          ...item,
                          ...(updates.text !== undefined ? { text: updates.text } : {}),
                          ...(updates.status ? { status: updates.status } : {}),
                          ...(updates.waiting_on !== undefined ? { waiting_on: updates.waiting_on || undefined } : {}),
                          ...(updates.status === 'resolved' ? { resolved_at: ts, ...(actor ? { resolved_by: actor } : {}), ...(updates.resolution_note ? { resolution_note: updates.resolution_note } : {}) } : {}),
                          ...(actor ? { updated_by: actor } : {}),
                          updated_at: ts,
                        }
                      : item
                  ),
                  updated_at: ts,
                }
              : c
          ),
        }
      })
    },
    [setState]
  )

  const deleteChangeOpenItem = useCallback(
    (changeId: string, itemId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === changeId
              ? { ...c, open_items: (c.open_items || []).filter((i) => i.id !== itemId), updated_at: now() }
              : c
          ),
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
    (change: { title: string; description?: string; rationale?: string; requested_by?: string; status?: ChangeStatus; cost_impact?: string }) => {
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
            rationale: change.rationale,
            requested_by: change.requested_by,
            status: change.status || 'requested',
            cost_impact: change.cost_impact,
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
              updated_by: currentUserName,
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
    (changeId: string, actor?: string, note?: string) => {
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
          ...(note ? { note } : {}),
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
    approvePlan,
    unlockPlan,
    reapprovePlan,
    addPlanItem,
    updatePlanItem,
    deletePlanItem,
    // Open Items (Plan)
    addOpenItem,
    updateOpenItem,
    resolveOpenItem,
    deleteOpenItem,
    // Open Items (Change)
    addChangeOpenItem,
    updateChangeOpenItem,
    deleteChangeOpenItem,
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
