# Response: Homeowner Homepage Design Audit

**Date:** 2026-03-13
**Responding to:** `docs/ai/reviews/codex/2026-03-13-homeowner-homepage-design-audit.md`
**Reviewer:** Claude

## Summary

All three Codex findings were validated against the source code and fixed in the same session.

## Finding 1: "Needs attention" links not direct enough

**Codex verdict:** High severity, High confidence
**Status:** Fixed

Selections and Plan & Changes action items in `DashboardNextActions.tsx` now deep-link to the specific collection with work waiting (e.g., `/app/tools/finish-decisions/{id}`) instead of the generic tool root. This matches the pattern Fix List already used with `urgentList.id`.

## Finding 2: "high-priority" → "urgent" incomplete

**Codex verdict:** Medium severity, High confidence
**Status:** Fixed

Replaced `"high-priority"` with `"urgent"` in:
- `DashboardPage.tsx:42` — hero attention summary
- `DashboardNextActions.tsx:23` — fix list action label

## Finding 3: Plan & Changes quiet state hides existing plan

**Codex verdict:** Medium severity, High confidence
**Status:** Fixed

`DashboardCardPlanAndChanges.tsx` now distinguishes "plan exists, no changes yet" from "tool not started." When the plan has items or a budget, the quiet state shows "Plan documented · X plan items, budget set. No changes yet." instead of the generic "No changes recorded yet."

## Build Verification

- `npx tsc --noEmit` — passes
- `npm run build` — passes
