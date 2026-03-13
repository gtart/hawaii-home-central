import type { ChangeStatus, PlanStatus, DocType } from '@/data/project-summary'

// ── Change status config (v2 — 6 statuses) ──

export const CHANGE_STATUS_CONFIG: Record<ChangeStatus, { label: string; color: string; bgColor: string }> = {
  requested: {
    label: 'Requested',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  awaiting_homeowner: {
    label: 'Awaiting Homeowner',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  approved_by_homeowner: {
    label: 'Approved by Homeowner',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  accepted_by_contractor: {
    label: 'Accepted by Contractor',
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
  },
  done: {
    label: 'Done',
    color: 'text-cream/60',
    bgColor: 'bg-cream/5',
  },
  closed: {
    label: 'Closed',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
}

// Ordered list for dropdown (not click-cycle)
export const CHANGE_STATUS_ORDER: ChangeStatus[] = [
  'requested', 'awaiting_homeowner', 'approved_by_homeowner', 'accepted_by_contractor', 'done', 'closed',
]

// ── Plan status config ──

export const PLAN_STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bgColor: string }> = {
  draft: {
    label: 'Draft',
    color: 'text-cream/50',
    bgColor: 'bg-cream/5',
  },
  shared: {
    label: 'Shared',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  acknowledged: {
    label: 'Acknowledged',
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
  },
}

export const PLAN_STATUS_ORDER: PlanStatus[] = ['draft', 'shared', 'confirmed', 'acknowledged']

// ── Document type labels ──

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  plan: 'Plan',
  contract: 'Contract',
  spec: 'Spec',
  permit: 'Permit',
  pricing: 'Pricing',
  other: 'Other',
}
