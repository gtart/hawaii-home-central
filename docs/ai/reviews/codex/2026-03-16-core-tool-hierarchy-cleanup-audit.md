# Audit: Core Tool Hierarchy and Visibility Cleanup

**Date:** 2026-03-16
**Reviewer:** Codex
**Scope:** Latest committed sprint work at `5aac4b7` in the tool registry, app tool grids, sidebar, public navigation, and stage-priority helpers, reviewed against `docs/ai/sprints/core-tool-hierarchy-cleanup.md`.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint pointer and handoff
- `docs/ai/sprints/core-tool-hierarchy-cleanup.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/lib/tool-registry.ts`
- `src/components/app/ToolGrid.tsx`
- `src/components/app/DashboardView.tsx`
- `src/components/dashboard/DashboardToolGrid.tsx`
- `src/components/app/SidebarNav.tsx`
- `src/components/layout/Navigation.tsx`
- `src/lib/stage-tool-priority.ts`
- `src/data/renovation-stages.ts`
- `src/lib/tool-stats.ts`

## Overall Verdict

The hierarchy direction is right, but one core-tool regression keeps this sprint from passing. `Plan & Changes` was promoted into the core set without updating the generic grid logic that decides whether a tool has activity.

## What The Feature Appears To Be For

This sprint appears to make the product feel more focused by clearly separating the three core homeowner build tools from the earlier-stage planning tools.

## User Journey Assessment

- The new grouping is easier to understand: Fix List, Selections, and Plan & Changes are now the obvious main tools.
- The sidebar and public nav feel less like equal-weight lists of everything.
- The weak point is that one of the promoted core tools can still look empty even when the user already has data in it.

## Mobile UX Assessment

- The simplified grouping should help mobile scanability, especially in nav surfaces.
- A false `Not started` state for a core tool is worse on mobile because the user has less surrounding context to realize the CTA is misleading.

## Desktop UX Assessment

- Desktop hierarchy is cleaner across sidebar, grids, and dropdown menus.
- The generic app grids still under-explain and mis-state `Plan & Changes`, which undermines the intended core-tool emphasis.

## Copy / Labeling Assessment

- `Planning & Prep` is a good secondary label.
- Core/secondary labeling is directionally clearer everywhere else.
- The main copy problem is not wording but inaccurate status treatment for `Plan & Changes` in the generic grids.

## Trust / Record-Keeping Assessment

- Promoting the right core tools improves confidence because the product looks more intentional.
- Showing `Plan & Changes` as `Not started` when it may already contain scope/change records damages trust immediately.

## Top Issues

1. **`Plan & Changes` can still render as empty in the generic core-tool grids**
   Severity: High
   Confidence: High
   Why it matters: `project_summary` was moved into the core registry, but the generic grid helpers still do not handle it. In [ToolGrid.tsx](/home/greggtarter/HIhomecentral/src/components/app/ToolGrid.tsx#L18), there is no helper copy for `project_summary`, and the shared stats helpers in [tool-stats.ts](/home/greggtarter/HIhomecentral/src/lib/tool-stats.ts#L5) return `[]` / `true` for unknown tools. In [DashboardView.tsx](/home/greggtarter/HIhomecentral/src/components/app/DashboardView.tsx#L15), the local `isToolEmpty()` and `getLastActivity()` switches also omit `project_summary`, so the row falls back to `Not started` and a `Start` CTA even if project-summary collections already exist.
   Recommendation: Add explicit `project_summary` handling to the grid stats/empty/activity helpers and give the row its own helper copy so the promoted core tool is not visually and behaviorally treated like a blank secondary tool.

## Recommended Next Actions

- Fix the `project_summary` handling in both generic grid implementations before closing the sprint.
- Keep the core/secondary grouping changes elsewhere; the hierarchy direction itself is correct.

## Final Verdict

Not yet. The product hierarchy is cleaner, but the promoted `Plan & Changes` tool still has a misleading empty-state regression in the generic app grids.
