# Sprint: Core Tool Hierarchy and Visibility Cleanup

**Date**: 2026-03-16
**Objective**: Demote Mood Boards and Bid Checklist in navigation/grids so Fix List, Selections, and Plan & Changes feel like the core product.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| P2-001 | Adjust tool registry/consumers so core tools are favored | P1 | done | pass | pass | Fixed: added project_summary stats, helper copy, isEmpty, and lastActivity handling across tool-stats, API route, ToolGrid, and DashboardView. | none | `src/lib/tool-registry.ts`, `src/components/app/ToolGrid.tsx`, `src/components/app/DashboardView.tsx`, `src/components/dashboard/DashboardToolGrid.tsx`, `src/lib/tool-stats.ts`, `src/app/api/tool-summaries/route.ts` |
| P2-002 | Simplify app sidebar hierarchy | P1 | done | pass | pass | The sidebar now gives core tools their own stronger section and pushes Mood Boards/Bid Checklist into a lower-emphasis `Planning & Prep` area. | none | `src/components/app/SidebarNav.tsx` |
| P2-003 | Align public nav and tools discovery with hierarchy | P1 | done | pass | pass | Public navigation and tools discovery now show a clearer core-first structure with secondary tools separated below. | none | `src/components/layout/Navigation.tsx` |
| P2-004 | Update stage/order helpers that over-promote secondary tools | P1 | done | pass | pass | Stage priority ordering now consistently favors the core tools before Mood Boards/Bid Checklist. | none | `src/lib/stage-tool-priority.ts` |

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

### P2-001: Adjust tool registry/consumers so core tools are favored
- Fix List, Selections, Plan & Changes appear as primary tools in grids
- Mood Boards and Bid Checklist are accessible but secondary
- No tool routes broken, no registry regressions
- **Files**: `src/lib/tool-registry.ts`, `src/components/app/ToolGrid.tsx`, `src/components/app/DashboardView.tsx`, `src/components/dashboard/DashboardToolGrid.tsx`

### P2-002: Simplify app sidebar hierarchy
- Sidebar reflects clearer primary vs secondary structure
- Core tools immediately findable
- Mood Boards and Bid Checklist still reachable in lower-emphasis area
- Sidebar feels less crowded and less equal-weight
- **Files**: `src/components/app/SidebarNav.tsx`

### P2-003: Align public nav and tools discovery with hierarchy
- Public IA mirrors app IA
- One coherent product hierarchy
- No page feels like an unordered tool directory
- **Files**: `src/components/layout/Navigation.tsx`, `src/app/tools/page.tsx`, `src/app/tools/ToolPreviewCards.tsx`

### P2-004: Update stage/order helpers that over-promote secondary tools
- Stage-based content doesn't accidentally elevate secondary tools above core
- Tool ordering feels intentional and consistent
- **Files**: `src/lib/stage-tool-priority.ts`, `src/data/renovation-stages.ts`

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/tool-registry.ts` | Added `core` flag, reordered: core tools first, exported `CORE_TOOL_REGISTRY` + `SECONDARY_TOOL_REGISTRY` |
| `src/components/app/ToolGrid.tsx` | Split into core + "Planning & Prep" secondary section |
| `src/components/app/DashboardView.tsx` | Split into core + "Planning & Prep" secondary section |
| `src/components/dashboard/DashboardToolGrid.tsx` | Renamed "Getting Started" → "Planning & Prep" |
| `src/components/app/SidebarNav.tsx` | Renamed "Getting Started" → "Planning & Prep", reduced secondary tool visual weight |
| `src/components/layout/Navigation.tsx` | Desktop + mobile tool dropdowns show core first, separator, then secondary (dimmer) |
| `src/lib/stage-tool-priority.ts` | Reordered so core tools come before secondary in each stage |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e test error only)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Public nav verified (desktop + mobile)
- [ ] Authenticated sidebar verified
- [ ] Dashboard/tool grids verified
- [ ] Tools page verified
- [ ] No broken deep links
- [ ] No broken active-state highlighting
- [ ] No label mismatch after regrouping

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-16-core-tool-hierarchy-cleanup-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-16-core-tool-hierarchy-cleanup-response.md` |

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
- [x] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
