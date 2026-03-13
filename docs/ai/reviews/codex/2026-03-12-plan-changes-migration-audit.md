# Audit: Plan & Changes Migration

**Date:** 2026-03-12
**Reviewer:** Codex
**Scope:** Uncommitted Plan & Changes migration changes in `src/data/project-summary.ts`, `src/app/app/tools/project-summary/**`, `src/app/api/tools/project-summary/linked-entities/route.ts`, and related integration/rename files (`src/components/app/ProjectSummaryLinkBadge.tsx`, `CreateProjectSummaryEntryButton.tsx`, `SidebarNav.tsx`, `src/lib/activityHelpers.ts`, `src/lib/tool-registry.ts`, share/page metadata updates).
**Trigger:** User request

## Files Reviewed

- `src/data/project-summary.ts` — 459 lines, v1→v2 payload model and migration logic
- `src/app/app/tools/project-summary/useProjectSummaryState.ts` — 599 lines, state mutations for plan/changes/milestones
- `src/app/app/tools/project-summary/ToolContent.tsx` — 254 lines, section wiring and focus parsing
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` — 341 lines, plan/budget/status UI
- `src/app/app/tools/project-summary/components/PlanItemList.tsx` — 153 lines, editable plan item lists
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — 487 lines, v2 change workflow UI
- `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` — 88 lines, milestone UI
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — 552 lines, change detail UI
- `src/app/api/tools/project-summary/linked-entities/route.ts` — 110 lines, cross-tool linked-entry lookup
- `src/components/app/ProjectSummaryLinkBadge.tsx` — 112 lines, linked-entry badge/deep-linking
- Verified with `npx tsc --noEmit` — passes

## What Looks Solid

- `src/data/project-summary.ts` moves the migration into `ensureShape()` cleanly, so v1 payload coercion is centralized instead of scattered through the UI.
- The rename coverage is broad and mostly consistent across tool registry, sidebar, activity labels, metadata, and share-page copy.
- The new plan/changes split is coherent in the client state layer; `CurrentPlanSection`, `ChangesSection`, and `MilestoneTimeline` line up with the sprint doc.

## What Is Questionable

- The code still partially preserves legacy decision links in `linked-entities/route.ts`, but the migrated UI no longer has a decision destination. That is an unstable halfway state: either those links need a real migration target, or they should stop surfacing.

## What Is Wrong

- `src/lib/tools/validateToolPayload.ts:199-228` still validates `project_summary` as the old v1 shape and always returns `{ version: 1, summary, documents, changes, openDecisions }`. The generic `PUT /api/tools/[toolKey]` route uses this validator before every save, so any Plan & Changes write can silently strip `plan`, `budget`, `milestones`, v2 change statuses, and new fields like `contractor_response` / `incorporated`. This is a deploy blocker.
- `src/app/api/tools/project-summary/linked-entities/route.ts:89-106` still returns legacy `decision` entries, but `src/components/app/ProjectSummaryLinkBadge.tsx:38-40` hardcodes every deep link to `?focus=change-...`, and `src/app/app/tools/project-summary/ToolContent.tsx:47-57` no longer parses `focus=decision-*`. Result: existing links from Selections/Fix List to legacy open decisions will route users to the collection without focusing any matching entry. That breaks the backward-compatibility goal for cross-tool links.
- `src/app/app/tools/project-summary/useProjectSummaryState.ts:228-240` updates `budget` without setting `plan.content_changed_since_status`. Scope edits and plan item edits do set that flag, so after a plan is marked `shared`/`confirmed`, budget edits will not show the “content changed since status” warning. That makes the lifecycle signal incomplete for a core part of the Current Plan section.

## Recommendations

- Replace the `project_summary` server validator with v2-aware coercion immediately, ideally by delegating to the same `ensureShape()` logic used on the client or by mirroring its v2 schema server-side.
- Decide how legacy decision links should behave, then make the route and badge consistent with that decision. Do not keep emitting `decision` entries unless the destination still exists.
- Treat budget edits as plan-content edits by updating the status-dirty flag consistently anywhere the current plan changes.

## Safe for Next Phase?

No. The server-side payload validator can erase the new v2 data on save, and the legacy decision deep-link path is already inconsistent with the migrated UI. Those need to be resolved before deploy or further work builds on this state.
