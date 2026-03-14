# Phase D Review — Main IA and Screen Rebuild

**Sprint:** Plan & Changes Rebuild v1
**Phase:** D (PCV1-020 through PCV1-029)
**Date:** 2026-03-13
**Status:** Complete — all 10 issues pass

---

## Summary

Phase D restructured the main Plan & Changes page from a flat, edit-first board into a review-first official record layout. The page now clearly separates the authoritative plan record (primary zone) from the operational change log (secondary zone).

## Key Changes

### Page Structure (PCV1-020, PCV1-022, PCV1-026)
- **ToolContent.tsx**: Reordered sections to Official Plan → Documents → (separator) → Change Queue Summary → Changes → Timeline & History
- Visual separator (`border-t`) divides the page into two conceptual zones
- Documents now sit directly under the plan as part of the "plan record" rather than floating between plan and changes

### Visual Hierarchy (PCV1-021, PCV1-028)
- **CurrentPlanSection.tsx**: Approved plan gets larger heading (text-base), bigger lock icon (w-4), subtle emerald glow shadow, more desktop padding (md:p-6)
- Desktop layout uses `md:space-y-5` within zones for tighter grouping, `md:my-8` separator between zones
- The plan section clearly dominates the page when approved

### Changes Split (PCV1-023, PCV1-024)
- **ChangesSection.tsx**: Extracted `renderChangeRow()` function; changes now split into "Pending Changes" and "Change History" groups with labeled sub-headers
- **ToolContent.tsx**: `ChangeQueueSummary` component shows operational metrics (pending count, awaiting incorporation, unresolved items, cost impact)

### Timeline (PCV1-025)
- **MilestoneTimeline.tsx**: Renamed from "Milestones" to "Timeline & History"; now shows the 3 most recent events by default instead of being fully collapsed; "Show all N events" expand button

### Mobile (PCV1-029)
- **ChangesSection.tsx**: Secondary change row metadata (cost impact, attachment count, comment count, incorporated/modified badges) hidden on mobile via `hidden md:inline`
- "Details →" link always visible on mobile (not hover-gated)
- Mobile change rows show only: chevron, title, status badge, Details link

### Design Reference (PCV1-027)
- Reviewed the change detail page's record-focused discipline; main page structure now follows the same pattern with clear sections, labeled metadata, and status-first layout

## Files Modified

| File | Changes |
|------|---------|
| `src/app/app/tools/project-summary/ToolContent.tsx` | Zone structure, separator, ChangeQueueSummary, hasContent fix |
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Stronger approved visual hierarchy, desktop padding |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | renderChangeRow extraction, pending/history split, mobile density reduction |
| `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` | Rename, preview mode, always-visible recent events |

## Build Verification

- `npx tsc --noEmit` — pass (only pre-existing e2e error)
- `npm run build` — pass
