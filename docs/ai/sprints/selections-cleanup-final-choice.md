# Sprint: Selections Cleanup — Final Choice in Flow, Less Management UI

**Date**: 2026-03-16
**Objective**: Tighten the Selections detail page so it feels like a simple board of options — remove the dedicated final-decision panel, pin the chosen option first, strengthen its visual treatment, and reduce management UI before options.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| SC-001 | Remove dedicated Final Decision block | P1 | done | pass | pending | — | — | `DecisionDetailContent.tsx` |
| SC-002 | Pin final-selected option to first position | P1 | done | pass | pending | — | — | `IdeasBoard.tsx` |
| SC-003 | Strengthen selected card styling | P1 | done | pass | pending | — | — | `IdeasBoard.tsx` |
| SC-004 | Tighten detail-page top section | P1 | done | pass | pending | — | — | `DecisionDetailContent.tsx` |
| SC-005 | Preserve/improve add-option affordance | P1 | done | pass | pending | — | — | `DecisionDetailContent.tsx` |
| SC-006 | Improve option detail page if touched | P2 | done | pass | pending | — | — | Not touched — option detail page was not modified in this sprint. Current hierarchy is acceptable. |

---

## Acceptance Criteria

### SC-001: Remove dedicated Final Decision block
- Removed the standalone "Final Decision" panel (lines 890-946 of old code)
- Removed the "No final decision yet" empty dashed-border block
- Replaced with compact meta line containing status log + warnings + cross-tool badge
- Page is materially shorter
- **Files**: `DecisionDetailContent.tsx`

### SC-002: Pin final-selected option to first position
- Added derived `orderedOptions` array that pins `isSelected` option to position 0
- Applied to both desktop grid and mobile collapsed list
- Non-selected options retain their relative order
- **Files**: `IdeasBoard.tsx`

### SC-003: Strengthen selected card styling
- Card wrapper: `border-2 border-sandstone/40 ring-1 ring-sandstone/20 shadow-md` + subtle `bg-sandstone/5`
- Badge upgraded from tiny "⭐ Final" to larger "✓ Final choice" with `rounded-lg shadow-sm`
- Text-only cards get matching treatment
- Unselected cards show "☆ Pick this" on hover
- **Files**: `IdeasBoard.tsx`

### SC-004: Tighten detail-page top section
- Desktop status/priority/due controls reduced: smaller text (`text-[11px]`), smaller padding
- Due date shows inline text when set, compact date picker when not set
- Removed separate warning block and status-log block — combined into one compact meta line
- Removed ProjectSummaryLinkBadge from its own block — moved inline
- **Files**: `DecisionDetailContent.tsx`

### SC-005: Preserve/improve add-option affordance
- AddIdeaMenu remains in Options header row (unchanged)
- Added inline hint "Pick one to mark as final" when no option is selected (desktop)
- **Files**: `DecisionDetailContent.tsx`

### SC-006: Improve option detail page if touched
- Option detail page was not modified — current hierarchy is acceptable
- No changes needed for this sprint scope
- **Files**: —

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailContent.tsx` | Removed Final Decision panel + empty state block; consolidated meta into compact line; reduced status/priority/due control size; added inline "Pick one" hint |
| `src/app/app/tools/finish-decisions/components/IdeasBoard.tsx` | Added `orderedOptions` derived sort (selected first); strengthened card border/ring/shadow for selected; upgraded badge to "✓ Final choice"; text-only cards get matching treatment |
| `docs/ai/sprints/selections-cleanup-final-choice.md` | Sprint doc |
| `docs/ai/active-sprint.md` | Points to this sprint |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e error only)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Selection detail loads correctly
- [ ] Options render correctly
- [ ] Final-selected option appears first
- [ ] Changing selected option reorders correctly
- [ ] Selected styling is prominent
- [ ] No duplicate final-selection rendering
- [ ] Add-option still works
- [ ] Selections with no chosen option work correctly
- [ ] Comments/files/share still work

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
- [x] Build/typecheck recorded
- [ ] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
