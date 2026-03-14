# Plan & Changes Rebuild v1 — Sprint Ledger

**Sprint spec:** `docs/ai/active-sprint-plan-changes-v1.md`
**Started:** 2026-03-13
**Last updated:** 2026-03-13

---

## Phase Summary

| Phase | Objective | Status | Notes |
|-------|-----------|--------|-------|
| A | Product Model Reset | Complete | PCV1-001 through PCV1-008. Review: `plan-changes-v1-phase-a-review.md` |
| B | Open Items System | Complete | PCV1-009 through PCV1-014. Review: `plan-changes-v1-phase-b-review.md` |
| C | Record Ownership and Evidence | Complete | PCV1-015 through PCV1-019. Review: `plan-changes-v1-phase-c-review.md` |
| D | Main IA and Screen Rebuild | Complete | PCV1-020 through PCV1-029. Review: `plan-changes-v1-phase-d-review.md` |
| E | Copy, Status Language, Homepage Signals | Complete | PCV1-030 through PCV1-041. Review: `plan-changes-v1-phase-e-review.md` |
| F | Change Record Quality, Schema, Final Guardrails | Complete | PCV1-042 through PCV1-058. Review: `plan-changes-v1-phase-f-review.md` |

## Issue Rollup

| Issue ID | Title | Status | Phase | Acceptance |
|----------|-------|--------|-------|------------|
| PCV1-001 | Establish one authoritative Official Plan | Complete | A | Pass |
| PCV1-002 | Make plan state explicit and homeowner-legible | Complete | A | Pass |
| PCV1-003 | Intervene when editing an approved plan | Complete | A | Pass |
| PCV1-004 | Treat unlock as a real event | Complete | A | Pass |
| PCV1-005 | Reframe changes as amendments to the Official Plan | Complete | A | Pass |
| PCV1-006 | Keep the Official Plan cumulative | Complete | A | Pass |
| PCV1-007 | Add guided incorporation / merge flow | Complete | A | Pass |
| PCV1-008 | Preserve auditability under the hood | Complete | A | Pass |
| PCV1-009 | Replace "Still to Decide" with explicit open-item model | Complete | B | Pass |
| PCV1-010 | Add statuses for open items | Complete | B | Pass |
| PCV1-011 | Make open-item resolution explicit | Complete | B | Pass |
| PCV1-012 | Support approval with unresolved open items | Complete | B | Pass |
| PCV1-013 | Prompt before approving with unresolved items | Complete | B | Pass |
| PCV1-014 | Surface unresolved items as readiness indicators | Complete | B | Pass |
| PCV1-015 | Make plan-level artifacts belong to the plan | Complete | C | Pass |
| PCV1-016 | Make change-level artifacts belong to the change | Complete | C | Pass |
| PCV1-017 | Reduce or eliminate generic collection-level document ambiguity | Complete | C | Pass |
| PCV1-018 | Add narrow shared Reference Docs area only if truly needed | Complete | C | Pass |
| PCV1-019 | Add "affects plan sections" metadata to changes | Complete | C | Pass |
| PCV1-020 | Rebuild detail page around Official Record IA | Complete | D | Pass |
| PCV1-021 | Make Official Plan section visually primary and obviously locked when approved | Complete | D | Pass |
| PCV1-022 | Put plan artifacts under the plan, not between plan and changes | Complete | D | Pass |
| PCV1-023 | Split Pending Changes from Change History | Complete | D | Pass |
| PCV1-024 | Add compact Change Queue summary near top | Complete | D | Pass |
| PCV1-025 | Give history/activity its own proper section | Complete | D | Pass |
| PCV1-026 | Shift main page from edit-first to review-first | Complete | D | Pass |
| PCV1-027 | Use change-detail screen as design reference | Complete | D | Pass |
| PCV1-028 | Improve desktop primary vs secondary hierarchy | Complete | D | Pass |
| PCV1-029 | Reduce mobile concept density and stack burden | Complete | D | Pass |
| PCV1-030 | Rename "Current Plan" to "Official Plan" or equivalent | Complete | E | Pass |
| PCV1-031 | Rename "Still to Decide" to "Plan Open Items" | Complete | E | Pass |
| PCV1-032 | Rename "Incorporate into Plan" to "Add to Official Plan" or equivalent | Complete | E | Pass |
| PCV1-033 | Use clearer umbrella labels like Pending Changes / Change History | Complete | E | Pass |
| PCV1-034 | Simplify primary visible change statuses | Complete | E | Pass |
| PCV1-035 | Move role-specific approvals into metadata where possible | Complete | E | Pass |
| PCV1-036 | Rewrite helper text into homeowner-teaching language | Complete | E | Pass |
| PCV1-037 | Rewrite empty states so they teach the model | Complete | E | Pass |
| PCV1-038 | Rebuild homepage card logic around plan readiness | Complete | E | Pass |
| PCV1-039 | Improve next-up / attention logic | Complete | E | Pass |
| PCV1-040 | Rebuild plan index/list card | Complete | E | Pass |
| PCV1-041 | Make list/index view tell a confidence story | Complete | E | Pass |
| PCV1-042 | Require a clear one-line title for each change | Complete | F | Pass |
| PCV1-043 | Add "why this happened" field or equivalent | Complete | F | Pass |
| PCV1-044 | Separate proposed impact from final impact | Complete | F | Pass |
| PCV1-045 | Ensure each change has summary + rationale + evidence minimum | Complete | F | Pass |
| PCV1-046 | Keep enough change structure to remain operational | Complete | F | Pass |
| PCV1-047 | Add explicit plan open-items support in schema/data model | Complete | F | Pass |
| PCV1-048 | Add explicit change open-items support in schema/data model | Complete | F | Pass |
| PCV1-049 | Add plan approval metadata support | Complete | F | Pass |
| PCV1-050 | Add plan revision markers | Complete | F | Pass |
| PCV1-051 | Distinguish official totals logic from pending/approved-not-merged totals logic | Complete | F | Pass |
| PCV1-052 | Add incorporation summary support | Complete | F | Pass |
| PCV1-053 | After approval, bias primary CTA toward "Create Change" | Complete | F | Pass |
| PCV1-054 | Make approval a real ceremony | Complete | F | Pass |
| PCV1-055 | Surface unresolved change items during change approval | Complete | F | Pass |
| PCV1-056 | Make open-item closure feel like a logged event | Complete | F | Pass |
| PCV1-057 | Add export/shareable official summary snapshot | Complete | F | Pass |
| PCV1-058 | Do not let visual/copy polish substitute for conceptual cleanup | Complete | F | Pass |

---

## Phase A — Product Model Reset

### PCV1-001 — Establish one authoritative Official Plan
- Status: Complete
- Phase: A
- Type: Product Model / UI
- Decision: Renamed header to "Official Plan", removed status dropdown, added dedicated action buttons
- Implementation: CurrentPlanSection.tsx rewritten, constants.ts updated with 3-status model
- Review: Phase A review
- Acceptance: Pass
- Notes: Plan section is now visually primary with lock semantics

### PCV1-002 — Make plan state explicit and homeowner-legible
- Status: Complete
- Phase: A
- Type: Product Model / UI / Copy
- Decision: 3 statuses: working/approved/unlocked with homeowner-legible labels
- Implementation: PlanStatus type in project-summary.ts, PLAN_STATUS_CONFIG in constants.ts
- Review: Phase A review
- Acceptance: Pass
- Notes: Each status has label, color, bgColor, and description

### PCV1-003 — Intervene when editing an approved plan
- Status: Complete
- Phase: A
- Type: UI / Interaction
- Decision: Modal dialog with two choices: unlock or create change
- Implementation: ApprovedPlanInterventionDialog in CurrentPlanSection.tsx
- Review: Phase A review
- Acceptance: Pass
- Notes: Triggers on click of any editable field while approved

### PCV1-004 — Treat unlock as a real event
- Status: Complete
- Phase: A
- Type: Schema / Backend
- Decision: Unlock records milestone, stores metadata (who/when/reason)
- Implementation: unlockPlan() in useProjectSummaryState.ts, schema fields in project-summary.ts
- Review: Phase A review
- Acceptance: Pass
- Notes: unlocked_at, unlocked_by, unlock_reason fields added to CurrentPlan

### PCV1-005 — Reframe changes as amendments to the Official Plan
- Status: Complete
- Phase: A
- Type: UI / Copy
- Decision: Section renamed "Changes to Official Plan", button text "Add to Official Plan"
- Implementation: ChangesSection.tsx, ChangeDetailContent.tsx
- Review: Phase A review
- Acceptance: Pass
- Notes: Page order changed to Plan → Changes → Documents → Milestones

### PCV1-006 — Keep the Official Plan cumulative
- Status: Complete
- Phase: A
- Type: Product Model
- Decision: Incorporation merges into plan, plan stays authoritative
- Implementation: Existing incorporateChange logic preserved, guided dialog added
- Review: Phase A review
- Acceptance: Pass
- Notes: No structural change needed — existing merge logic already cumulative

### PCV1-007 — Add guided incorporation / merge flow
- Status: Complete
- Phase: A
- Type: UI / Interaction
- Decision: IncorporateDialog with impact summary, open item count, merge note
- Implementation: IncorporateDialog component in ChangesSection.tsx
- Review: Phase A review
- Acceptance: Pass
- Notes: Shows cost/schedule impact, warns about open items, requires confirmation

### PCV1-008 — Preserve auditability under the hood
- Status: Complete
- Phase: A
- Type: Schema / Backend
- Decision: Milestones for approve/unlock/re-approve, approval metadata, revision_number
- Implementation: approvePlan/unlockPlan/reapprovePlan in useProjectSummaryState.ts, MilestoneTimeline.tsx
- Review: Phase A review
- Acceptance: Pass
- Notes: Legacy milestone events preserved with icon mappings

## Phase B — Open Items System

### PCV1-009 — Replace "Still to Decide" with explicit open-item model
- Status: Complete
- Phase: B
- Type: Schema / UI
- Decision: New OpenItem interface with status field, separate from PlanItem. Plan-level and change-level open items.
- Implementation: OpenItem type + open_items on CurrentPlan and SummaryChange, backward-compatible migration from still_to_decide
- Review: Phase B review
- Acceptance: Pass
- Notes: still_to_decide deprecated but kept for migration; open_items now authoritative

### PCV1-010 — Add statuses for open items
- Status: Complete
- Phase: B
- Type: Schema / UI
- Decision: Four statuses: Open, Waiting, Resolved, Closed
- Implementation: OpenItemStatus type, color-coded dots in OpenItemsList, custom dropdown for status changes
- Review: Phase B review
- Acceptance: Pass
- Notes: Status dot click opens dropdown; no native <select>

### PCV1-011 — Make open-item resolution explicit
- Status: Complete
- Phase: B
- Type: Schema / UI
- Decision: Resolution captures note + actor + timestamp via ResolveDialog modal
- Implementation: resolved_at, resolved_by, resolution_note fields; resolveOpenItem creates milestone
- Review: Phase B review
- Acceptance: Pass
- Notes: Quick resolve button on hover + resolve dialog for note capture

### PCV1-012 — Support approval with unresolved open items
- Status: Complete
- Phase: B
- Type: UI / Interaction
- Decision: Plan can be approved with unresolved items; they remain visible after approval
- Implementation: Approval proceeds normally after user confirms in warning dialog
- Review: Phase B review
- Acceptance: Pass
- Notes: Unresolved items display persists even when plan is locked/approved

### PCV1-013 — Prompt before approving with unresolved items
- Status: Complete
- Phase: B
- Type: UI / Interaction
- Decision: Warning dialog with amber icon, count of unresolved items, "Go Back" and "Approve Anyway"
- Implementation: ApproveWithOpenItemsWarning component in CurrentPlanSection
- Review: Phase B review
- Acceptance: Pass
- Notes: Only appears when unresolvedOpenItems.length > 0

### PCV1-014 — Surface unresolved items as readiness indicators
- Status: Complete
- Phase: B
- Type: UI
- Decision: Amber banner in plan section + "X open items" badge in CollectionsPickerView
- Implementation: Readiness banner in CurrentPlanSection, unresolvedOpenItemCount in preview API + picker
- Review: Phase B review
- Acceptance: Pass
- Notes: Shows count and waiting breakdown; prioritizes open_items over legacy stillToDecideCount

## Phase C — Record Ownership and Evidence

### PCV1-015 — Make plan-level artifacts belong to the plan
- Status: Complete
- Phase: C
- Type: Schema / UI
- Decision: DocScope type ('plan' | 'reference') added to SummaryDocument. Default is 'plan'.
- Implementation: doc_scope field in schema, documents split into Plan/Reference groups in UI
- Review: Phase C review
- Acceptance: Pass
- Notes: Existing docs without scope default to 'plan' — no migration needed

### PCV1-016 — Make change-level artifacts belong to the change
- Status: Complete
- Phase: C
- Type: Schema / UI
- Decision: Already implemented — changes have their own attachments array with full CRUD
- Implementation: No additional changes needed
- Review: Phase C review
- Acceptance: Pass
- Notes: Change attachments were already clearly owned by individual changes

### PCV1-017 — Reduce or eliminate generic collection-level document ambiguity
- Status: Complete
- Phase: C
- Type: UI / Product Model
- Decision: Documents split into Plan Documents (default) and Reference Documents
- Implementation: DocumentsSection groups by doc_scope, shows group headers
- Review: Phase C review
- Acceptance: Pass
- Notes: Generic "Key Plan Documents" bucket replaced with scoped groups

### PCV1-018 — Add narrow shared Reference Docs area only if truly needed
- Status: Complete
- Phase: C
- Type: UI / Product Model
- Decision: Reference docs section only appears when reference docs exist. Clearly labeled "Shared across plan and changes".
- Implementation: Conditional rendering of reference section, "Ref" button on plan docs to move
- Review: Phase C review
- Acceptance: Pass
- Notes: Scope toggle on add form; move buttons on existing docs

### PCV1-019 — Add "affects plan sections" metadata to changes
- Status: Complete
- Phase: C
- Type: Schema
- Decision: affects_sections: string[] on SummaryChange with 5 known sections
- Implementation: Toggleable pill selector on change detail page
- Review: Phase C review
- Acceptance: Pass
- Notes: Sections: scope, included, not_included, budget, open_items

## Phase D — Main IA and Screen Rebuild

### PCV1-020 — Rebuild detail page around Official Record IA
- Status: Complete
- Phase: D
- Type: UI
- Decision: Reordered page sections to: Official Plan → Documents → Change Queue Summary → Changes → Timeline & History
- Implementation: ToolContent.tsx section order rewritten, also fixed hasContent check to use open_items instead of still_to_decide
- Review: Phase D review
- Acceptance: Pass
- Notes: Page hierarchy flows from authoritative record (plan) down to operational changes and history

### PCV1-021 — Make Official Plan section visually primary and obviously locked when approved
- Status: Complete
- Phase: D
- Type: UI
- Decision: Larger heading text when approved, bigger lock icon, subtle glow shadow, more padding on desktop
- Implementation: CurrentPlanSection.tsx — conditional text-base/text-sm heading, w-4 lock icon, shadow-[0_0_24px], md:p-6 padding
- Review: Phase D review
- Acceptance: Pass
- Notes: Approved plan now visually dominates the page with emerald accent glow

### PCV1-022 — Put plan artifacts under the plan, not between plan and changes
- Status: Complete
- Phase: D
- Type: UI
- Decision: Documents section placed immediately after Official Plan, before changes
- Implementation: ToolContent.tsx section ordering
- Review: Phase D review
- Acceptance: Pass
- Notes: Documents are now clearly part of the "plan record" zone

### PCV1-023 — Split Pending Changes from Change History
- Status: Complete
- Phase: D
- Type: UI
- Decision: Filter changes into pending (active) and history (done/closed/incorporated) groups with labeled sub-headers
- Implementation: ChangesSection.tsx — renderChangeRow function, pendingChanges/historyChanges filter, labeled group headers
- Review: Phase D review
- Acceptance: Pass
- Notes: Dynamic subheaders only appear when respective group has items

### PCV1-024 — Add compact Change Queue summary near top
- Status: Complete
- Phase: D
- Type: UI
- Decision: ChangeQueueSummary component shows pending count, awaiting incorporation, unresolved change items, pending cost impact
- Implementation: ToolContent.tsx — new ChangeQueueSummary component above Changes section
- Review: Phase D review
- Acceptance: Pass
- Notes: Only renders when there are pending or awaiting-incorporation changes

### PCV1-025 — Give history/activity its own proper section
- Status: Complete
- Phase: D
- Type: UI
- Decision: Renamed "Milestones" to "Timeline & History", shows 3 most recent events by default instead of fully collapsed
- Implementation: MilestoneTimeline.tsx — preview of last 3 events always visible, activity icon, "Show all N events" expand
- Review: Phase D review
- Acceptance: Pass
- Notes: History is no longer just a collapsed accordion — recent events are visible on first load

### PCV1-026 — Shift main page from edit-first to review-first
- Status: Complete
- Phase: D
- Type: UI / Interaction
- Decision: Visual separator divides page into primary (plan record) and secondary (changes/history) zones
- Implementation: ToolContent.tsx — border-t divider between plan zone and changes zone, tighter spacing within zones
- Review: Phase D review
- Acceptance: Pass
- Notes: Page now reads top-to-bottom as "here is the official record" then "here are the amendments and history"

### PCV1-027 — Use change-detail screen as design reference
- Status: Complete
- Phase: D
- Type: Review
- Decision: Reviewed change detail page's record-focused discipline. Main page now follows same pattern: clear sections, labeled metadata, status badges, record-first layout
- Implementation: No additional code changes — PCV1-020/023/026 already implemented the pattern
- Review: Phase D review
- Acceptance: Pass
- Notes: The main page's section structure mirrors the change detail page's record discipline

### PCV1-028 — Improve desktop primary vs secondary hierarchy
- Status: Complete
- Phase: D
- Type: UI
- Decision: Plan section gets more desktop padding (md:p-6), visual separator between plan/changes zones, tighter spacing within secondary zone
- Implementation: ToolContent.tsx zone structure, CurrentPlanSection md:p-6, md:space-y-5 within zones
- Review: Phase D review
- Acceptance: Pass
- Notes: Desktop layout clearly differentiates authoritative plan from operational change log

### PCV1-029 — Reduce mobile concept density and stack burden
- Status: Complete
- Phase: D
- Type: UI
- Decision: Hide secondary change row metadata on mobile (cost, attachments, comments, incorporated/modified badges); keep title + status visible; make "Details →" link always visible on mobile
- Implementation: ChangesSection.tsx — hidden md:inline/md:flex on secondary metadata, removed md:opacity-0 on Details link for mobile
- Review: Phase D review
- Acceptance: Pass
- Notes: Mobile change rows show only title + status + Details link, reducing visual noise

## Phase E — Copy, Status Language, and Homepage Signals

### PCV1-030 — Rename "Current Plan" to "Official Plan" or equivalent
- Status: Complete
- Phase: E
- Type: Copy
- Decision: Already completed in Phase A (PCV1-001)
- Implementation: Header reads "Official Plan" in CurrentPlanSection.tsx
- Review: Phase E review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-031 — Rename "Still to Decide" to "Plan Open Items"
- Status: Complete
- Phase: E
- Type: Copy
- Decision: Already completed in Phase B (PCV1-009)
- Implementation: Label reads "Plan Open Items" in CurrentPlanSection.tsx
- Review: Phase E review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-032 — Rename "Incorporate into Plan" to "Add to Official Plan" or equivalent
- Status: Complete
- Phase: E
- Type: Copy
- Decision: Already completed in Phase A (PCV1-007)
- Implementation: Button reads "Add to Official Plan" in ChangesSection.tsx and ChangeDetailContent.tsx
- Review: Phase E review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-033 — Use clearer umbrella labels like Pending Changes / Change History
- Status: Complete
- Phase: E
- Type: Copy
- Decision: Already completed in Phase D (PCV1-023). Section title also changed to "Change Log"
- Implementation: ChangesSection.tsx — section title "Change Log", subheaders "Pending Changes" / "Change History"
- Review: Phase E review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-034 — Simplify primary visible change statuses
- Status: Complete
- Phase: E
- Type: Copy / Schema
- Decision: Simplified all 6 status labels to homeowner-friendly language
- Implementation: constants.ts — Requested→"Proposed Change", Awaiting Homeowner→"Needs Your Review", Approved by Homeowner→"Approved Change", Done→"Added to Plan", Closed→"Not Moving Forward". Added shortLabel field for compact display.
- Review: Phase E review
- Acceptance: Pass
- Notes: Schema values unchanged, only display labels updated. shortLabel available for mobile.

### PCV1-035 — Move role-specific approvals into metadata where possible
- Status: Complete
- Phase: E
- Type: UI / Copy
- Decision: Simplified labels reduce role-specific language. "Accepted by Contractor" retained as the only meaningful role-specific label.
- Implementation: Other statuses no longer mention roles: "Proposed Change" instead of "Requested", "Approved Change" instead of "Approved by Homeowner"
- Review: Phase E review
- Acceptance: Pass
- Notes: Role details visible in expanded change detail, not in status badge

### PCV1-036 — Rewrite helper text into homeowner-teaching language
- Status: Complete
- Phase: E
- Type: Copy
- Decision: Rewrote approved/unlocked banners, scope placeholder, plan status descriptions
- Implementation: CurrentPlanSection.tsx banners, constants.ts plan status descriptions (e.g., "Your plan is approved and locked. If something changes, create a change record below so you have a clear paper trail.")
- Review: Phase E review
- Acceptance: Pass
- Notes: Copy now addresses "you" and explains why actions matter

### PCV1-037 — Rewrite empty states so they teach the model
- Status: Complete
- Phase: E
- Type: Copy / UI
- Decision: Empty states now explain what goes in each section and why
- Implementation: ChangesSection empty state teaches plan/change concept; CollectionsPickerView empty card says "No plan details yet — start by describing your project scope"; scope placeholder explains purpose
- Review: Phase E review
- Acceptance: Pass
- Notes: Empty states guide the user toward the right first action

### PCV1-038 — Rebuild homepage card logic around plan readiness
- Status: Complete
- Phase: E
- Type: UI
- Decision: Card now leads with plan status badge, then unresolved open items as attention signal, then pending changes
- Implementation: CollectionsPickerView.tsx card view — status badge first, open items next, pending changes below, budget last
- Review: Phase E review
- Acceptance: Pass
- Notes: No longer overweights active-change counts; plan stability is the primary signal

### PCV1-039 — Improve next-up / attention logic
- Status: Complete
- Phase: E
- Type: UI
- Decision: Attention signals use amber styling for pending changes and open items; settled plans show clean approved badge
- Implementation: CollectionsPickerView.tsx — amber-colored pending change count, open items count in both card and table views
- Review: Phase E review
- Acceptance: Pass
- Notes: Feature surfaces for action-needed reasons, not just because data exists

### PCV1-040 — Rebuild plan index/list card
- Status: Complete
- Phase: E
- Type: UI
- Decision: Table view leads with plan status badge + open items, then pending changes as attention signal
- Implementation: CollectionsPickerView.tsx table column — status badge first (Draft/Approved/Unlocked), open items inline, pending changes below
- Review: Phase E review
- Acceptance: Pass
- Notes: Replaced old "N items · N included" pattern with status-first layout

### PCV1-041 — Make list/index view tell a confidence story
- Status: Complete
- Phase: E
- Type: UI
- Decision: Status badges use clear language (Draft/Approved/Unlocked), attention signals (open items, pending changes) use amber, settled state shows clean emerald
- Implementation: Both card and table views in CollectionsPickerView.tsx
- Review: Phase E review
- Acceptance: Pass
- Notes: —

## Phase F — Change Record Quality, Schema Support, and Final Guardrails

### PCV1-042 — Require a clear one-line title for each change
- Status: Complete
- Phase: F
- Type: UI
- Decision: Already enforced — addChange() requires title.trim(), add form has required title input
- Implementation: No additional changes needed
- Review: Phase F review
- Acceptance: Pass
- Notes: Title is required for creation; existing empty-title protection via "Untitled" fallback in coerceChange

### PCV1-043 — Add "why this happened" field or equivalent
- Status: Complete
- Phase: F
- Type: Schema / UI
- Decision: Added `rationale` field to SummaryChange interface, labeled "Why This Changed"
- Implementation: Schema: rationale field + coerceChange preservation. UI: "Why This Changed" field on ChangeDetailContent page
- Review: Phase F review
- Acceptance: Pass
- Notes: Separate from description — rationale captures context for future reference

### PCV1-044 — Separate proposed impact from final impact
- Status: Complete
- Phase: F
- Type: Schema / UI
- Decision: Added proposed_cost_impact / proposed_schedule_impact fields; existing cost_impact / schedule_impact serve as final
- Implementation: Schema: 2 new fields + coerceChange preservation. UI: ChangeDetailContent shows "Estimated Cost/Schedule" (proposed) and "Final Cost/Schedule" (agreed) as separate rows
- Review: Phase F review
- Acceptance: Pass
- Notes: Backward compatible — existing cost_impact remains the budget-math field

### PCV1-045 — Ensure each change has summary + rationale + evidence minimum
- Status: Complete
- Phase: F
- Type: UI
- Decision: Change detail now has: title (required), description, rationale, requested_by, proposed/final impact, contractor response, links, attachments, open items, affects sections
- Implementation: All fields present on ChangeDetailContent. Placeholder text guides user to fill each field.
- Review: Phase F review
- Acceptance: Pass
- Notes: Not enforced as mandatory — but all fields available with guiding placeholders

### PCV1-046 — Keep enough change structure to remain operational
- Status: Complete
- Phase: F
- Type: Review
- Decision: Verified: changes retain full operational structure — title, description, rationale, status, proposed/final impact, contractor response, note, open items, links, attachments, affects_sections
- Implementation: No changes needed — structure is sufficient
- Review: Phase F review
- Acceptance: Pass
- Notes: Phase F additions (rationale, proposed impact) add quality without removing operational fields

### PCV1-047 — Add explicit plan open-items support in schema/data model
- Status: Complete
- Phase: F
- Type: Schema
- Decision: Already completed in Phase B (PCV1-009)
- Implementation: OpenItem interface, open_items on CurrentPlan, backward migration from still_to_decide
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-048 — Add explicit change open-items support in schema/data model
- Status: Complete
- Phase: F
- Type: Schema
- Decision: Already completed in Phase B (PCV1-009)
- Implementation: open_items on SummaryChange, addChangeOpenItem/updateChangeOpenItem/deleteChangeOpenItem in state hook
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-049 — Add plan approval metadata support
- Status: Complete
- Phase: F
- Type: Schema
- Decision: Already completed in Phase A (PCV1-004/008)
- Implementation: approved_at, approved_by, unlocked_at, unlocked_by, unlock_reason, status_changed_at on CurrentPlan
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-050 — Add plan revision markers
- Status: Complete
- Phase: F
- Type: Schema
- Decision: Already completed in Phase A (PCV1-008)
- Implementation: revision_number on CurrentPlan, incremented on reapprove
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-051 — Distinguish official totals logic from pending/approved-not-merged totals logic
- Status: Complete
- Phase: F
- Type: Backend / UI
- Decision: Budget section clearly separates baseline from approved change costs. ChangeQueueSummary shows pending cost impact separately.
- Implementation: CurrentPlanSection budget shows: baseline + approved changes = current total. ChangeQueueSummary shows pending (unincorporated) cost impact.
- Review: Phase F review
- Acceptance: Pass
- Notes: Budget math uses only approved changes; pending costs shown as a separate advisory figure

### PCV1-052 — Add incorporation summary support
- Status: Complete
- Phase: F
- Type: Schema / UI
- Decision: Already completed in Phase A (PCV1-007)
- Implementation: incorporateChange creates change_incorporated milestone with timestamp; incorporated_at/by metadata on change
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-053 — After approval, bias primary CTA toward "Create Change"
- Status: Complete
- Phase: F
- Type: UI / Interaction
- Decision: Added prominent "Create a Change" button in approved plan section with helper text
- Implementation: CurrentPlanSection.tsx — sandstone-styled CTA button with plus icon and explanation text, visible only when plan is approved
- Review: Phase F review
- Acceptance: Pass
- Notes: Scrolls to changes section; approved banner also mentions change records

### PCV1-054 — Make approval a real ceremony
- Status: Complete
- Phase: F
- Type: UI / Interaction
- Decision: Already completed in Phase B (PCV1-012/013)
- Implementation: ApproveWithOpenItemsWarning dialog, unresolved items check, milestone creation
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-055 — Surface unresolved change items during change approval
- Status: Complete
- Phase: F
- Type: UI
- Decision: StatusDropdown now warns when setting a change to approval status while it has unresolved open items
- Implementation: ChangesSection.tsx StatusDropdown — APPROVAL_STATUSES set, pendingStatus state, warning dialog with "Go Back" / "Proceed Anyway"
- Review: Phase F review
- Acceptance: Pass
- Notes: Applies to approved_by_homeowner, accepted_by_contractor, and done statuses

### PCV1-056 — Make open-item closure feel like a logged event
- Status: Complete
- Phase: F
- Type: UI / Schema
- Decision: Already completed in Phase B (PCV1-011)
- Implementation: resolveOpenItem creates open_item_resolved milestone event; ResolveDialog captures resolution note
- Review: Phase F review
- Acceptance: Pass
- Notes: No additional changes needed

### PCV1-057 — Add export/shareable official summary snapshot
- Status: Complete
- Phase: F
- Type: UI
- Decision: "Copy Summary" button in header copies formatted text summary to clipboard
- Implementation: ToolContent.tsx — handleCopySummary generates structured text (status, scope, included/excluded, open items, budget, pending changes), clipboard API write
- Review: Phase F review
- Acceptance: Pass
- Notes: Text format suitable for sharing via email, messaging. Future: could add PDF/print view.

### PCV1-058 — Do not let visual/copy polish substitute for conceptual cleanup
- Status: Complete
- Phase: F
- Type: Review
- Decision: Verified — implementation order followed phase structure: A (product model), B (open items), C (ownership), D (IA rebuild), E (copy), F (quality). No phase was skipped or reordered. Conceptual model changes preceded visual/copy polish.
- Implementation: Ledger confirms phase ordering. Product model (plan statuses, open items, document scoping) was established before any copy or homepage changes.
- Review: Phase F review
- Acceptance: Pass
- Notes: Sprint followed mandatory phase order A→B→C→D→E→F
