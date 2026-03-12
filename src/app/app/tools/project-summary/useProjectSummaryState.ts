'use client'

import { useCallback } from 'react'
import { useCollectionState, type ActivityEventHint } from '@/hooks/useCollectionState'
import type {
  ProjectSummaryPayload,
  SummaryDocument,
  SummaryChange,
  SummaryDecision,
  SummaryLink,
  ChangeAttachment,
  ChangeStatus,
  DecisionStatus,
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

  // ── Summary ──

  const updateSummary = useCallback(
    (updates: Partial<ProjectSummaryPayload['summary']>) => {
      const events: ActivityEventHint[] = [{
        action: 'updated',
        entityType: 'summary',
        summaryText: 'Updated project summary',
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          summary: { ...p.summary, ...updates, updated_at: now() },
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
            status: change.status || 'proposed',
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
    (id: string, updates: Partial<Omit<SummaryChange, 'id' | 'created_at' | 'links'>>) => {
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
        return {
          ...p,
          changes: p.changes.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: now() } : c
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

  // ── Open Decisions ──

  const addDecision = useCallback(
    (decision: { title: string; description?: string }) => {
      const id = genId()
      const ts = now()
      const events: ActivityEventHint[] = [{
        action: 'created',
        entityType: 'decision',
        entityId: id,
        summaryText: `Added open decision: "${decision.title}"`,
        entityLabel: decision.title,
      }]
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          openDecisions: [...p.openDecisions, {
            id,
            title: decision.title,
            description: decision.description,
            status: 'open' as const,
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

  const updateDecision = useCallback(
    (id: string, updates: Partial<Omit<SummaryDecision, 'id' | 'created_at' | 'links'>>) => {
      const events: ActivityEventHint[] = []
      const existing = payload.openDecisions.find((d) => d.id === id)

      if (updates.status && updates.status !== existing?.status) {
        const statusLabels: Record<string, string> = {
          open: 'Reopened',
          pending_homeowner: 'Pending Homeowner',
          pending_contractor: 'Pending Contractor',
          approved: 'Approved',
          closed: 'Closed',
        }
        const label = statusLabels[updates.status] || updates.status
        events.push({
          action: updates.status === 'closed' ? 'resolved' : updates.status === 'open' ? 'reopened' : 'status_changed',
          entityType: 'decision',
          entityId: id,
          summaryText: `${label}: "${existing?.title}"`,
          entityLabel: existing?.title || 'decision',
        })
      }

      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          openDecisions: p.openDecisions.map((d) =>
            d.id === id ? { ...d, ...updates, updated_at: now() } : d
          ),
        }
      }, events.length > 0 ? events : undefined)
    },
    [setState, payload.openDecisions]
  )

  const deleteDecision = useCallback(
    (id: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          openDecisions: p.openDecisions.filter((d) => d.id !== id),
        }
      })
    },
    [setState]
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

  // ── Links (on changes and decisions) ──

  const addLink = useCallback(
    (section: 'changes' | 'openDecisions', entryId: string, link: Omit<SummaryLink, 'id'>) => {
      const linkId = genId()
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          [section]: (p[section] as Array<SummaryChange | SummaryDecision>).map((entry) =>
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
    (section: 'changes' | 'openDecisions', entryId: string, linkId: string) => {
      setState((prev) => {
        const p = ensureShape(prev)
        return {
          ...p,
          [section]: (p[section] as Array<SummaryChange | SummaryDecision>).map((entry) =>
            entry.id === entryId
              ? { ...entry, links: entry.links.filter((l) => l.id !== linkId), updated_at: now() }
              : entry
          ),
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
    // Summary
    updateSummary,
    // Documents
    addDocument,
    updateDocument,
    deleteDocument,
    // Changes
    addChange,
    updateChange,
    deleteChange,
    addChangeAttachment,
    removeChangeAttachment,
    updateChangePrivateNotes,
    // Decisions
    addDecision,
    updateDecision,
    deleteDecision,
    // Links
    addLink,
    removeLink,
  }
}

export type ProjectSummaryStateAPI = ReturnType<typeof useProjectSummaryState>
