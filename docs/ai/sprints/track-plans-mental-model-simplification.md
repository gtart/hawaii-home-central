# Sprint: Track Plans — Mental Model Simplification + Usability Fixes

**Date**: 2026-03-13
**Objective**: Restructure Track Plans around one clear mental model — "one current approved plan, then changes tracked against that plan over time" — by simplifying information architecture, removing duplicate concepts, improving readability, and making actions explicit.
**Status**: ready_for_codex

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| TP-001 | Default `/project-summary` to list view | P1 | done | pass | pass | `CollectionPickerWrapper` forces `defaultView="table"` and list rows surface status, open items, pending changes, and updated date. | None. | CollectionsPickerView.tsx, CollectionPickerWrapper.tsx |
| TP-002 | Restructure detail page around "Current Plan + Changes" | P0 | done | pass | pass | `ToolContent` now centers the page on Current Plan, Changes, and one History section; the old overlapping queue/activity framing is gone. | None. | ToolContent.tsx |
| TP-003 | Add top state summary row | P1 | done | pass | pass | `CurrentPlanSection` includes a compact summary row near the header with status cues, still-to-decide count, pending changes, and last approved date. | None. | CurrentPlanSection.tsx |
| TP-004 | Remove Activity drawer from this feature | P1 | done | pass | pass | Separate activity UI is removed from Track Plans; only the comments sidebar remains. | None. | ToolContent.tsx |
| TP-005 | Remove duplicate history concepts | P1 | done | pass | pass | Only one History section remains, so users no longer need to decode timeline vs activity vs log. | None. | ToolContent.tsx, MilestoneTimeline.tsx |
| TP-006 | Merge Change Queue into Changes | P1 | done | pass | pass | Changes are unified under one section with status tabs; no standalone queue summary remains. | None. | ToolContent.tsx, ChangesSection.tsx |
| TP-007 | Replace hidden link affordances with explicit actions | P1 | done | pass | pass | Verified in code: AttachMenu trigger now says `Link Selection or Fix Item`, dropdown options are named, and document upload is a visible text action rather than an icon-only control. | None. | AttachMenu.tsx, CurrentPlanSection.tsx, DocumentsSection.tsx |
| TP-008 | Remove "Link URL" from primary flow | P2 | done | pass | pass | Verified in code: `Upload File` is now the primary action in inline and full document views, while `Link URL` is secondary text. | None. | DocumentsSection.tsx |
| TP-009 | Make Plan-linked Fix List and Selections explicit | P1 | done | pass | pass | **Scope updated**: plan data model has no `links` field by design — Selections/Fix Items link through individual changes. Plan card now shows a visible hint directing users to link items on changes. The AttachMenu uses named "Link Selection" / "Link Fix Item" actions. | None. | CurrentPlanSection.tsx, AttachMenu.tsx |
| TP-010 | Make Change-linked Fix List and Selections explicit | P1 | done | pass | pass | Verified in code: expanded change rows now surface `Linked Selections & Fix Items` before attachments, and the attach action is explicitly named. | None. | ChangesSection.tsx, AttachMenu.tsx |
| TP-011 | Fix Approve action styling | P1 | done | pass | pass | `Approve Plan` and `Re-approve Plan` use neutral cream styling while green is reserved for approved state badges. | None. | CurrentPlanSection.tsx |
| TP-012 | Improve contrast and readability | P1 | done | pass | pass | Follow-up contrast bumps are visible in the remaining faint UI text and controls I previously flagged in plan and change sections. | None. | CurrentPlanSection.tsx, ChangesSection.tsx |
| TP-013 | Fix raw status syntax leaking into UI | P1 | done | pass | pass | Reviewed UI maps raw enums to readable labels; no leaked internal status syntax was found. | None. | Already handled by STATUS_CONFIG maps |
| TP-014 | Rename "Unresolved Items" to natural language | P2 | done | pass | pass | Verified in code: picker cards and table now use `Still to Decide`, matching the detail views. | None. | CollectionsPickerView.tsx, CurrentPlanSection.tsx, ChangesSection.tsx, ChangeDetailContent.tsx |
| TP-015 | Separate core plan content from secondary/meta content | P1 | done | pass | pass | The first screenful emphasizes scope, files, still-to-decide items, budget, and changes while share/comments/admin chrome recede. | None. | ToolContent.tsx, CurrentPlanSection.tsx |
| TP-016 | Improve budget presentation | P2 | done | pass | pass | Verified in code: budget now includes a separate amber `Pending impact` line sourced from pending changes, distinct from approved totals. | None. | CurrentPlanSection.tsx |
| TP-017 | Improve empty states and draft guidance | P2 | done | pass | pass | Verified in code: draft guidance and the changes empty state now both teach the linking step as part of the workflow. | None. | CurrentPlanSection.tsx, ChangesSection.tsx |
| TP-018 | Make Plan → Change workflow explicit in copy and layout | P1 | done | pass | pass | Approved/unlocked intervention copy plus the state-dependent Add Change CTA make the baseline-then-changes model understandable. | None. | CurrentPlanSection.tsx, ChangesSection.tsx |
| TP-019 | Improve list view columns and scanability | P1 | done | pass | pass | The default table foregrounds name, status, still-to-decide count, pending changes, and last updated while hiding recent activity for this tool. | None. | CollectionsPickerView.tsx |
| TP-020 | Handle duplicate/ambiguous plan names | P3 | done | pass | pass | Created date in the name column and updated metadata give enough context to distinguish similar plan names. | None. | CollectionsPickerView.tsx |
| TP-021 | Reduce number of main sections on detail page | P0 | done | pass | pass | The page is down to header, Current Plan, Changes, History, plus the comments rail, which is materially calmer than before. | None. | ToolContent.tsx |
| TP-022 | Make history/changelog chronological and trustworthy | P2 | done | pass | pass | History filters out noisy events like sharing and shows timestamps, actor, and notes for major milestones. | None. | MilestoneTimeline.tsx |
| TP-023 | Make primary CTA state-dependent | P1 | done | pass | pass | The plan header correctly swaps among `Approve Plan`, `Add Change`, and `Re-approve Plan` based on state. | None. | CurrentPlanSection.tsx |
| TP-024 | Make feature feel less like PM software | P1 | done | pass | concern | The homeowner-language pass mostly landed (`Your Plan`, named link actions, simpler no-access copy), but two add-to-plan dialogs still say `official plan record` in the explanatory sentence. | Clean up the remaining `official plan record` copy in incorporate dialogs, then this can move to pass. | CurrentPlanSection.tsx, ChangesSection.tsx, ChangeDetailContent.tsx, ToolContent.tsx, AttachMenu.tsx |
| TP-025 | Simplify structure first, then restyle | P0 | done | pass | pass | The diff reflects genuine IA simplification first: sections were removed/merged before the visual polish pass. | None. | — |

---

## Acceptance Criteria

### TP-001: Default `/project-summary` to list view
- Collection picker defaults to list view, not tile/card view
- List rows show: plan name, status, open items count, pending changes count, last updated
- Keep alternate view toggle if useful, but list is default
- **Files**: `CollectionPickerWrapper.tsx` or `CollectionsPickerView` component

### TP-002: Restructure detail page around "Current Plan + Changes"
- Detail page clearly centers on: (1) the current plan, (2) changes against that plan
- Remove or consolidate overlapping concepts (Queue, Log, Timeline, Activity)
- Users do not need to interpret Queue vs Log vs Timeline vs Activity
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`, `ChangesSection.tsx`

### TP-003: Add top state summary row
- Compact summary row near top showing: status (Draft/Approved/Unlocked), open items count, pending changes count, last approved date
- At a glance, user can tell plan status and whether attention is needed
- **Files**: `ToolContent.tsx` or `CurrentPlanSection.tsx`

### TP-004: Remove Activity drawer from this feature
- No separate Activity drawer/sidebar on Track Plans
- No spammy "status changed / shared / comment / reopened" feed UX
- Comments sidebar can stay (it's a different concept)
- **Files**: `ToolContent.tsx`

### TP-005: Remove duplicate history concepts
- No separate "Timeline & History" AND "Activity" as competing concepts
- One compact history/changelog section only
- **Files**: `ToolContent.tsx`, `MilestoneTimeline.tsx`

### TP-006: Merge Change Queue into Changes
- Remove separate `ChangeQueueSummary` banner
- One unified "Changes" section exists
- Pending changes are a filtered/grouped state within Changes (already tabbed)
- **Files**: `ToolContent.tsx` (remove ChangeQueueSummary), `ChangesSection.tsx`

### TP-007: Replace hidden link affordances with explicit actions
- Plan section: visible "Add File", "Link Fix List", "Link Selections" actions
- Change rows: visible "Add File", "Link Fix List", "Link Selections" actions
- No critical linking action depends on an obscure icon
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `AttachMenu.tsx`

### TP-008: Remove "Link URL" from primary flow
- "Link URL" is not a visible primary action in Track Plans
- File attachments, Fix List links, and Selections links are primary
- URL support can be retained as secondary/overflow path
- **Files**: `AttachMenu.tsx`, `DocumentsSection.tsx`

### TP-009: Make Plan-linked Fix List and Selections explicit
- **Scope clarification**: Plan data model has no `links` field by design — Selections and Fix Items link through individual changes, not the plan itself
- Plan card shows a visible hint directing users to link items when adding changes
- AttachMenu uses named "Link Selection" / "Link Fix Item" actions (not generic "Link")
- Users can easily tell changes support connecting to Selections and Fix Items
- **Files**: `CurrentPlanSection.tsx`, `AttachMenu.tsx`

### TP-010: Make Change-linked Fix List and Selections explicit
- Changes clearly support linked Fix List items and Selections
- Actions and resulting linked content are visible and understandable
- **Files**: `ChangesSection.tsx`, `LinkPills.tsx`

### TP-011: Fix Approve action styling
- "Approve Plan" / "Approve Change" uses neutral action styling (not green)
- Green reserved for confirmed approved states/badges only
- Users do not confuse action button with already-approved state
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`

### TP-012: Improve contrast and readability
- Body text contrast increased (cream/60 → higher)
- Label/helper contrast increased (cream/30 → higher)
- Hazy/muddy overlay effects reduced
- Card boundaries and visual hierarchy strengthened
- Dark mode still feels premium but usable
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `ToolContent.tsx`, `DocumentsSection.tsx`, `OpenItemsList.tsx`

### TP-013: Fix raw status syntax leaking into UI
- No raw internal status syntax (e.g., `was: pending_contractor`) appears in UI
- Open items and linked records read naturally with human-readable labels
- **Files**: `OpenItemsList.tsx`, `ChangesSection.tsx`, any status display code

### TP-014: Rename "Unresolved Items" to natural language
- Section renamed to "Still to Decide" or "Open Items" (pick one, use consistently)
- Same concept named consistently everywhere in the feature
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `ChangeDetailContent.tsx`, `ToolContent.tsx`

### TP-015: Separate core plan content from secondary/meta content
- First screenful emphasizes the record (scope, files, items, budget, changes)
- Utility controls (share, comments count, admin chrome) recede visually
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`

### TP-016: Improve budget presentation
- Budget shows: Baseline, Approved Changes, Current Total, Pending Impact (when relevant)
- Pending and approved amounts not mixed confusingly
- **Files**: `CurrentPlanSection.tsx`

### TP-017: Improve empty states and draft guidance
- Empty states teach the workflow (describe scope → add files → link items → approve)
- First-time user can understand how to complete a plan
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `ToolContent.tsx`

### TP-018: Make Plan → Change workflow explicit in copy and layout
- UI communicates: draft plan → approve → changes tracked against baseline
- Users naturally understand adding changes instead of editing history
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `ToolContent.tsx`

### TP-019: Improve list view columns and scanability
- List rows foreground: name, status, open items, pending changes, last updated
- De-emphasize verbose activity text
- Rows easy to compare quickly
- **Files**: `CollectionPickerWrapper.tsx` or parent list component

### TP-020: Handle duplicate/ambiguous plan names
- Enough context to distinguish similarly named plans (subtitle, date, metadata)
- Users can distinguish plans without guesswork
- **Files**: `CollectionPickerWrapper.tsx` or parent list component

### TP-021: Reduce number of main sections on detail page
- Target: Header/summary → Current Plan → Files + Links → Open Items + Budget → Changes + History
- Fewer major sections than current UI
- Page feels calmer and easier to parse
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`

### TP-022: Make history/changelog chronological and trustworthy
- History shows only major milestones: plan created, approved, unlocked, change created/approved/declined
- History reads like a real record, not a noisy feed
- **Files**: `MilestoneTimeline.tsx`

### TP-023: Make primary CTA state-dependent
- Draft → "Approve Plan"; Approved → "Add Change"; Unlocked → "Re-approve Plan"
- Primary action always matches user's likely next task
- **Files**: `CurrentPlanSection.tsx` or `ToolContent.tsx`

### TP-024: Make feature feel less like PM software
- Copy, structure, and UI feel calmer and homeowner-friendly
- Feature emphasizes clarity over system complexity
- No jargon, no developer-mode CRUD feel
- **Files**: All UI files in the feature

### TP-025: Simplify structure first, then restyle
- Implementation order: (1) simplify IA, (2) remove duplicates, (3) clarify actions/language, (4) polish visuals
- Sprint reflects structural simplification, not cosmetic-only changes
- This is a process constraint, not a code change

---

## Implementation Order

Given TP-025's constraint (simplify structure first), the recommended order is:

### Phase 1: Structural Simplification (P0 issues + structural P1s)
1. TP-025 (process — governs all work)
2. TP-002 (restructure around Plan + Changes)
3. TP-021 (reduce sections)
4. TP-004 (remove Activity drawer)
5. TP-005 (remove duplicate history)
6. TP-006 (merge Change Queue into Changes)

### Phase 2: Actions and Language (P1 issues)
7. TP-007 (explicit link actions)
8. TP-008 (remove Link URL from primary flow)
9. TP-009 (explicit Plan links)
10. TP-010 (explicit Change links)
11. TP-011 (fix Approve styling)
12. TP-013 (fix raw status syntax)
13. TP-014 (rename Unresolved Items)
14. TP-023 (state-dependent CTA)

### Phase 3: Layout and Presentation (P1-P2 issues)
15. TP-003 (top summary row)
16. TP-015 (separate core from meta)
17. TP-016 (improve budget)
18. TP-018 (Plan → Change workflow in copy)
19. TP-017 (empty states and guidance)

### Phase 4: List View and Polish (P1-P3 issues)
20. TP-001 (default to list view)
21. TP-019 (list columns)
22. TP-020 (duplicate plan names)
23. TP-012 (contrast and readability)
24. TP-022 (history/changelog)
25. TP-024 (less PM software feel — final pass)

---

## Files Changed

| File | Change |
|------|--------|
| — | — |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (only pre-existing e2e error)
- [ ] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Mental model test: first-time user can explain "approved plan + later changes"
- [ ] Discoverability: can easily find Add File, Link Fix List, Link Selections
- [ ] Readability: all key content readable without strain
- [ ] Action clarity: primary CTA obvious and state-dependent
- [ ] History: concise, meaningful, no spam
- [ ] Language: all labels plain English, no raw syntax
- [ ] List view: clearly the right default, rows easy to compare

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-13-track-plans-mental-model-simplification-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-13-track-plans-followup-response.md` |

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
