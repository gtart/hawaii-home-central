import type { ChangeStatus, PlanStatus, DocType } from '@/data/project-summary'

// ── Change status config (v2 — 6 statuses, underlying data model) ──

export const CHANGE_STATUS_CONFIG: Record<ChangeStatus, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  requested: {
    label: 'Noted',
    shortLabel: 'Noted',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/12',
  },
  awaiting_homeowner: {
    label: 'Needs Confirmation',
    shortLabel: 'Confirm',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
  },
  approved_by_homeowner: {
    label: 'Added to Plan',
    shortLabel: 'Added',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  accepted_by_contractor: {
    label: 'Added to Plan',
    shortLabel: 'Added',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  done: {
    label: 'Added to Plan',
    shortLabel: 'Added',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  closed: {
    label: 'No Longer Needed',
    shortLabel: 'Not Needed',
    color: 'text-cream/45',
    bgColor: 'bg-cream/8',
  },
}

// ── Homeowner-friendly 4-status model ──
// Maps 4 user-facing statuses to underlying storage statuses

export type ChangeLogStatus = 'noted' | 'needs_confirmation' | 'added_to_plan' | 'superseded'

export const CHANGE_LOG_STATUS_CONFIG: Record<ChangeLogStatus, { label: string; color: string; bgColor: string; storageStatus: ChangeStatus }> = {
  noted: {
    label: 'Noted',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/12',
    storageStatus: 'requested',
  },
  needs_confirmation: {
    label: 'Needs Confirmation',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
    storageStatus: 'awaiting_homeowner',
  },
  added_to_plan: {
    label: 'Added to Plan',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
    storageStatus: 'approved_by_homeowner',
  },
  superseded: {
    label: 'No Longer Needed',
    color: 'text-cream/45',
    bgColor: 'bg-cream/8',
    storageStatus: 'closed',
  },
}

export const CHANGE_LOG_STATUS_ORDER: ChangeLogStatus[] = ['noted', 'needs_confirmation', 'added_to_plan', 'superseded']

/** Map a storage ChangeStatus to the homeowner-facing status */
export function toChangeLogStatus(status: ChangeStatus): ChangeLogStatus {
  switch (status) {
    case 'requested':
      return 'noted'
    case 'awaiting_homeowner':
      return 'needs_confirmation'
    case 'approved_by_homeowner':
    case 'accepted_by_contractor':
    case 'done':
      return 'added_to_plan'
    case 'closed':
      return 'superseded'
  }
}

// ── Legacy simplified status model (kept for backward compat) ──
export type SimpleChangeStatus = 'under_review' | 'accepted' | 'canceled'
export const SIMPLE_STATUS_CONFIG: Record<SimpleChangeStatus, { label: string; color: string; bgColor: string; storageStatus: ChangeStatus }> = {
  under_review: { label: 'Under Review', color: 'text-amber-400', bgColor: 'bg-amber-400/12', storageStatus: 'requested' },
  accepted: { label: 'Accepted', color: 'text-emerald-400', bgColor: 'bg-emerald-400/12', storageStatus: 'accepted_by_contractor' },
  canceled: { label: 'Canceled', color: 'text-red-400', bgColor: 'bg-red-400/12', storageStatus: 'closed' },
}
export const SIMPLE_STATUS_ORDER: SimpleChangeStatus[] = ['under_review', 'accepted', 'canceled']
export function toSimpleStatus(status: ChangeStatus): SimpleChangeStatus {
  switch (status) {
    case 'requested': case 'awaiting_homeowner': return 'under_review'
    case 'approved_by_homeowner': case 'accepted_by_contractor': case 'done': return 'accepted'
    case 'closed': return 'canceled'
  }
}

// Ordered list for dropdown — kept for compatibility
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

// ── Change categories ──

export const CHANGE_CATEGORIES = [
  'Plan',
  'Electrical',
  'Plumbing',
  'Cabinets',
  'Appliances',
  'Finish',
  'Structural',
  'Field Note',
  'Scope',
  'Pricing',
] as const

export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number]
