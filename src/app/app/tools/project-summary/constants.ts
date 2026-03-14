import type { ChangeStatus, PlanStatus, DocType } from '@/data/project-summary'

// ── Change status config (v2 — 6 statuses) ──

export const CHANGE_STATUS_CONFIG: Record<ChangeStatus, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  requested: {
    label: 'Proposed Change',
    shortLabel: 'Proposed',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/12',
  },
  awaiting_homeowner: {
    label: 'Needs Your Review',
    shortLabel: 'Review',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/12',
  },
  approved_by_homeowner: {
    label: 'Approved Change',
    shortLabel: 'Approved',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/12',
  },
  accepted_by_contractor: {
    label: 'Accepted by Contractor',
    shortLabel: 'Accepted',
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/12',
  },
  done: {
    label: 'Added to Plan',
    shortLabel: 'In Plan',
    color: 'text-cream/70',
    bgColor: 'bg-cream/8',
  },
  closed: {
    label: 'Not Moving Forward',
    shortLabel: 'Closed',
    color: 'text-red-400',
    bgColor: 'bg-red-400/12',
  },
}

// Ordered list for dropdown (not click-cycle)
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
