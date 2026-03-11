import type { AlignmentItemStatus, AlignmentItemType, CostImpactStatus, ScheduleImpactStatus, WaitingOnRole } from '@/data/alignment'

export const STATUS_CONFIG: Record<AlignmentItemStatus, { label: string; dot: string; bg: string; text: string }> = {
  open:                   { label: 'Open',                dot: 'bg-amber-400',   bg: 'bg-amber-400/10',   text: 'text-amber-400' },
  waiting_on_homeowner:   { label: 'Waiting on You',      dot: 'bg-blue-400',    bg: 'bg-blue-400/10',    text: 'text-blue-400' },
  waiting_on_contractor:  { label: 'Waiting on Contractor', dot: 'bg-orange-400', bg: 'bg-orange-400/10',  text: 'text-orange-400' },
  needs_pricing:          { label: 'Needs Pricing',       dot: 'bg-purple-400',  bg: 'bg-purple-400/10',  text: 'text-purple-400' },
  needs_decision:         { label: 'Needs Decision',      dot: 'bg-rose-400',    bg: 'bg-rose-400/10',    text: 'text-rose-400' },
  accepted:               { label: 'Accepted',            dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  rejected:               { label: 'Rejected',            dot: 'bg-red-400',     bg: 'bg-red-400/10',     text: 'text-red-400' },
  implemented:            { label: 'Implemented',         dot: 'bg-teal-400',    bg: 'bg-teal-400/10',    text: 'text-teal-400' },
  superseded:             { label: 'Superseded',          dot: 'bg-cream/30',    bg: 'bg-cream/5',        text: 'text-cream/40' },
}

export const TYPE_CONFIG: Record<AlignmentItemType, { label: string; short: string }> = {
  change_request:      { label: 'Change Request',      short: 'Change' },
  scope_clarification: { label: 'Scope Clarification', short: 'Clarify' },
  scope_omission:      { label: 'Scope Omission',      short: 'Omission' },
  plan_mismatch:       { label: 'Plan Mismatch',       short: 'Mismatch' },
  design_correction:   { label: 'Design Correction',   short: 'Design' },
  open_question:       { label: 'Open Question',       short: 'Question' },
  allowance_upgrade:   { label: 'Allowance / Upgrade', short: 'Upgrade' },
  site_condition:      { label: 'Site Condition',       short: 'Site' },
  version_conflict:    { label: 'Version Conflict',    short: 'Version' },
}

export const COST_IMPACT_CONFIG: Record<CostImpactStatus, { label: string; className: string }> = {
  none:      { label: 'None',      className: 'text-cream/40' },
  possible:  { label: 'Possible',  className: 'text-amber-400' },
  confirmed: { label: 'Confirmed', className: 'text-red-400' },
  unknown:   { label: 'Unknown',   className: 'text-cream/50' },
}

export const SCHEDULE_IMPACT_CONFIG: Record<ScheduleImpactStatus, { label: string; className: string }> = {
  none:      { label: 'None',      className: 'text-cream/40' },
  possible:  { label: 'Possible',  className: 'text-amber-400' },
  confirmed: { label: 'Confirmed', className: 'text-red-400' },
  unknown:   { label: 'Unknown',   className: 'text-cream/50' },
}

export const WAITING_ON_CONFIG: Record<WaitingOnRole, { label: string }> = {
  homeowner:  { label: 'Homeowner' },
  contractor: { label: 'Contractor' },
  designer:   { label: 'Designer' },
  vendor:     { label: 'Vendor' },
  none:       { label: 'No one' },
}

/** Status groups for filter chips */
export const STATUS_GROUPS = {
  active: ['open', 'waiting_on_homeowner', 'waiting_on_contractor', 'needs_pricing', 'needs_decision'] as AlignmentItemStatus[],
  resolved: ['accepted', 'rejected', 'implemented'] as AlignmentItemStatus[],
  terminal: ['superseded'] as AlignmentItemStatus[],
}
