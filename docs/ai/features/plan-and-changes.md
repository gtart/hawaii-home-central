# Feature: Plan & Changes

**Status:** Implemented, hardening phase
**Replaces:** Project Summary tool
**toolKey:** `project_summary` (unchanged)
**Route:** `/app/tools/project-summary` (unchanged)

## What Was Built

"Plan & Changes" restructured Project Summary into a v2 data model:

1. **Current Plan** (replaces "Summary" + "Open Decisions" sections)
   - Scope textarea, plan status lifecycle (draft → shared → confirmed → acknowledged)
   - Three structured lists: included, not included, still to decide
   - Budget subsection with auto-computed current total
   - Content-changed-since-status indicator

2. **Changes** (6-status workflow, replaces old 3-status model)
   - Statuses: requested → awaiting_homeowner → approved_by_homeowner → accepted_by_contractor → done | closed
   - Contractor response field, "Incorporate into Plan" action with traceability
   - Changed-since-accepted warning flag

3. **Milestone Timeline** (new)
   - Logs plan status changes and change incorporations
   - Actor + note fields on each milestone

## Data Model

- Payload version bumped to 2 (`ProjectSummaryPayloadV2`)
- `ensureShape()` silently migrates v1 → v2 on load (no DB migration needed)
- Status mapping: proposed→requested, approved→approved_by_homeowner, not_approved→closed
- OpenDecisions migrated to `plan.still_to_decide` PlanItems

## User-Facing Renames (Complete)

| Before | After |
|--------|-------|
| "Project Summary" (nav, sidebar, tool picker) | "Plan & Changes" |
| "Summary" section | "Current Plan" section |
| "Open Decisions" section | Migrated to "Still to Decide" list in Current Plan |
| "Changes" 3-status | "Changes" 6-status with incorporation |

## What Stays the Same

- `toolKey: 'project_summary'` in DB
- Route path `/app/tools/project-summary/`
- Internal type names, file names, API routes
- All existing v1 data loads without error (migrated in memory)
- Cross-tool links continue to work

## What's Being Validated

- v1→v2 migration correctness with real production data
- Mobile layout on all new sections (plan status dropdown, plan item lists, milestone timeline)
- Cross-tool links from Selections and Fix List still navigate correctly
- Activity feed events render with "Plan & Changes" label

## References

- Migration details: `docs/ai/migrations/project-summary-to-plan-and-changes.md`
- Current sprint: `docs/ai/active-sprint.md`
