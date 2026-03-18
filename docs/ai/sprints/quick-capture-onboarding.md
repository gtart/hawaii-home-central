# Sprint: Quick Capture & Onboarding — Fix List + Selections

**Date**: 2026-03-17
**Objective**: Remove friction from first-time use and daily capture across Fix List and Selections. Auto-create defaults so users skip empty states, add dashboard quick-add for both tools, and formalize the Uncategorized board for Selections.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| QC-001 | Fix List: auto-create "Fix List #1" | P1 | todo | pending | pending | — | — | — |
| QC-002 | Dashboard: quick-add fix item (pick/create list) | P1 | todo | pending | pending | — | — | — |
| QC-003 | Dashboard: quick-add Selection Board or Idea to Board | P1 | todo | pending | pending | — | — | — |
| QC-004 | Selections: Uncategorized board (auto-create, restrict final, move/copy) | P1 | todo | pending | pending | — | — | — |
| QC-005 | Selections table: inline quick-add idea per row | P1 | done | pass | pending | — | — | `DecisionTrackerPage.tsx`, `ToolContent.tsx` |

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

### QC-001: Fix List — auto-create "Fix List #1"
- When user navigates to `/app/tools/punchlist` with zero existing collections for their project, a collection titled "Fix List #1" is auto-created via `POST /api/collections` and user is redirected into it
- User lands directly in the Fix List with QuickAddStrip visible — no collection picker empty state
- If collections already exist, behavior is unchanged (show picker)
- Works for both desktop and mobile
- **Files**: `src/app/app/tools/punchlist/CollectionPickerWrapper.tsx`, `src/components/app/CollectionsPickerView.tsx`

### QC-002: Dashboard — quick-add fix item (pick/create list)
- On `/app` dashboard, Fix List card shows an "Add fix" action that opens an inline form or bottom sheet
- Form has: title input (required), optional list picker dropdown showing existing Fix Lists
- If user has only one Fix List, auto-select it (no picker needed)
- If user has zero Fix Lists, auto-create "Fix List #1" and add item to it
- Option to create a new list from the picker (e.g., "+ New list" row)
- After adding, show brief confirmation and the item appears in the list
- **Files**: `src/components/dashboard/DashboardCardFixList.tsx`, `src/components/dashboard/DashboardPage.tsx`

### QC-003: Dashboard — quick-add Selection Board or Idea to Board
- On `/app` dashboard, Selections card shows two actions:
  - "Add Board" — creates a new SelectionV4 with user-provided title
  - "Add Idea" — lets user type an idea name, then pick which board (or create new)
- Board picker shows existing selections + "+ New board" option
- If user has zero boards, "Add Idea" auto-creates "Uncategorized" board and adds idea there
- After adding, brief confirmation shown
- **Files**: `src/components/dashboard/DashboardCardSelections.tsx` (or equivalent), `src/components/dashboard/DashboardPage.tsx`

### QC-004: Selections — Uncategorized board
- An "Uncategorized" selection board exists as a permanent catch-all (`systemKey: 'uncategorized'`)
- Auto-created when user first adds an idea without picking a board (from dashboard or quick-add)
- Cannot be deleted (existing behavior — delete button hidden for systemKey selections)
- Cannot mark a final selection / "Select as final" on ideas within Uncategorized — button hidden or disabled with tooltip "Move to a board first"
- Each idea card in Uncategorized shows a prominent "Move" action to relocate to a proper selection board (reuse existing `MoveIdeaSheet`)
- Uncategorized board is pinned to top of board list (existing behavior)
- Visual treatment: amber "Uncategorized" badge instead of status badge (similar to existing "Unsorted" / "Needs sorting" pattern)
- **Files**: `src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx`, `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailContent.tsx`, `src/app/app/tools/finish-decisions/components/IdeasBoard.tsx`, `src/data/finish-decisions.ts`

### QC-005: Selections table — inline quick-add idea per row
- **Already implemented** in this session
- Desktop: "+" button appears on row hover, expands to inline text input, Enter adds idea
- Mobile: "Add idea" link below each card, expands to inline form
- **Files**: `src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx`, `src/app/app/tools/finish-decisions/ToolContent.tsx`

---

## Existing Code to Reuse

| Pattern | Location | Reuse For |
|---------|----------|-----------|
| Collection auto-create API | `POST /api/collections` (`src/app/api/collections/route.ts`) | QC-001, QC-002 |
| `CollectionsPickerView` empty-state creation | `src/components/app/CollectionsPickerView.tsx:258-272` | QC-001 |
| `QuickAddStrip` for fix items | `src/app/app/tools/punchlist/components/QuickAddStrip.tsx` | QC-002 pattern reference |
| `usePunchlistState.addItem()` | `src/app/app/tools/punchlist/usePunchlistState.ts:140-185` | QC-002 |
| `QuickAddDecisionModal` | `src/app/app/tools/finish-decisions/components/QuickAddDecisionModal.tsx` | QC-003 |
| `MoveIdeaSheet` (move/copy between selections) | `src/app/app/tools/finish-decisions/components/MoveIdeaSheet.tsx` | QC-004 |
| `systemKey: 'uncategorized'` type + V4 treatment | `src/data/finish-decisions.ts:274`, `DecisionTrackerPage.tsx` | QC-004 |
| Dashboard cards | `src/components/dashboard/DashboardCardFixList.tsx`, `DashboardCardSelections.tsx` | QC-002, QC-003 |
| `handleAddIdea` in ToolContent | `src/app/app/tools/finish-decisions/ToolContent.tsx:294-318` | QC-005 (done) |

---

## Files Changed

| File | Change |
|------|--------|
| — | (will be populated during implementation) |

---

## Build Verification

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] QC-001: Navigate to `/app/tools/punchlist` with zero lists → "Fix List #1" auto-created, lands in list
- [ ] QC-001: Navigate with existing lists → picker shown normally
- [ ] QC-002: Dashboard "Add fix" → pick list → item appears
- [ ] QC-002: Dashboard "Add fix" with zero lists → auto-creates list + adds item
- [ ] QC-003: Dashboard "Add Board" → creates selection board
- [ ] QC-003: Dashboard "Add Idea" → pick board → idea added
- [ ] QC-004: Uncategorized board pinned to top, can't delete, can't mark final
- [ ] QC-004: Move idea from Uncategorized to proper board works
- [ ] QC-005: Quick-add idea from table row (desktop hover, mobile link)

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
