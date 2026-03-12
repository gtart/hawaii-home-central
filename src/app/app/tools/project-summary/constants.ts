import type { ChangeStatus, DecisionStatus, DocType } from '@/data/project-summary'

// ── Change status config ──

export const CHANGE_STATUS_CONFIG: Record<ChangeStatus, { label: string; color: string; bgColor: string }> = {
  proposed: {
    label: 'Proposed',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  not_approved: {
    label: 'Not Approved',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
}

// ── Decision status config ──

export const DECISION_STATUS_CONFIG: Record<DecisionStatus, { label: string; color: string; bgColor: string }> = {
  open: {
    label: 'Open',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  pending_homeowner: {
    label: 'Pending Homeowner',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  pending_contractor: {
    label: 'Pending Contractor',
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
  },
  approved: {
    label: 'Approved',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  closed: {
    label: 'Closed',
    color: 'text-cream/40',
    bgColor: 'bg-cream/5',
  },
}

// ── Change status cycle (click-to-toggle) ──

export const CHANGE_STATUS_CYCLE: ChangeStatus[] = ['proposed', 'approved', 'not_approved']

// ── Decision status cycle ──

export const DECISION_STATUS_CYCLE: DecisionStatus[] = ['open', 'pending_homeowner', 'pending_contractor', 'approved', 'closed']

// ── Document type labels ──

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  plan: 'Plan',
  contract: 'Contract',
  spec: 'Spec',
  permit: 'Permit',
  pricing: 'Pricing',
  other: 'Other',
}
