import type { ChangeStatus, PlanStatus, DocType } from '@/data/project-summary'

// ── Change status config (v2 — 6 statuses, underlying data model) ──

export const CHANGE_STATUS_CONFIG: Record<ChangeStatus, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  requested: {
    label: 'Under Review',
    shortLabel: 'Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
  },
  awaiting_homeowner: {
    label: 'Under Review',
    shortLabel: 'Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
  },
  approved_by_homeowner: {
    label: 'Accepted',
    shortLabel: 'Accepted',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  accepted_by_contractor: {
    label: 'Accepted',
    shortLabel: 'Accepted',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  done: {
    label: 'Accepted',
    shortLabel: 'Accepted',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  closed: {
    label: 'Canceled',
    shortLabel: 'Canceled',
    color: 'text-red-400',
    bgColor: 'bg-red-400/12',
  },
}

// ── Simplified v1 status model ──
// Maps the 3 user-facing statuses to underlying storage statuses
export type SimpleChangeStatus = 'under_review' | 'accepted' | 'canceled'

export const SIMPLE_STATUS_CONFIG: Record<SimpleChangeStatus, { label: string; color: string; bgColor: string; storageStatus: ChangeStatus }> = {
  under_review: {
    label: 'Under Review',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
    storageStatus: 'requested',
  },
  accepted: {
    label: 'Accepted',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
    storageStatus: 'accepted_by_contractor',
  },
  canceled: {
    label: 'Canceled',
    color: 'text-red-400',
    bgColor: 'bg-red-400/12',
    storageStatus: 'closed',
  },
}

export const SIMPLE_STATUS_ORDER: SimpleChangeStatus[] = ['under_review', 'accepted', 'canceled']

/** Map a storage ChangeStatus to the simplified user-facing status */
export function toSimpleStatus(status: ChangeStatus): SimpleChangeStatus {
  switch (status) {
    case 'requested':
    case 'awaiting_homeowner':
      return 'under_review'
    case 'approved_by_homeowner':
    case 'accepted_by_contractor':
    case 'done':
      return 'accepted'
    case 'closed':
      return 'canceled'
  }
}

// Ordered list for dropdown (not click-cycle) — kept for compatibility
export const CHANGE_STATUS_ORDER: ChangeStatus[] = [
  'requested', 'awaiting_homeowner', 'approved_by_homeowner', 'accepted_by_contractor', 'done', 'closed',
]

// ── Plan status config ──

export const PLAN_STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bgColor: string; description: string }> = {
  working: {
    label: 'Draft',
    color: 'text-cream/65',
    bgColor: 'bg-cream/8',
    description: 'Your plan is still being put together. Edit freely until you\'re ready to lock it in.',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
    description: 'Your plan is locked. Any changes should go through the change log so you have a record.',
  },
  unlocked: {
    label: 'Unlocked',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
    description: 'Your plan is temporarily unlocked for direct edits. Re-approve when done.',
  },
}

export const PLAN_STATUS_ORDER: PlanStatus[] = ['working', 'approved', 'unlocked']

// ── Document type labels ──

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  plan: 'Plan',
  contract: 'Contract',
  spec: 'Spec',
  permit: 'Permit',
  pricing: 'Pricing',
  other: 'Other',
}
