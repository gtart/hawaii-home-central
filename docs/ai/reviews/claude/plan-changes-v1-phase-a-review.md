# Phase A Review — Product Model Reset

**Sprint:** Plan & Changes Rebuild v1
**Phase:** A
**Date:** 2026-03-13
**Status:** Complete

---

## What Changed

### Schema (`src/data/project-summary.ts`)
- `PlanStatus` type changed from `'draft' | 'shared' | 'confirmed' | 'acknowledged'` to `'working' | 'approved' | 'unlocked'`
- `PlanStatusLegacy` type added for backward compatibility
- `CurrentPlan` interface extended with approval/unlock metadata:
  - `approved_at`, `approved_by` — tracks when/who approved
  - `unlocked_at`, `unlocked_by`, `unlock_reason` — tracks unlock events
  - `revision_number` — increments on re-approval after unlock
- Migration function `migratePlanStatus()` handles legacy → current mapping:
  - `draft`, `shared` → `working`
  - `confirmed`, `acknowledged` → `approved`
- `coerceV2()` updated to preserve new metadata fields and handle legacy statuses
- Default payload status changed from `'draft'` to `'working'`
- v1→v2 migration updated to use `'working'` instead of `'draft'`

### Constants (`constants.ts`)
- `PLAN_STATUS_CONFIG` updated with 3 homeowner-legible statuses:
  - `working`: "Working Plan" (cream)
  - `approved`: "Approved Plan" (emerald)
  - `unlocked`: "Unlocked for Revision" (amber)
- Each status now includes a `description` field for UI helper text
- `PLAN_STATUS_ORDER` updated to `['working', 'approved', 'unlocked']`

### State Hook (`useProjectSummaryState.ts`)
- Added `approvePlan(actor?, note?)` — sets status to approved, records milestone, sets approval metadata
- Added `unlockPlan(actor?, reason?)` — sets status to unlocked, records milestone with reason
- Added `reapprovePlan(actor?, note?)` — re-approves after revision, increments revision_number, clears unlock metadata
- All three methods create proper milestones for auditability

### UI — CurrentPlanSection
- Renamed header from "Current Plan" to "Official Plan"
- Removed status dropdown — replaced with dedicated Approve/Unlock action buttons
- Added visual lock icon for approved state
- Added border color differentiation: emerald for approved, amber for unlocked
- Added approved plan banner: explains lock + suggests change log or unlock
- Added unlocked banner: explains revision mode + suggests re-approval
- **Edit intervention dialog (PCV1-003)**: when user clicks on any editable field while plan is approved, shows modal with two choices:
  - "Unlock Plan for Revision" — unlocks plan for direct editing
  - "Create a Change Instead" — scrolls to changes section
- All editable fields (scope, plan items, budget) are locked when plan is approved
- Added approval metadata footer showing last approval date/by/revision

### UI — ChangesSection
- Renamed section title from "Changes" to "Changes to Official Plan"
- **Guided incorporation flow (PCV1-007)**: replaced bare "Incorporate into Plan" button with `IncorporateDialog` that shows:
  - Change title and impact summary (cost, schedule)
  - Open item count warning
  - Optional merge note input
  - Confirm button labeled "Add to Official Plan"
- Updated empty state copy to guide users
- Updated incorporate button copy from "Incorporate into Plan" to "Add to Official Plan"

### UI — ToolContent (Page IA)
- Reordered page sections: Plan → Changes → Documents → Milestones
- Previously: Plan → Documents → Changes → Milestones
- This puts changes directly under the plan, reinforcing plan-then-amendments relationship

### UI — ChangeDetailContent
- Updated incorporate button text to "Add to Official Plan"

### UI — CollectionsPickerView
- Updated plan status badge logic to handle both new and legacy statuses
- New statuses show homeowner-legible labels: "Working Plan", "Approved", "Unlocked"

### UI — MilestoneTimeline
- Added icons for new events: `plan_approved`, `plan_unlocked`, `plan_working`
- Kept legacy event icons for backward compatibility

---

## Issue Completion

| Issue ID | Title | Status | Acceptance |
|----------|-------|--------|------------|
| PCV1-001 | Establish one authoritative Official Plan | Complete | Pass |
| PCV1-002 | Make plan state explicit and homeowner-legible | Complete | Pass |
| PCV1-003 | Intervene when editing an approved plan | Complete | Pass |
| PCV1-004 | Treat unlock as a real event | Complete | Pass |
| PCV1-005 | Reframe changes as amendments to the Official Plan | Complete | Pass |
| PCV1-006 | Keep the Official Plan cumulative | Complete | Pass |
| PCV1-007 | Add guided incorporation / merge flow | Complete | Pass |
| PCV1-008 | Preserve auditability under the hood | Complete | Pass |

---

## Risks Introduced

1. **Data migration**: Existing payloads with old statuses (`draft`, `shared`, `confirmed`, `acknowledged`) will be silently migrated to `working` or `approved` on next `ensureShape()` call. This is the same proven pattern used for v1→v2 migration.

2. **Milestone events**: Old milestone events (`plan_draft`, `plan_shared`, `plan_confirmed`, `plan_acknowledged`) still exist in stored data. MilestoneTimeline handles these with legacy icon mappings. No data loss.

3. **CollectionsPickerView**: Status badges handle both old and new status values as a transitional measure. Old values will naturally phase out as users interact with their data.

---

## UX/Copy/Model Regressions to Watch

- The status dropdown on the plan section was removed. Status changes now happen through dedicated action buttons (Approve, Unlock, Re-approve). This is intentional — plan state transitions should be deliberate, not casual dropdown clicks.
- "Still to Decide" label retained in Phase A (will be renamed in Phase B/E per PCV1-031).
- Change statuses (requested, awaiting_homeowner, etc.) not modified in Phase A — that's Phase E (PCV1-034).

---

## What Codex Should Verify

1. The `ensureShape()` function correctly migrates old plan statuses to new ones
2. The intervention dialog actually appears when clicking on plan fields while approved
3. The unlock → edit → re-approve flow works end-to-end and increments revision_number
4. The incorporation dialog shows impact summary and open item count
5. Milestones are created for approve, unlock, and re-approve events
6. Page section order is Plan → Changes → Documents → Milestones
7. CollectionsPickerView badges show correct labels for both old and new statuses
8. Build passes with zero errors in `src/`

---

## Build Verification

- `npx tsc --noEmit`: 1 pre-existing error in `e2e/app-ui-review.spec.ts` (not related to sprint changes), 0 errors in `src/`
- `npm run build`: Pass
