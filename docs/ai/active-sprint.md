# Active Sprint

## Current: Plan & Changes Migration (March 2026)

### Objective
Migrate "Project Summary" tool to "Plan & Changes" — a full data model evolution (v1→v2), new UI sections, 6-status change workflow, plan lifecycle with milestones, and user-facing rename. Internal toolKey, routes, and file names unchanged.

### Status
- [x] Repo starter pack created (CLAUDE.md, agents, docs/ai/)
- [x] Migration map written (docs/ai/migrations/project-summary-to-plan-and-changes.md)
- [x] Phase 1: Data model + v1→v2 migration (ensureShape, constants)
- [x] Phase 2: State hook + Current Plan UI (CurrentPlanSection, PlanItemList)
- [x] Phase 3: Changes v2 UI (6-status dropdown, contractor response, incorporate action)
- [x] Phase 4: MilestoneTimeline + string renames + final verification
- [x] TypeScript type check passes (`npx tsc --noEmit`)
- [x] Production build succeeds (`npm run build`)
- [x] All user-facing "Project Summary" strings renamed to "Plan & Changes"
- [x] Post-implementation: migration-checker (7/7 PASS), mobile-ui (9/9 PASS), desktop-ui (8/8 PASS), QA regression (11/11 PASS)
- [x] AI review & logging system: review ledger + subagent hooks
- [x] Codex review workflow: `AGENTS.md` + review ledger + format templates
- [ ] Deploy to production

### What Changed
- **Data model**: v1 payloads silently migrate to v2 on load via `ensureShape()`
- **New UI sections**: CurrentPlanSection (scope + included/not-included/still-to-decide lists), MilestoneTimeline
- **Deleted sections**: SummarySection, OpenDecisionsSection (decisions → plan.still_to_decide)
- **Changes v2**: 6-status workflow, contractor_response field, "Incorporate into Plan" action with traceability
- **Plan lifecycle**: draft → shared → confirmed → acknowledged, with content-changed-since flags
- **Milestone logging**: plan status changes and change incorporations logged as milestones

### In Scope
- v1→v2 payload migration (silent, backward-compatible)
- 6-status change workflow (requested, awaiting_homeowner, approved_by_homeowner, accepted_by_contractor, done, closed)
- Plan status lifecycle with milestone logging
- Incorporation traceability (incorporated_at, incorporated_by)
- Content-changed-since-status and changed-since-accepted flags
- User-facing copy rename: "Project Summary" → "Plan & Changes"

### Out of Scope
- Route directory renaming (breaks bookmarks/shares)
- Internal type/variable renaming (churn with no user value)
- Guest Mode or other deferred features

### Must-Not-Break
- Existing project_summary collections load correctly (v1→v2 migration)
- Activity events with project_summary or project_alignment toolKey display correctly
- Share links continue to work
- Cross-tool links (ProjectSummaryLinkBadge, CreateProjectSummaryEntryButton) work
- Sidebar navigation works

### Previous Sprints (Completed)
- Plan & Changes Migration Prep (March 2026) — repo starter pack, agents, docs
- Project Summary V2: multi-collection, rich changes, file upload, 5-status decisions (March 2026)
- Selection-Options UI Improvements (March 10, 2026) — see `docs/mini-sprint-selection-options-ui-improvements-march-10.md`
