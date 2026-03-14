# Plan & Changes UI Review

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Full homeowner-first review of Plan & Changes, focused on copy, homepage entry, main collection screen, change detail, schema/model fit, and your proposed “approved plan + simple changelog” direction.

## Artifacts Reviewed

- Partial live capture from `./scripts/run-ui-review.sh plan-summary both`
- Artifact folder: `e2e/artifacts/ui-review-20260313-122650-plan-summary/`
- Partial screenshot captured: `mobile-plan-summary-01-plan-list.png`
- Playwright traces from failed desktop/mobile capture:
  - `e2e/results/app-ui-review-ui-review-plan-summary-authenticated/trace.zip`
  - `e2e/results/app-ui-review-ui-review-plan-summary-authenticated-mobile/trace.zip`
- Code review of:
  - `src/components/dashboard/DashboardCardPlanAndChanges.tsx`
  - `src/components/dashboard/DashboardNextActions.tsx`
  - `src/server/dashboard/index.ts`
  - `src/app/app/tools/project-summary/ToolContent.tsx`
  - `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx`
  - `src/app/app/tools/project-summary/components/DocumentsSection.tsx`
  - `src/app/app/tools/project-summary/components/ChangesSection.tsx`
  - `src/app/app/tools/project-summary/components/PlanItemList.tsx`
  - `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`
  - `src/app/app/tools/project-summary/useProjectSummaryState.ts`
  - `src/app/app/tools/project-summary/constants.ts`
  - `src/data/project-summary.ts`

## Overall Verdict

Your design instinct is right. Plan & Changes is still over-modeled for the homeowner job it needs to serve. The app has a lot of thoughtful detail and decent traceability, but the feature still feels like a lightweight workflow system rather than “the plan we agreed on, then the changes since.”

The strongest direction is still the simpler model you described: one working plan, one approved plan that is effectively locked, and then a clear change log with artifacts and discussion attached to either the plan or each change.

## What The Feature Appears To Be For

This feature appears to help a homeowner keep one trusted project record: what the renovation plan is, what is and is not included, what still needs decisions, what changed after approval, and what documents or evidence support those records.

## Journey

- The homepage card is directionally better, but it still frames Plan & Changes mostly as a change tracker. The card and attention list are driven by `activeChangeCount`, while unresolved plan readiness and open items are still secondary or invisible in the top-level journey.
- On the collection page, the homeowner immediately hits too many concepts at once: plan status, change status, unincorporated changes, budget math, documents, change log, milestones, and collection comments.
- The clearest mental model in the whole feature is actually the change detail page: one change, one status, one body of evidence. That screen is closer to the product you want than the main collection surface is.

## Mobile

- The partial mobile capture only caught a loading shell, so I am not claiming a screenshot-complete mobile audit here.
- Based on the actual page structure in `ToolContent.tsx`, mobile still looks too long and too concept-dense. The main column stacks Current Plan, Key Plan Documents, Changes, and Milestones before the hidden comment system becomes legible.
- `CurrentPlanSection.tsx` alone contains scope, three plan sublists, a plan status control, warnings, and budget summary. On a phone, that is a lot of reading and context switching before the user even gets to the change log.

## Desktop

- Desktop likely benefits from the split layout with the comment sidebar, but the information architecture is still too flat. Everything is present, but not enough is clearly primary vs secondary.
- The screen still reads more like “here is the whole operating system for this tool” than “here is your current plan, here is what changed, here is what still needs a decision.”
- The strongest desktop pattern is still the separate change detail page, because it narrows attention to one record instead of making the homeowner parse the whole model at once.

## Copy

- `Plan & Changes` as a tool name is fine. The problem is the operational vocabulary under it.
- `Draft`, `Shared`, `Confirmed`, and `Acknowledged` in [`constants.ts`](../../../src/app/app/tools/project-summary/constants.ts) are not strong homeowner-facing anchors for plan state.
- `Plan content changed since last marked as confirmed/shared/acknowledged` in [`CurrentPlanSection.tsx`](../../../src/app/app/tools/project-summary/components/CurrentPlanSection.tsx) reads like workflow software, not like a calm renovation record.
- `Awaiting Homeowner`, `Approved by Homeowner`, `Accepted by Contractor`, `Incorporate into Plan`, and `Edited since contractor accepted` in [`ChangesSection.tsx`](../../../src/app/app/tools/project-summary/components/ChangesSection.tsx) and [`ChangeDetailContent.tsx`](../../../src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx) are technically precise but collectively too process-heavy.
- `Still to Decide` is understandable, but right now it is just one more list. It does not explain whether these items block approval, belong to the approved plan, or are simply future considerations.

## Empty States

- `No changes recorded yet.` and `All decisions made.` are serviceable, but they do not teach the homeowner what a healthy filled-out plan should look like.
- `Track your project plan and any changes along the way.` on the homepage card is directionally fine, but still undersells approval/readiness/open-items behavior.
- `No documents added yet.` in `DocumentsSection.tsx` reinforces the current generic document bucket rather than teaching where proof and context actually belong.

## Trust / Record-Keeping

- The feature is strongest when it is acting like a record. Timestamps, status badges, and incorporation markers all show real care for traceability.
- The trust problem is that there are too many overlapping sources of truth:
  - plan status
  - change status
  - incorporated or not
  - changed since accepted
  - collection-level documents
  - change-level attachments
- That makes it harder for a homeowner to answer the key trust question: “What is the plan right now, and what changed after that?”

## Top Issues

1. **There is still no single authoritative approved-plan concept**
   Severity: High
   Confidence: High
   Why it matters: The schema and UI still ask the homeowner to reason across plan status (`draft/shared/confirmed/acknowledged`), change status (`requested/awaiting_homeowner/approved_by_homeowner/accepted_by_contractor/done/closed`), and a separate `incorporated` flag. That means three overlapping truths can exist at once: the written plan, the accepted change, and whether that change has been folded into the plan. For a homeowner, that is where the feature starts feeling like enterprise workflow software.
   Recommendation: Collapse this to one main record concept: `Working Plan` and `Approved Plan`. When the plan is approved, it is effectively locked. Changes then become a simple log against that approved plan. If “unlock” is needed, make it explicit and lightweight.

2. **Artifacts and evidence are attached to the wrong levels**
   Severity: High
   Confidence: High
   Why it matters: `documents[]` is still a top-level collection bucket in [`project-summary.ts`](../../../src/data/project-summary.ts), while change attachments live on each change and plan items have no artifact/comment ownership of their own. That does not match the homeowner mental model of “this document belongs to the plan” or “these photos and notes belong to this change.”
   Recommendation: Make the plan itself a first-class record with its own artifacts/comments. Keep each change as its own first-class record with its own artifacts/comments. Decide whether open items are lightweight plan items or a first-class record type, but do not keep the current mixed model.

3. **The homepage still under-signals plan readiness and unresolved items**
   Severity: Medium
   Confidence: High
   Why it matters: [`DashboardNextActions.tsx`](../../../src/components/dashboard/DashboardNextActions.tsx) only adds a Plan & Changes action when there are active changes, and [`DashboardCardPlanAndChanges.tsx`](../../../src/components/dashboard/DashboardCardPlanAndChanges.tsx) still summarizes the feature mostly through change counts. A homeowner can have an incomplete plan with unresolved open items and still not get a strong top-level attention signal.
   Recommendation: Surface three homepage signals in this order: plan state, unresolved open items, and number of changes since approval.

4. **The visible copy still sounds like workflow software**
   Severity: High
   Confidence: High
   Why it matters: Labels like `Acknowledged`, `Accepted by Contractor`, `Incorporate into Plan`, and `Edited since contractor accepted` are clear to a product team, but not calm to a homeowner. The user should not need to decode internal process semantics to know whether a plan is settled or a change is real.
   Recommendation: Rewrite the visible state language around homeowner meaning, not system state. Example direction: `Working Plan`, `Approved Plan`, `Proposed Change`, `Approved Change`, `Completed`, `Not Moving Forward`, plus plain explanations where needed.

5. **“Still to Decide” is present but not resolved as a concept**
   Severity: Medium
   Confidence: High
   Why it matters: `Still to Decide` currently behaves like a third list in the plan section, but it is not clear whether these items block approval, live inside the approved plan, or belong in a separate open-items area. That ambiguity weakens the main homeowner journey.
   Recommendation: Decide one of two paths and commit to it: either `Open Items` is explicitly part of plan approval readiness, or it becomes a separate first-class concept with its own evidence and discussion.

## Recommended Next Actions

- Redesign the data model and UI around `Working Plan` / `Approved Plan` plus a simpler change log.
- Move artifacts/comments so they clearly belong to the plan or an individual change, not to a generic collection-level document bucket.
- Rewrite the visible status and helper text into homeowner language before doing smaller visual refinements.
- Update homepage attention logic so incomplete plan readiness and open items are first-class signals.

## Final Verdict

Mostly no. It is more thoughtful than a typical CRUD tool, but it still does not feel like a simple, trustworthy homeowner renovation record. The feature needs a model simplification more than a styling pass.
