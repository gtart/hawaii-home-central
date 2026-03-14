# Audit: plan-changes-v1

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Latest committed Plan & Changes sprint work in `e78b17e` (`src/app/app/tools/project-summary/*`, `src/data/project-summary.ts`, `src/app/api/collections/previews/route.ts`, `src/components/app/CollectionsPickerView.tsx`), plus sprint docs and review ledger.
**Trigger:** User request / sprint close

## Materials Reviewed

- `docs/ai/active-sprint.md` — stale pointer still references the homepage sprint, not the latest Plan & Changes sprint
- `docs/ai/active-sprint-plan-changes-v1.md` — Plan & Changes sprint spec
- `docs/ai/reviews/claude/plan-changes-v1-ledger.md` — issue rollup and claimed acceptance results
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` — official plan lifecycle, approval, unlock, readiness UI
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — pending/history split, status warnings, incorporation dialog
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — deep change-detail workflow
- `src/app/app/tools/project-summary/useProjectSummaryState.ts` — status transitions, milestones, change incorporation
- `src/app/api/collections/previews/route.ts` — list/index preview derivation
- `src/components/app/CollectionsPickerView.tsx` — plan list/table confidence story
- `src/data/project-summary.ts` — schema support for plan lifecycle and open items

## Overall Verdict

The rebuild is directionally much better: the model is clearer, the main page is calmer, and the homeowner-facing language is materially improved. It is not ready to call "58/58 pass," though. A few of the audit-trail and approval safeguards Claude marked complete do not actually hold across the full workflow, and one list/index path can still tell homeowners their plan is "not started" when they already have a real record.

## What The Feature Appears To Be For

This appears to help a homeowner keep one trusted project plan, log formal changes against it, track unresolved decisions explicitly, and preserve a record they can rely on later with a spouse or contractor.

## User Journey Assessment

- The main Plan & Changes page now reads like a homeowner record, not a loose admin bucket.
- The path from approved plan to "create a change" is much clearer than before.
- The journey breaks when the homeowner drills into a change detail screen: one approval safeguard present in the list view disappears there, so the same action behaves differently depending on where they click.
- The index/list view also still over-relies on legacy `still_to_decide` counts, so some valid plan states can be shown as if nothing meaningful exists yet.

## Mobile UX Assessment

- The top-level page structure is simpler and should scan better on a phone than the previous mixed layout.
- The modal-heavy plan/change interventions are workable but still desktop-shaped; they are not following the repo's preferred bottom-sheet pattern.
- The bigger problem is not layout but consistency: mobile users who land on change detail will miss a warning that exists on the list screen for the same approval action.

## Desktop UX Assessment

- Desktop hierarchy is stronger: Official Plan first, then documents, queue, changes, and history.
- The list/index cards now tell a more useful confidence story when the preview data is correct.
- That confidence story breaks for scope-only or open-item-only plans because the preview math still treats legacy plan items as the gate for whether a plan "exists."

## Copy / Labeling Assessment

- Most of the visible copy is much more homeowner-legible than the older Project Summary version.
- "Official Plan," "Plan Open Items," and "Add to Official Plan" are strong shifts.
- The weak point is not wording but false implication: "Not started" / "No plan details yet" is incorrect copy for some real migrated or lightly documented plans because the preview logic is incomplete.

## Trust / Record-Keeping Assessment

- The schema now has the right fields for stronger record-keeping.
- The implementation still misses key moments where those fields should be populated: unlock reason is modeled but never requested, and incorporation notes are collected but discarded.
- That matters because these are exactly the moments a homeowner will later revisit to remember why the "official" record changed.

## Top Issues

1. **Change-detail approval bypasses the unresolved-items warning**
   Severity: High
   Confidence: High
   Why it matters: Claude marked PCV1-055 complete, but the safeguard only exists in the list view. A homeowner can open a change, approve it from the detail screen, and never see the warning about unresolved open items. That creates inconsistent behavior on a core approval path and weakens trust in the record.
   Recommendation: Reuse the same approval-warning flow in [`ChangeDetailContent.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx#L36) that already exists in [`ChangesSection.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/components/ChangesSection.tsx#L36).

2. **Incorporation notes are collected in the dialog but never saved**
   Severity: High
   Confidence: High
   Why it matters: The UI asks the homeowner for a merge note during "Add to Official Plan," which implies the note will become part of the audit trail. The handler drops it, and `incorporateChange()` has no note parameter, so the milestone never records it. That is a direct record-keeping failure, not a polish gap.
   Recommendation: Thread the merge note through the dialog handler into [`incorporateChange()`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/useProjectSummaryState.ts#L500) and persist it on the milestone event.

3. **Unlock is modeled as a formal event, but the UI never captures a reason**
   Severity: Medium
   Confidence: High
   Why it matters: Claude's ledger claims unlock stores who/when/reason, but every unlock path calls `unlockPlan()` with no reason. Homeowners later reviewing the record will see that the plan was unlocked, but not why. That undercuts the "real ceremony" framing for changing an approved plan.
   Recommendation: Add a lightweight unlock-reason prompt before calling [`unlockPlan()`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/components/CurrentPlanSection.tsx#L203), or stop claiming reason capture as complete.

4. **Plan index cards can still call a real plan "not started"**
   Severity: Medium
   Confidence: High
   Why it matters: The preview API computes `planItemCount` from `included + not_included + still_to_decide`, excluding the new authoritative `open_items` model and ignoring scope/budget/doc-only plans. That makes the index/table render "Not started" or "No plan details yet" for some legitimate plan records, which is exactly the kind of false confidence problem this sprint was meant to remove.
   Recommendation: Base list/index readiness on the actual v1 rebuild model in [`route.ts`](/home/greggtarter/HIhomecentral/src/app/api/collections/previews/route.ts#L334) and [`CollectionsPickerView.tsx`](/home/greggtarter/HIhomecentral/src/components/app/CollectionsPickerView.tsx#L551), including `open_items`, `scope`, budget, and documents where relevant.

## Recommended Next Actions

- Fix the four issues above before treating the sprint as fully verified.
- Update `docs/ai/active-sprint.md` so the review workflow points at the latest sprint instead of the old homepage sprint.
- Re-run `npx tsc --noEmit` after the current `e2e/app-ui-review.spec.ts` typing error is fixed, because HEAD does not currently satisfy the "TypeScript passes" expectation.

## Final Verdict

Mostly, but not yet fully. The product model is much stronger and feels far closer to a trustworthy homeowner record, but the missing approval/audit details are substantial enough that I would not call this sprint fully verified yet.
