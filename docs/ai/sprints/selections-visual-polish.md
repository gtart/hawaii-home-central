# Sprint: Selections Visual Polish — Calmer, More Visual, More Deliberate

**Date**: 2026-03-16
**Objective**: Polish pass on Selections to unify terminology to "Final choice", refine selected card styling, soften management controls, make cards more image-led, and improve spacing/action hierarchy.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| VP-001 | Unify terminology to "Final choice" | P1 | done | pass | pending | — | — | `IdeaCardModal.tsx`, `CompareModal.tsx`, `OptionDetailContent.tsx`, `DecisionDetailContent.tsx`, `SelectionsBoardView.tsx` |
| VP-002 | Refine selected card styling | P1 | done | pass | pending | — | — | `IdeasBoard.tsx` |
| VP-003 | Soften top metadata controls | P1 | done | pass | pending | — | — | `DecisionDetailContent.tsx` |
| VP-004 | Improve option card hierarchy | P1 | done | pass | pending | — | — | `IdeasBoard.tsx` |
| VP-005 | Improve spacing rhythm and action hierarchy | P1 | done | pass | pending | — | — | `IdeasBoard.tsx`, `DecisionDetailContent.tsx` |
| VP-006 | Option detail polish | P2 | done | pass | pending | — | — | `OptionDetailContent.tsx` |
| VP-007 | Fix broken thumbnails on /app homepage | P1 | done | pass | pending | — | — | `DashboardCardFixList.tsx`, `DashboardCardSelections.tsx`, `DashboardCardPlanAndChanges.tsx` |
| VP-008 | Deep link from preview items to actual items | P1 | done | pass | pending | — | — | `DashboardCard*.tsx`, `src/server/dashboard/index.ts` |
| VP-009 | Add quick-capture CTAs (+Add Fix, +Add Selection, +Add Change) | P1 | done | pass | pending | — | — | `DashboardCard*.tsx`, `PunchlistPage.tsx`, `DecisionTrackerPage.tsx`, `ToolContent.tsx` |

---

## Acceptance Criteria

### VP-001: Unify terminology to "Final choice"
- All touched Selections surfaces use "Final choice" consistently
- No "Final Decision", "Mark as Final Decision", "No final selected" remaining
- Buttons: "✓ Final choice" (selected), "Pick as final" (unselected)
- Error: "No final choice"
- Helper: "Pick one as your final choice"
- Badge: "FINAL CHOICE" (uppercase in sidebar)
- **Files**: `IdeaCardModal.tsx`, `CompareModal.tsx`, `OptionDetailContent.tsx`, `DecisionDetailContent.tsx`, `SelectionsBoardView.tsx`

### VP-002: Refine selected card styling
- Selected card uses `border-2 border-sandstone/50 ring-2 ring-sandstone/15 shadow-lg shadow-sandstone/10`
- Background `bg-sandstone/8` for subtle warmth
- Transition-all for smoother visual change
- Non-selected cards use lighter border `border-cream/12`
- **Files**: `IdeasBoard.tsx`

### VP-003: Soften top metadata controls
- Desktop: status/priority selects reduced to `text-[10px]`, `py-0.5`, `opacity-80`
- Mobile: same treatment, `text-[11px]`, `py-1`, `opacity-80`
- Due date text reduced from `text-[11px]` to `text-[10px]`
- Controls feel like metadata, not primary UI
- **Files**: `DecisionDetailContent.tsx`

### VP-004: Improve option card hierarchy
- Title moved above voting/overflow (was below)
- Overflow menu sits inline with title (top-right)
- Price directly below title
- Meta row simplified: comments, files, time — no origin label
- Voting row moved below core info
- **Files**: `IdeasBoard.tsx`

### VP-005: Improve spacing rhythm and action hierarchy
- Card padding increased from `p-2.5` to `p-3`
- Voting row separated with `pt-0.5`
- Desktop header controls use `mt-1` (was `mt-1.5`)
- Mobile controls use `mt-1.5` (was `mt-2`)
- **Files**: `IdeasBoard.tsx`, `DecisionDetailContent.tsx`

### VP-006: Option detail polish
- "Final Decision" badge → "Final choice" in sidebar badge
- "Final Decision" → "Final choice" in action buttons
- Comment text in action row updated
- **Files**: `OptionDetailContent.tsx`

### VP-007: Fix broken thumbnails on /app homepage
- Dashboard preview rows now use `displayUrl()` to proxy external images past hotlink protection
- `ImageWithFallback` renders graceful SVG fallbacks instead of broken img tags
- **Files**: `DashboardCardFixList.tsx`, `DashboardCardSelections.tsx`, `DashboardCardPlanAndChanges.tsx`

### VP-008: Deep link from preview items to actual items
- Fix List previews deep link to `?highlight={itemId}` (scrolls to item)
- Selections previews deep link to `/decision/{decisionId}` (individual decision page)
- Plan Changes previews deep link to `?focus=change-{changeId}` (scrolls to change)
- Preview rows are clickable `<Link>` elements with hover state, independent of card-level link
- **Files**: `DashboardCard*.tsx`, `src/server/dashboard/index.ts`

### VP-009: Add quick-capture CTAs
- Each card has a `+ Add fix` / `+ Add selection` / `+ Add change` link at the bottom
- Fix List: navigates to tool page with `?add=true`, auto-opens quick-add strip
- Selections: navigates with `?add=true`, auto-shows inline add input
- Plan Changes: navigates with `?add=change`, auto-scrolls to and opens add change form
- **Files**: `DashboardCard*.tsx`, `PunchlistPage.tsx`, `DecisionTrackerPage.tsx`, `ToolContent.tsx` (project-summary)

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/finish-decisions/components/IdeasBoard.tsx` | Selected card styling refined (stronger ring/shadow/bg). Card hierarchy: title first, overflow inline, voting below core info. Padding `p-3`. Meta row simplified. |
| `src/app/app/tools/finish-decisions/components/IdeaCardModal.tsx` | "Final Decision" → "Final choice", "Mark as Final Decision" → "Pick as final" |
| `src/app/app/tools/finish-decisions/components/CompareModal.tsx` | "Final Decision" → "Final choice", "Mark as Final" → "Pick as final" |
| `src/app/app/tools/finish-decisions/components/SelectionsBoardView.tsx` | "No final selected" → "No final choice" |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailContent.tsx` | "No final selected" → "No final choice", "mark as final" → "final choice". Desktop/mobile controls softened (smaller text, lower opacity). |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/option/[optionId]/OptionDetailContent.tsx` | "Final Decision" → "Final choice" across button, badge, and comments |
| `src/components/dashboard/DashboardCardFixList.tsx` | `displayUrl` + `ImageWithFallback` for thumbnails. Preview rows are deep-linked `<Link>`. Card restructured (div wrapper). "+Add fix" CTA. |
| `src/components/dashboard/DashboardCardSelections.tsx` | Same thumbnail fix. Deep-linked rows. "+Add selection" CTA. |
| `src/components/dashboard/DashboardCardPlanAndChanges.tsx` | Same thumbnail fix. Deep-linked rows. "+Add change" CTA. |
| `src/server/dashboard/index.ts` | Item-level deep links: Fix List `?highlight=`, Selections `/decision/{id}`, Changes `?focus=change-{id}` |
| `src/app/app/tools/punchlist/components/PunchlistPage.tsx` | `?add=true` auto-opens quick-add strip |
| `src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx` | `?add=true` auto-shows add input |
| `src/app/app/tools/project-summary/ToolContent.tsx` | `?add=change` auto-scrolls to and opens add change form |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e error only)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Selection detail pages load correctly
- [ ] Final-selected option still pins first
- [ ] Selected styling applies correctly
- [ ] Add-option still works
- [ ] Compare modal works
- [ ] Option detail pages work
- [ ] Terminology is unified

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
