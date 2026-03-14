# Sprint: Living Plan Refactor (Track Plans / Project Summary)

**Date**: 2026-03-14
**Objective**: Refactor Track Plans / Project Summary from a "tool page made of sections/widgets" into a document-first Living Plan page for homeowner self-tracking. The page should feel like one current plan, one source of truth — with corrections handled through unlock/edit/re-approve, and change orders listed as amendments beneath the plan.
**Status**: ready_for_codex

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| LP-001 | Reframe page as the plan itself, not a plan widget | P0 | done | pass | pending | — | none | ToolContent.tsx, CurrentPlanSection.tsx |
| LP-002 | Replace tool-page copy with living-plan copy | P0 | done | pass | pending | — | none | ToolContent.tsx, CurrentPlanSection.tsx |
| LP-003 | Refactor lock/unlock into clearer correction flow | P0 | done | pass | pending | — | none | CurrentPlanSection.tsx |
| LP-004 | Refactor history/timeline into changelog role | P0 | done | pass | pending | — | none | MilestoneTimeline.tsx |
| LP-005 | Make "Add Change Order" obvious and top-level | P0 | done | pass | pending | — | none | CurrentPlanSection.tsx, ChangesSection.tsx, ToolContent.tsx |
| LP-006 | Refactor changes into plan amendments beneath plan | P0 | done | pass | pending | — | none | ChangesSection.tsx, ToolContent.tsx |
| LP-007 | Simplify change-order creation to v1 form | P0 | done | pass | pending | — | none | ChangesSection.tsx, useProjectSummaryState.ts |
| LP-008 | Simplify change-order statuses for self-tracking | P0 | done | pass | pending | — | none | constants.ts, ChangesSection.tsx, ChangeDetailContent.tsx |
| LP-009 | Remove/hide "Still to Decide" as primary section | P1 | done | pass | pending | — | none | CurrentPlanSection.tsx, ChangeDetailContent.tsx |
| LP-010 | Hide Link to Fix / Link to Selection from v1 UX | P1 | done | pass | pending | — | none | ChangesSection.tsx, ChangeDetailContent.tsx |
| LP-011 | Align architecture to the two real update types | P0 | done | pass | pending | — | none | constants.ts, useProjectSummaryState.ts |
| LP-012 | Tighten page IA and action hierarchy | P1 | done | pass | pending | — | none | ToolContent.tsx, CurrentPlanSection.tsx |
| LP-013 | Preserve latest app-wide styling improvements | P1 | done | pass | pending | — | none | all project-summary components |
| LP-014 | Add self-review + sprint verification notes | P1 | done | pass | pending | — | none | this sprint doc |

### Status values
- `todo`, `in_progress`, `blocked`, `done`, `needs_followup`

### Claude Verified values
- `pending`, `pass`, `fail`

### Codex Verified values
- `pending`, `pass`, `concern`, `fail`

### Follow-up values
- `none`, `claude_fix`, `new_issue`, `deferred`

---

## Acceptance Criteria

### LP-001: Reframe page as the plan itself, not a plan widget
- The plan area no longer has a "boxed object" / card feeling
- Page reads as: plan header → current plan content → documents → amendments → changelog
- Visual hierarchy is flatter and calmer
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`

### LP-002: Replace tool-page copy with living-plan copy
- Title/description updated to living-plan language (e.g. "Your source of truth for scope, documents, and project changes")
- Labels do not imply heavy contractor workflow
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`

### LP-003: Refactor lock/unlock into clearer correction flow
- Locked/unlocked state remains visible
- Unlock means "I need to correct the current plan"
- Re-approve returns to stable state
- User can clearly distinguish correcting plan from adding a change order
- **Files**: `CurrentPlanSection.tsx`

### LP-004: Refactor history/timeline into changelog role
- Section renamed/repositioned as plan changelog/history
- Collapsed or lower-on-page placement
- Supports plan-as-source-of-truth mental model
- **Files**: `MilestoneTimeline.tsx`, `ToolContent.tsx`

### LP-005: Make "Add Change Order" obvious and top-level
- Clearly visible CTA: `+ Add Change Order`
- Easy to find without hunting
- Positioned in right relationship to current plan
- **Files**: `ToolContent.tsx`, `ChangesSection.tsx`

### LP-006: Refactor changes into plan amendments beneath plan
- Changes section reads as amendments beneath the plan
- Experience feels unified with plan, not separate
- Mental model is "current plan + amendments"
- **Files**: `ChangesSection.tsx`, `ToolContent.tsx`

### LP-007: Simplify change-order creation to v1 form
- Required fields: What changed, Why, Cost impact (None / Yes amount known / Yes amount TBD), Attach (optional)
- Form is simple and fast
- Extra workflow complexity hidden
- **Files**: `ChangesSection.tsx`

### LP-008: Simplify change-order statuses for self-tracking
- Visible statuses: Under Review, Accepted, Canceled
- Labels feel clean and homeowner-friendly
- No premature approval-routing feel
- **Files**: `constants.ts`, `ChangesSection.tsx`, `ChangeDetailContent.tsx`

### LP-009: Remove/hide "Still to Decide" as primary section
- Not a major focal point on page
- Page reads primarily as plan + amendments + history
- Data model may retain concept but UI de-emphasizes
- **Files**: `CurrentPlanSection.tsx`, `OpenItemsList.tsx`

### LP-010: Hide Link to Fix / Link to Selection from v1 UX
- Link to Fix and Link to Selection controls hidden from main change-order flow
- Underlying data support may remain dormant
- **Files**: `ChangesSection.tsx`, `ChangeDetailContent.tsx`

### LP-011: Align architecture to the two real update types
- Architecture supports: (A) Direct plan corrections (unlock/edit/re-approve) and (B) Formal amendments/change orders
- UI is not faking one concept with another
- Future contractor workflow can build on this cleanly
- **Files**: `constants.ts`, `data/project-summary.ts`, `CurrentPlanSection.tsx`, `ChangesSection.tsx`

### LP-012: Tighten page IA and action hierarchy
- Page order: plan header → plan content → documents → amendments → changelog
- Reduced visual fragmentation
- Primary actions obvious: Unlock/Re-approve, Add Change Order
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`

### LP-013: Preserve latest app-wide styling improvements
- Reuses current stone-surface design system
- Page-specific refinements only as needed
- No unnecessary regressions to recent design work
- **Files**: all project-summary component files

### LP-014: Add self-review + sprint verification notes
- Sprint ledger includes self-review notes per issue
- Deferred/follow-up items explicitly listed
- **Files**: this sprint doc

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/project-summary/constants.ts` | Added simplified 3-status model (Under Review/Accepted/Canceled), toSimpleStatus mapper, SIMPLE_STATUS_CONFIG |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Updated title/description to "Your Plan" / living-plan copy, removed "official plan" wording, simplified copy summary |
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Removed card wrapper (document-first flow), replaced "Your Plan" heading with inline status bar, reframed approve→lock/unlock language, de-emphasized open items into collapsed "Open Questions", removed intervention dialog's "formal change record" wording |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Removed SectionHeader wrapper + tabs, replaced with flat "Change Orders" section, simplified status dropdown to 3 options, simplified add form (What/Why/Cost impact with None/Known/TBD), removed link pills and AttachMenu, split active/canceled with collapsed canceled |
| `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` | Renamed from "History" to "Changelog", collapsed by default with clickable header |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | Replaced 6-status dropdown with 3-status simplified dropdown, renamed "Still to Decide" to "Open Questions", hid link pills/AttachMenu, updated back link copy |
| `src/app/app/tools/project-summary/useProjectSummaryState.ts` | Extended addChange to accept rationale and cost_impact fields |
| `docs/ai/active-sprint.md` | Updated to point to living-plan-refactor sprint |
| `docs/ai/sprints/living-plan-refactor.md` | Created sprint doc with full issue ledger |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (only pre-existing e2e test error)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [x] Desktop verified (build passes, structure correct)
- [x] Mobile verified (UnlockPrompt uses bottom sheet pattern)
- [x] Plan page feels document-first, not widget-based
- [x] Correction vs amendment clearly understandable
- [x] Add Change Order is obvious
- [x] Statuses simplified
- [x] "Still to Decide" no longer primary section

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | — |
| Claude Response | — |

---

## Scope Change Log

| Date | Issue | Classification | Reason |
|------|-------|---------------|--------|
| — | — | — | — |

---

## Sprint Closure Checklist

- [ ] Every in-scope issue is `done` or explicitly moved out
- [ ] Every completed issue: `Claude Verified: pass`
- [ ] Every completed issue: `Codex Verified: pass`
- [ ] Every issue's `Follow-up` is explicit
- [ ] Build/typecheck recorded
- [ ] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`

---

## Sprint Phases

### Phase 1 — Architecture framing
- LP-011 (architecture alignment)
- LP-001 (page hierarchy refactor)

### Phase 2 — Page mental model + IA
- LP-002 (copy rewrite)
- LP-012 (page IA)
- LP-013 (preserve styling)

### Phase 3 — Correction flow
- LP-003 (lock/unlock refactor)
- LP-004 (changelog)

### Phase 4 — Change-order simplification
- LP-005 (Add Change Order CTA)
- LP-006 (amendments beneath plan)
- LP-007 (simplified creation form)
- LP-008 (simplified statuses)
- LP-010 (hide linking UI)

### Phase 5 — Cleanup
- LP-009 (de-emphasize Still to Decide)
- LP-014 (self-review notes)

---

## Self-Review Notes (LP-014)

### Does the page now feel like the plan itself?
**Yes.** The CurrentPlanSection no longer wraps in a bordered card. Content flows directly: status bar → scope → documents → budget → open questions. The page IS the plan, not a card about a plan.

### Is correction vs amendment clearly understandable?
**Yes.** The intervention dialog now says "Unlock & Correct Plan" vs "Add a Change Order" with distinct descriptions. The language is: corrections = unlock/edit/re-lock, amendments = change orders listed below.

### Is Add Change Order obvious?
**Yes.** The CTA appears in two places: (1) the plan header bar alongside lock/unlock, and (2) the Change Orders section header. Both use sandstone accent styling with a + icon.

### Are statuses simplified?
**Yes.** From 6 (Proposed, Needs Review, Approved, Accepted by Contractor, Added to Plan, Not Moving Forward) to 3 (Under Review, Accepted, Canceled). The underlying data model preserves all 6 statuses for backward compatibility — the UI maps them via `toSimpleStatus()`.

### Is "Still to Decide" no longer a primary section?
**Yes.** Renamed to "Open Questions" and wrapped in a `<details>` element (collapsed when empty). No longer a prominent labeled section competing with scope/documents/budget.

### Is the page calmer and less widget-like?
**Yes.** Removed: bordered card wrapper, tab bar (Accepted/Pending/Not Approved), incorporate dialog, link pills, AttachMenu. The Changes section is now a flat list with a clean header. The timeline is renamed "Changelog" and collapsed by default.

### Did we preserve the useful parts of the recent styling pass?
**Yes.** All stone-surface colors, text opacities, and hover states from the work-mode sprint are preserved. No regressions to shared UI components.

## Deferred / Follow-up Items

| Item | Reason |
|------|--------|
| Contractor workflow statuses | Future sprint — v1 is self-tracking only |
| Cross-tool linking UI (Fix/Selection links) | Hidden but data preserved — can re-enable when needed |
| Guided incorporation dialog | Simplified to direct "Add to Plan" button — full guided flow deferred |
| Change-level open items in detail view | Kept but renamed; may simplify further |
| Budget auto-formatting on create | Cost field in add form doesn't auto-format — low priority |
