# Active Sprint

## Current: Plan & Changes Rebuild v1 (March 13, 2026)

### Sprint Doc
`docs/ai/active-sprint-plan-changes-v1.md`

### Objective
Rebuild the Plan & Changes feature so it behaves like a trusted homeowner plan record with one official plan, formal changes, explicit open items, and a clear audit trail.

### Commits
- `e78b17e` — Plan & Changes Rebuild v1: all 58 issues (PCV1-001 through PCV1-058)
- *(pending)* — Codex audit response: fixes for issues #1–#4

### Files Changed (Sprint)
- `src/data/project-summary.ts`
- `src/app/app/tools/project-summary/constants.ts`
- `src/app/app/tools/project-summary/ToolContent.tsx`
- `src/app/app/tools/project-summary/useProjectSummaryState.ts`
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx`
- `src/app/app/tools/project-summary/components/ChangesSection.tsx`
- `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx`
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`
- `src/app/api/collections/previews/route.ts`
- `src/components/app/CollectionsPickerView.tsx`

### Status
- [x] All 58 issues implemented (PCV1-001 through PCV1-058)
- [x] Self-verified by Claude (see ledger and phase reviews)
- [x] TypeScript passes (`npx tsc --noEmit` — only pre-existing e2e error)
- [x] Production build passes (`npm run build`)
- [x] Codex audit complete — 4 issues found
- [x] Claude response: all 4 Codex issues fixed
- [ ] Deploy to production

### Codex Audit
- **Audit file:** `docs/ai/reviews/codex/2026-03-13-plan-changes-v1-audit.md`
- **Response file:** `docs/ai/reviews/claude/plan-changes-v1-codex-response.md`

---

## Previous Sprints (Completed)
- Homeowner Homepage Design Sprint (March 13, 2026) — `6076c0a`
- Plan & Changes Migration (March 2026)
- Selection-Options UI Improvements (March 10, 2026)
- Project Summary V2 (March 2026)
