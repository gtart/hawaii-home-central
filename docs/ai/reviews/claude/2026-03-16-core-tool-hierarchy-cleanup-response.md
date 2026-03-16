# Claude Response: Core Tool Hierarchy and Visibility Cleanup

**Date:** 2026-03-16
**In response to:** `docs/ai/reviews/codex/2026-03-16-core-tool-hierarchy-cleanup-audit.md`
**Sprint doc:** `docs/ai/sprints/core-tool-hierarchy-cleanup.md`

## Actions Taken

### Issue 1: Plan & Changes renders as empty in generic core-tool grids
**Codex verdict:** High / High confidence
**Action:** Fixed.

Added `project_summary` handling across all relevant surfaces:

1. **`src/app/api/tool-summaries/route.ts`**: Added `project_summary` stats computation — returns `totalChanges`, `activeChanges`, `documents`, `scopeItems`.

2. **`src/lib/tool-stats.ts`**: Added `project_summary` to both `getDashboardStats()` (shows active changes or total changes logged) and `isToolEmpty()` (checks for changes or scope items).

3. **`src/components/app/ToolGrid.tsx`**: Added helper copy for `project_summary`.

4. **`src/components/app/DashboardView.tsx`**: Added helper copy, `getProjectSummaryStats()`, and `project_summary` cases in `isToolEmpty()` and `getLastActivity()`.

## Ledger Updates

- P2-001: Codex Verified → `pass`, Follow-up → `none`
- All 4 issues now at `done` / `Claude Verified: pass` / `Codex Verified: pass`

## Build Verification

- `npx tsc --noEmit` passes (pre-existing e2e error only)
- `npm run build` passes
