# Plan & Changes Rebuild v1 — Final Sprint Review

**Sprint:** Plan & Changes Rebuild v1
**Date:** 2026-03-13
**Status:** Complete — 58/58 issues pass

---

## Issue Summary

| Category | Count |
|----------|-------|
| Completed | 58 |
| Partial | 0 |
| Deferred | 0 |
| Merged | 0 |

All 58 issues (PCV1-001 through PCV1-058) across 6 phases are complete.

---

## Schema Changes Made

### Data Model (`src/data/project-summary.ts`)

**Plan status model (Phase A):**
- `PlanStatus = 'working' | 'approved' | 'unlocked'` (3-state model replacing 5-state)
- `CurrentPlan` extended with: `approved_at`, `approved_by`, `unlocked_at`, `unlocked_by`, `unlock_reason`, `revision_number`, `status_changed_at`, `content_changed_since_status`

**Open items model (Phase B):**
- `OpenItemStatus = 'open' | 'waiting' | 'resolved' | 'closed'`
- `OpenItem` interface with resolution metadata (`resolved_at`, `resolved_by`, `resolution_note`, `waiting_on`)
- `open_items: OpenItem[]` on both `CurrentPlan` and `SummaryChange`
- `still_to_decide` deprecated, auto-migrated to `open_items` in `coerceV2()`

**Document scoping (Phase C):**
- `DocScope = 'plan' | 'reference'` on `SummaryDocument`

**Change record enrichment (Phase C, F):**
- `affects_sections?: string[]` on `SummaryChange`
- `rationale?: string` — why the change happened
- `proposed_cost_impact?: string` / `proposed_schedule_impact?: string` — estimates
- `cost_impact` / `schedule_impact` remain as final agreed values

**Backward compatibility:**
- `ensureShape()` / `coerceV2()` silently migrates old data on read
- No database migrations needed — all changes to JSON payload structure

---

## Main UX Changes Made

### Page Structure (Phase D)
- Page reordered: Official Plan → Documents → Change Queue Summary → Change Log → Timeline & History
- Visual separator divides primary (plan record) from secondary (changes/history) zones
- Plan section has stronger visual hierarchy when approved (larger heading, glow, more padding)

### Changes Section (Phases A, D)
- Split into "Pending Changes" and "Change History" groups
- ChangeQueueSummary shows operational metrics at a glance
- Guided incorporation flow ("Add to Official Plan") with dialog

### Open Items (Phase B)
- Full CRUD with status-colored dots and custom dropdown
- Resolution dialog with note capture and milestone creation
- Plan-level and change-level open items
- Warning when approving with unresolved items

### Documents (Phase C)
- Split into "Plan Documents" and "Reference Documents"
- Scope toggle on add form, move buttons between groups

### Timeline (Phase D)
- Renamed to "Timeline & History"
- Shows 3 most recent events by default instead of fully collapsed

### Mobile (Phase D)
- Secondary change row metadata hidden on mobile
- "Details →" link always visible (not hover-gated)

### Copy Summary (Phase F)
- "Copy Summary" button generates formatted text for sharing

---

## Copy/Status Changes Made (Phase E)

### Change Status Labels
| Internal Value | Old Label | New Label |
|----------------|-----------|-----------|
| `requested` | Requested | Proposed Change |
| `awaiting_homeowner` | Awaiting Homeowner | Needs Your Review |
| `approved_by_homeowner` | Approved by Homeowner | Approved Change |
| `accepted_by_contractor` | (same) | Accepted by Contractor |
| `done` | Done | Added to Plan |
| `closed` | Closed | Not Moving Forward |

### Plan Status Labels
- `working` → "Draft" (was "Working Plan")
- `approved` → "Approved" (was "Approved Plan")
- `unlocked` → "Unlocked" (was "Unlocked for Revision")

### Helper Text
- Approved/unlocked banners rewritten in homeowner-teaching language
- Empty states guide users toward the right first action
- Section title: "Change Log" (was "Changes to Official Plan")

### Homepage/Index Cards
- Status badge leads (Draft/Approved/Unlocked)
- Open items and pending changes shown as attention signals
- Settled plans show clean approved badge

---

## Guardrails

- **Approved plan editing**: Intervention dialog offers unlock vs. create change
- **Approval with unresolved items**: Warning dialog, "Approve Anyway" option
- **Change approval with unresolved items**: StatusDropdown warns before approval statuses
- **Create Change CTA**: Prominent button in approved plan section
- **Incorporation**: Guided dialog with impact summary and merge note

---

## Open Risks / Follow-up Candidates

1. **PDF/print export**: PCV1-057 implemented clipboard copy; a proper PDF/print view would be a natural follow-up
2. **Share link for read-only view**: The share token system exists but isn't specifically optimized for Plan & Changes
3. **Budget validation**: Cost parsing relies on regex; complex currency formats may not parse correctly
4. **Activity event granularity**: Not all field edits create activity events — only status changes, approvals, incorporations, and open item resolutions
5. **Mobile bottom sheet**: Change detail editing uses full-page modals; could benefit from mobile bottom sheet pattern for status changes

---

## Does the feature now behave as intended?

**One trusted official homeowner plan record:** Yes. The plan has a clear 3-state lifecycle (Draft → Approved → Unlocked), visual authority when approved, and an intervention dialog that prevents casual editing.

**With formal changes:** Yes. Changes are split into Pending and History, have structured fields (description, rationale, proposed/final impact, contractor response), and follow a clear status progression with homeowner-friendly labels.

**Explicit open items:** Yes. Both plan-level and change-level open items with 4-status model, resolution tracking, and milestone events. Warnings surface unresolved items during plan and change approval.

**Clearer auditability:** Yes. Milestones track plan status changes, incorporations, and open item resolutions. Revision numbers mark plan versions. Approval metadata captures who and when. The timeline shows recent events by default.

---

## Build Verification

- `npx tsc --noEmit` — pass (only pre-existing e2e error in `e2e/app-ui-review.spec.ts`)
- `npm run build` — pass
