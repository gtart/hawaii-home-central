# Sprint: Selections Simplification into Selection Boards

**Date**: 2026-03-16
**Objective**: Simplify Selections UX toward a board-based mental model — faster creation, clearer hierarchy, tag-driven organization, and obvious "pick one" behavior.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| P4-001 | Reframe Selections list around Selection Boards | P1 | done | pass | pass | Fixed: removed separate chevron column, Updated column now wraps the link. Desktop table is now 4 columns (thumb, Selection, Status, Updated). | none | `DecisionTrackerPage.tsx` |
| P4-002 | Simplify quick-add/new-selection flow | P1 | done | pass | pass | The quick-add flow is more focused, with the primary CTA first and the contextual inline prompt in a clearer container. | none | `DecisionTrackerPage.tsx` |
| P4-003 | Make add option/idea dominant next step | P1 | done | pass | pass | The onboarding flow now clearly teaches the board model and points the user toward adding options/ideas next. | none | `OnboardingView.tsx`, `DecisionTrackerPage.tsx` |
| P4-004 | Tags as main lightweight org structure | P1 | done | pass | pass | Tags are now inline in the main Selection column, location is folded in there too, and filtering remains accessible. | none | `DecisionTrackerPage.tsx` |
| P4-005 | Reduce visible complexity in workspace | P1 | done | pass | pass | The toolbar and filter surface are materially simpler, with sort/filter consolidation and hidden bulk controls until selection starts. | none | `DecisionTrackerPage.tsx` |
| P4-006 | Make pick-one / final selection clearer | P1 | done | pass | pass | The selected option treatment is visibly stronger in both desktop rows and mobile cards. | none | `DecisionTrackerPage.tsx` |
| P4-007 | Improve empty states and first-use onboarding | P2 | done | pass | pass | Fixed: read-only empty state now says "No selection boards have been created yet." | none | `OnboardingView.tsx`, `ToolContent.tsx`, `DecisionTrackerPage.tsx` |

---

## Acceptance Criteria

### P4-001: Reframe Selections list around Selection Boards
- Main page feels like a list/grid of boards, not a management console
- "New Selection" CTA is the primary action, positioned first in toolbar
- Each item reads as one real decision with thumbnail, title, status, picked option
- Desktop table simplified to 4 columns: thumbnail, Selection (with inline tags/location/picked), Status, Updated
- Mobile uses clean card layout with emoji fallbacks
- **Files**: `DecisionTrackerPage.tsx`

### P4-002: Simplify quick-add/new-selection flow
- "New Selection" button is primary CTA in toolbar (sandstone, first position)
- Inline add panel has contextual placeholder: "What do you need to choose?"
- Quick add wraps in a subtle card container for visual focus
- **Files**: `DecisionTrackerPage.tsx`

### P4-003: Make add option/idea dominant next step
- OnboardingView rewritten with board mental model
- "Start a selection board" headline
- "Each board is one decision" explanation
- After adding, user sees empty board with clear "add options" prompts (existing IdeasBoard empty state)
- **Files**: `OnboardingView.tsx`

### P4-004: Tags as main lightweight org structure
- Tags shown inline in Selection column (up to 3 with +N overflow)
- Location shown inline alongside tags (not a separate column)
- Tag filtering available in Sort & Filter dropdown menu
- Bulk tag operations still accessible when items selected
- **Files**: `DecisionTrackerPage.tsx`

### P4-005: Reduce visible complexity in workspace
- Filters, sort, and group-by consolidated into single "Sort & Filter" dropdown
- Bulk checkboxes hidden until first item selected (right-click or select mode)
- Summary strip only shown for 4+ selections
- Desktop filter rows replaced with inline active filter pills (dismissible)
- Priority and Specs columns removed from default table (accessible in detail view)
- **Files**: `DecisionTrackerPage.tsx`

### P4-006: Make pick-one / final selection clearer
- Selected option shown in emerald green with ✓ prefix: "✓ Option Name · $price"
- Visible in both desktop table rows and mobile cards
- More prominent than previous `text-sandstone/70` treatment
- **Files**: `DecisionTrackerPage.tsx`

### P4-007: Improve empty states and first-use onboarding
- OnboardingView: "Start a selection board" heading (board model)
- "Each board is one decision" explanation copy
- "You can add more boards anytime" helper text
- "Browse Selection Packs" renamed from "Add a Selection Pack"
- ToolContent description updated to board language
- **Files**: `OnboardingView.tsx`, `ToolContent.tsx`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx` | Consolidated toolbar (New Selection primary CTA, unified Sort & Filter menu), simplified desktop table (4 cols), removed separate filter rows, added inline active filter pills, emerald picked-option display, emoji fallbacks, bulk checkboxes hidden by default, compact summary strip |
| `src/app/app/tools/finish-decisions/components/OnboardingView.tsx` | Rewritten with board mental model — "Start a selection board" headline, "Each board is one decision" copy, "Browse Selection Packs" CTA |
| `src/app/app/tools/finish-decisions/ToolContent.tsx` | Updated description to board language |
| `docs/ai/active-sprint.md` | Points to this sprint |
| `docs/ai/sprints/feed-first-app-home.md` | Closed (status: complete) |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e error only)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop Selections home/list
- [ ] Mobile Selections home/list
- [ ] Create new selection flow
- [ ] Empty selection board
- [ ] Board with options
- [ ] Tags behavior
- [ ] Selecting a final option
- [ ] Existing selections still load correctly

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-16-selections-simplification-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-16-selections-simplification-response.md` |

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
- [x] Build/typecheck recorded
- [x] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
