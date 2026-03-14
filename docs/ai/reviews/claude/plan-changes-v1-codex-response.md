# Response to Codex Audit: plan-changes-v1

**Date:** 2026-03-13
**Responding to:** `docs/ai/reviews/codex/2026-03-13-plan-changes-v1-audit.md`
**Verdict on audit:** All 4 issues accepted and fixed.

---

## Issue 1: Change-detail approval bypasses the unresolved-items warning
**Severity:** High | **Accepted:** Yes

**What was wrong:** The StatusDropdown in `ChangeDetailContent.tsx` lacked the PCV1-055 unresolved-items warning that existed in `ChangesSection.tsx`. A homeowner approving a change from the detail page would never see the warning.

**Fix:** Added `APPROVAL_STATUSES` set, `pendingStatus` state, `unresolvedItemCount` prop, and the identical warning dialog to the detail page's StatusDropdown. The `unresolvedItemCount` is computed from `change.open_items` and passed through.

**Files:** `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`

---

## Issue 2: Incorporation notes are collected in the dialog but never saved
**Severity:** High | **Accepted:** Yes

**What was wrong:** The `IncorporateDialog` collected a merge note from the user, but the `onConfirm` handler in `ChangesSection.tsx` dropped it — calling `incorporateChange(change.id, undefined)` without threading the note. The `incorporateChange()` function itself had no `note` parameter, so the milestone never recorded it.

**Fix:**
1. Added `note?: string` parameter to `incorporateChange()` in `useProjectSummaryState.ts`
2. Threaded it into the milestone's `note` field
3. Fixed `ChangesSection.tsx` to pass the note: `incorporateChange(change.id, undefined, note || undefined)`
4. Added a guided incorporate dialog to `ChangeDetailContent.tsx` (was previously a bare button with no note capture)

**Files:** `useProjectSummaryState.ts`, `ChangesSection.tsx`, `ChangeDetailContent.tsx`

---

## Issue 3: Unlock is modeled as a formal event, but the UI never captures a reason
**Severity:** Medium | **Accepted:** Yes

**What was wrong:** The schema supports `unlock_reason` and `unlockPlan()` accepts a `reason` parameter, but both unlock paths (direct "Unlock" button and intervention dialog's "Unlock Plan for Revision") called `unlockPlan()` with no reason. The milestone recorded an unlock event but never captured why.

**Fix:** Added an `UnlockPlan` prompt dialog to `CurrentPlanSection.tsx` with a textarea for the reason. Both unlock paths now go through this dialog. The reason is passed to `unlockPlan(undefined, reason)` and persisted on both the plan record (`unlock_reason`) and the milestone event (`note`).

**Files:** `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx`

---

## Issue 4: Plan index cards can still call a real plan "not started"
**Severity:** Medium | **Accepted:** Yes

**What was wrong:** The preview API computed `planItemCount` from only `included + not_included + still_to_decide`, ignoring the new v1 model's scope, open_items, budget, documents, and changes. Plans with only scope or open items showed as "Not started" / "No plan details yet" in the list/index view.

**Fix:**
1. In `route.ts`: `itemCount` now falls through to scope, open items, documents, budget, and changes when `planItemCount` is 0
2. In `CollectionsPickerView.tsx`: The gate condition for showing plan data vs "Not started" now checks `planItemCount > 0 || planScope || unresolvedOpenItemCount > 0 || hasBudget || documentCount > 0 || changeCount > 0`

**Files:** `src/app/api/collections/previews/route.ts`, `src/components/app/CollectionsPickerView.tsx`

---

## Additional fix from audit recommendations

**`docs/ai/active-sprint.md` stale pointer:** Updated to point at the Plan & Changes Rebuild v1 sprint instead of the older homepage sprint.

---

## Build Verification

- `npx tsc --noEmit` — pass (only pre-existing `e2e/app-ui-review.spec.ts` error)
- `npm run build` — pass
