# Plan & Changes UI Review

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Homeowner-facing review of Plan & Changes across homepage entry points, collection picker, main collection view, change detail, and underlying schema/state model.

## Artifacts Reviewed

- Code review of:
  - `src/components/dashboard/DashboardPage.tsx`
  - `src/components/dashboard/DashboardNextActions.tsx`
  - `src/components/dashboard/DashboardCardPlanAndChanges.tsx`
  - `src/server/dashboard/index.ts`
  - `src/app/app/tools/project-summary/CollectionPickerWrapper.tsx`
  - `src/app/app/tools/project-summary/ToolContent.tsx`
  - `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx`
  - `src/app/app/tools/project-summary/components/ChangesSection.tsx`
  - `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`
  - `src/app/app/tools/project-summary/components/DocumentsSection.tsx`
  - `src/app/app/tools/project-summary/components/PlanItemList.tsx`
  - `src/app/app/tools/project-summary/useProjectSummaryState.ts`
  - `src/data/project-summary.ts`
  - `src/app/app/tools/project-summary/constants.ts`
- Context docs:
  - `docs/ai/features/plan-and-changes.md`
  - `docs/ai/migrations/project-summary-to-plan-and-changes.md`
- Screenshot capture workflow exists, but I did **not** complete a live screenshot pass in this environment because local Playwright runs are blocked by the repo’s Node requirement (`Next.js 16` needs Node `>= 20.9.0`; current shell is `v18.20.4`).

## Overall Verdict

The feature is doing too much at once for the homeowner mental model it needs to serve. The current implementation is thoughtful and technically rich, but it asks the user to understand a plan lifecycle, a separate change lifecycle, a manual “incorporate” step, a milestone log, a document section, and a “still to decide” list all as parallel concepts. The result is closer to lightweight project-management software than a calm homeowner record.

The simpler model you described is stronger: one plan that can be effectively locked, then a clear changelog of additions to that plan, each with its own artifacts and discussion. The current UI has pieces of that, but the structure and copy still communicate too many moving parts.

## What The Feature Currently Feels Like

Today the feature feels like:

- a hybrid of scope document, decision tracker, change order tracker, budget tracker, and milestone log
- a tool with two separate state machines the homeowner has to interpret
- a record system where it is not always obvious what is the authoritative source of truth right now

It does **not** yet feel like:

- “Here is the plan we agreed on”
- “Here are the changes since then”
- “Here are the documents, photos, and conversations attached to each one”

## Homepage Review

### What works

- Homepage entry is better than before. `DashboardPage.tsx` and `DashboardCardPlanAndChanges.tsx` make Plan & Changes visible as a primary renovation control surface.
- The homepage card now at least distinguishes “plan documented, no changes yet” from “nothing started.”

### What still feels wrong

- Homepage attention logic in `DashboardPage.tsx`, `DashboardNextActions.tsx`, and `src/server/dashboard/index.ts` treats Plan & Changes mostly as a **change** tracker. It surfaces `activeChangeCount`, but it does not surface:
  - plan needs approval / locking
  - plan status meaning
  - unresolved `still_to_decide` items
  - whether the plan changed after being shared/confirmed
- A homeowner with a complete plan draft and several unresolved decisions could still see a homepage that looks fairly calm, because unresolved plan decisions are not treated as top-level attention.

### Recommendation

- Homepage should summarize Plan & Changes as:
  - plan state
  - unresolved decisions / open items
  - number of logged changes since approval
- If the plan is not effectively “locked,” that should be the first signal. If it is locked, then changes become the main signal.

## Main Collection Screen Review

### Current Plan section

`CurrentPlanSection.tsx` is the clearest example of where the feature is over-modeled.

The homeowner has to process:

- Current Plan
- Draft / Shared / Confirmed / Acknowledged
- changed since status
- included
- not included
- still to decide
- budget baseline
- approved changes
- current total
- accepted changes not yet incorporated into plan

That is too many concepts for one primary screen.

### Copy problems

- `Draft`, `Shared`, `Confirmed`, `Acknowledged` are not homeowner-natural in this context.
- “Plan content changed since last marked as confirmed/shared/acknowledged” is system language, not reassuring user language.
- “Accepted changes not yet incorporated into plan” is especially problematic. It forces the homeowner to understand a second bookkeeping step after acceptance.

### Structural problem

The current UI implies three different truths can exist simultaneously:

1. the plan as currently written
2. the approved or accepted changes
3. the changes that have or have not been “incorporated”

That is exactly where the tool starts to feel like PM software.

### Recommendation

- Collapse the plan state into one main concept:
  - `Working Plan`
  - `Approved Plan`
- Make “approved” mean de facto locked, with an obvious and lightweight “unlock / revise plan” path.
- If a change is approved and becomes part of the plan, either:
  - automatically treat it as part of the current plan, or
  - make the “add to plan” concept dramatically simpler and more explicit.
- Move “Still to Decide / Open Items” into a clearer readiness concept:
  - either as part of plan approval readiness
  - or as a separate “Open Items” section that directly explains what still blocks finalizing the plan

## Changes Section Review

### What works

- The section is better than the old generic summary model because changes are visible, expandable, and traceable.
- Separate change detail pages help when a change has real depth.

### What still feels too complicated

The change workflow currently asks the homeowner to understand:

- Requested
- Awaiting Homeowner
- Approved by Homeowner
- Accepted by Contractor
- Done
- Closed
- Incorporated
- Changed since accepted

That is too much status nuance for the user-facing surface.

### Copy problems

- `Approved by Homeowner` and `Accepted by Contractor` are technically precise, but together they feel like workflow software.
- `Incorporate into Plan` reads like an admin command, not a homeowner action.
- `Changed since accepted` is understandable, but paired with the other states it reinforces process complexity.

### Recommendation

For the homeowner mental model, changes should behave more like:

- proposed
- approved
- completed
- closed / not moving forward

If contractor acknowledgement matters, it can exist in detail copy or metadata rather than being one of the main visible statuses everywhere.

The bigger improvement would be:

- `Approved change` becomes part of the changelog and optionally updates the approved plan snapshot
- each change owns its own artifacts and discussion clearly

## Change Detail Review

`ChangeDetailContent.tsx` is the most coherent screen in the feature because it gathers one change’s fields, attachments, and comments into one place.

That said, it still inherits the same conceptual burden:

- too many states
- incorporation as a second-class action
- private notes, attachments, links, and comments split across different subpatterns

This screen is closest to the model you actually want:

- one change
- details
- artifacts
- conversation
- status

That suggests the **change detail pattern is stronger than the main collection pattern** and should inform the overall redesign.

## Documents and Artifacts Review

This is the biggest architectural mismatch with your target model.

### Current structure

- `DocumentsSection.tsx` is a separate collection-level “Key Plan Documents” area
- change attachments live on each change
- comments are collection-level or change-level
- plan items do not have attached artifacts
- “still to decide” items do not have attached artifacts

### Why this feels wrong

A homeowner thinks in terms of:

- the plan itself and its supporting documents
- each change and its supporting evidence
- each unresolved item and the material needed to decide it

The current structure instead says:

- some documents belong in a top-level document bucket
- some files belong on a change
- some conversations belong to the collection
- some items have no artifact container at all

That weakens trust and provenance.

### Recommendation

Architecturally, your instinct is right:

- the **Plan** should be a first-class record with its own artifacts and comments
- each **Change** should be a first-class record with its own artifacts and comments
- `Still to Decide / Open Items` should either:
  - be part of the plan as unresolved plan items with their own attachments/comments, or
  - be a separate first-class type if they are important enough to carry evidence and discussion

The current top-level `documents[]` bucket is probably the wrong center of gravity.

## Simplicity / Cognitive Load

This is the core problem.

The feature currently combines:

- plan drafting
- plan approval lifecycle
- open decisions
- budget tracking
- change request workflow
- contractor response tracking
- incorporation bookkeeping
- milestone logging
- collection-level documents
- collection-level comments

That is a lot of product surface area for one homeowner tool.

The more defensible simplified model would be:

1. **Plan**
   - summary / scope
   - included
   - not included
   - open items / still to decide
   - plan artifacts
   - plan comments
   - status: working or approved

2. **Changes**
   - chronological log
   - simple status
   - cost / schedule impact
   - change artifacts
   - change comments

3. **History**
   - lightweight timeline derived from plan approval and changes

That feels like a homeowner record. The current feature still feels like a workflow engine wrapped in a homeowner UI.

## Mobile Assessment

This is a code-informed assessment only; I did not complete a live screenshot pass in this environment.

Likely mobile issues:

- `CurrentPlanSection.tsx` is too dense for one mobile surface
- the combination of status control, lists, budget, and banners likely creates a long, cognitively heavy scroll
- the main collection page asks for too much inline editing on one screen
- the most workable mobile pattern is probably:
  - plan summary card
  - open items card
  - changes list
  - tap into detail

The current detail-page pattern is stronger for mobile than the current all-in-one plan section.

## Desktop Assessment

The desktop layout is visually competent, but hierarchy is not the same as simplicity.

On desktop, the experience likely feels:

- organized
- information-rich
- still too process-heavy

The main issue is not spacing. It is that the desktop screen exposes too many concepts at once without a single dominant homeowner mental model.

## Top Issues

### 1. Plan & Changes is still modeled more like workflow software than a homeowner record

**Severity:** High  
**Confidence:** High

The current feature makes the homeowner understand multiple parallel workflows: plan state, change state, and change incorporation. That is the core reason it still feels too complicated.

**Recommendation:** Simplify to:
- working plan vs approved plan
- then a simple change log

### 2. Artifacts and conversation are attached to the wrong levels

**Severity:** High  
**Confidence:** High

The current architecture splits evidence across collection-level documents, change attachments, and collection/change comments. That weakens the “one record per plan or change” model.

**Recommendation:** Make Plan and Change the primary artifact-bearing records. Re-evaluate whether top-level documents should remain a separate bucket at all.

### 3. Homepage under-represents plan readiness and unresolved items

**Severity:** Medium  
**Confidence:** High

Homepage mostly surfaces active changes, not whether the plan is ready to approve or what still blocks approval.

**Recommendation:** Add homepage signals for:
- plan approval state
- unresolved open items / still-to-decide count
- plan changed since approval

### 4. User-facing copy is still too system-oriented

**Severity:** Medium  
**Confidence:** High

Problem phrases:
- `Shared`
- `Confirmed`
- `Acknowledged`
- `Approved by Homeowner`
- `Accepted by Contractor`
- `Incorporate into Plan`
- `content changed since status`

These are precise, but they sound like workflow software.

**Recommendation:** Rewrite around homeowner language:
- working plan
- approved plan
- requested change
- approved change
- completed
- needs decision

### 5. Still to Decide is not fully resolved as a concept

**Severity:** Medium  
**Confidence:** High

Right now it is just one of three plan lists. That makes it easy to store, but weak as a decision-making surface.

**Recommendation:** Decide explicitly whether `Still to Decide` is:
- part of plan approval readiness, or
- a separate open-items system

Do not leave it as a vague third list.

## Recommended Next Actions

1. Redefine the core product model in product language first:
   - one plan
   - approval/lock state
   - change log after approval
   - artifacts/comments owned by plan or change

2. Rewrite the homepage logic for Plan & Changes around:
   - plan ready vs not ready
   - number of open items
   - number of logged changes since approval

3. Simplify visible statuses in the UI before changing visual styling.

4. Reconsider `documents[]` as a top-level bucket. It likely wants to become:
   - plan attachments
   - change attachments
   - maybe open-item attachments if those remain first-class

5. Use the change-detail page as the model for future clarity: one record, one set of artifacts, one discussion, one outcome.

## Final Verdict

This feature is promising, but it is still too complicated for the homeowner experience HHC wants. The current implementation is technically organized, yet the mental model remains too workflow-heavy. Your proposed simplification — approved plan as the de facto locked baseline, followed by a simple change log with artifacts and conversation attached to each record — is materially stronger than the current UI and schema.
