# Sprint: Homepage Rebuild — Visual Tool Cards + Contextual Story Previews

**Date**: 2026-03-16
**Objective**: Rebuild /app homepage as a visual 3-tool hub with contextual story previews per tool, replacing the text-heavy feed-first layout.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| P1-001 | Rebuild homepage hierarchy around 3 core tool cards | P1 | done | pass | pass | Core tool cards are the first primary content after the compact project header. | None. | `DashboardPage.tsx` |
| P1-002 | Redesign tool cards with story previews | P1 | done | pass | pass | Cards are clickable, hoverable, and show compact preview rows with thumbnail support. | None. | `DashboardCardFixList.tsx`, `DashboardCardSelections.tsx`, `DashboardCardPlanAndChanges.tsx` |
| P1-003 | Implement per-tool recent-story aggregation | P1 | done | pass | pass | Fixed: Plan & Changes previews now sort and timestamp by `updated_at` with `created_at` fallback. | none | `src/server/dashboard/index.ts` |
| P1-004 | Demote mixed global activity feed | P1 | done | pass | pass | Feed is collapsed behind a `Recent activity` toggle and no longer dominates the page. | None. | `DashboardPage.tsx` |
| P1-005 | Simplify project summary / reduce text clutter | P1 | done | pass | pass | Header is reduced to project name plus a compact state sentence; legacy continuation modules are removed from the primary flow. | None. | `DashboardPage.tsx` |
| P1-006 | Improve empty/low-activity states | P1 | done | pass | pass | Each core card teaches the tool purpose and provides a clear CTA when empty. | None. | `DashboardCardFixList.tsx`, `DashboardCardSelections.tsx`, `DashboardCardPlanAndChanges.tsx` |
| P1-007 | Optional side/bottom sheet expansion | P2 | done | pass | pass | Non-implementation is documented, and the card-level navigation remains clear without added sheet complexity. | None. | Documented: not implemented — card-level CTAs are strong enough and previews are compact. Sheet expansion would add complexity without clear benefit at this stage. |

---

## Acceptance Criteria

### P1-001: Rebuild homepage hierarchy around 3 core tool cards
- 3 core tools are main visual focus, directly after project header
- Page no longer opens with mixed activity text
- DashboardNextActions and QuietBanner removed from primary flow
- **Files**: `DashboardPage.tsx`

### P1-002: Redesign tool cards with story previews
- Each card shows up to 3 recent story previews with thumbnails
- Counts are subordinate (shown in header right side)
- Cards are clickable links with hover affordance
- **Files**: `DashboardCardFixList.tsx`, `DashboardCardSelections.tsx`, `DashboardCardPlanAndChanges.tsx`

### P1-003: Implement per-tool recent-story aggregation
- Server returns `toolPreviews` with `fixList`, `selections`, `planChanges` arrays
- Each preview has id, title, event, timestamp, thumbnailUrl, href
- Object-centered: extracts from payload data, not raw activity events
- **Files**: `src/server/dashboard/index.ts`

### P1-004: Demote mixed global activity feed
- Feed collapsed by default behind "Recent activity" toggle
- No longer dominates the page
- Still accessible via expand toggle
- **Files**: `DashboardPage.tsx`

### P1-005: Simplify project summary / reduce text clutter
- Header is one line: project name + compact stat sentence
- Removed DashboardNextActions (continuation prompts absorbed into card previews)
- Removed QuietBanner (empty states handled per-card)
- **Files**: `DashboardPage.tsx`

### P1-006: Improve empty/low-activity states
- Each card has a teaching empty state explaining the tool's purpose
- Empty cards have clear CTA with arrow affordance
- Cards remain visually balanced
- **Files**: card components

### P1-007: Optional side/bottom sheet expansion
- Not implemented — documented rationale
- Card CTAs link directly to full tool pages
- Preview area is compact (max 3 items) and doesn't need expansion
- **Files**: —

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardPage.tsx` | Rebuilt: tool cards first, feed collapsed, simplified header, removed NextActions and QuietBanner from primary flow |
| `src/components/dashboard/DashboardCardFixList.tsx` | Redesigned with story previews, compact header stats, teaching empty state |
| `src/components/dashboard/DashboardCardSelections.tsx` | Redesigned with story previews, compact header stats, teaching empty state |
| `src/components/dashboard/DashboardCardPlanAndChanges.tsx` | Redesigned with story previews, compact header stats, teaching empty state |
| `src/server/dashboard/index.ts` | Added `ToolPreviewItem` type and `toolPreviews` extraction from payload data |
| `docs/ai/active-sprint.md` | Points to this sprint |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e error only)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop /app with active data
- [ ] Mobile /app with active data
- [ ] /app with low/no activity
- [ ] Tool CTAs route correctly
- [ ] Story previews render correctly
- [ ] Empty states render well

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-16-homepage-visual-tool-hub-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-16-homepage-visual-tool-hub-response.md` |

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
