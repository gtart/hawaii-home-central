# Active Sprint

## Current: Homeowner Homepage Design Sprint (March 13, 2026)

### Sprint Doc
`docs/ai/sprints/homeowner-homepage-design-sprint.md`

### Objective
Refactor the authenticated homeowner homepage (`/app`) from a tool-first dashboard into a homeowner-first command center. The homepage should immediately tell a homeowner what needs attention, not just list tool modules.

### Commit
`6076c0a` — "Refactor homepage from tool dashboard to homeowner command center (HHP-001–014)"

### Files Changed
- `src/components/dashboard/DashboardPage.tsx`
- `src/components/dashboard/DashboardToolGrid.tsx`
- `src/components/dashboard/DashboardNextActions.tsx`
- `src/components/dashboard/DashboardCardPlanAndChanges.tsx`
- `src/components/dashboard/DashboardCardSelections.tsx`
- `src/components/dashboard/DashboardCardFixList.tsx`
- `src/components/dashboard/DashboardCardMoodBoards.tsx`
- `src/components/dashboard/DashboardCardContractChecklist.tsx`
- `src/components/app/SidebarNav.tsx`

### Status
- [x] All 14 issues implemented (HHP-001 through HHP-014)
- [x] Self-verified by Claude (see sprint doc Verification section)
- [x] TypeScript passes (`npx tsc --noEmit`)
- [x] Production build passes (`npm run build`)
- [ ] **Codex review pending** — see sprint doc for issue-by-issue acceptance criteria
- [ ] Deploy to production

---

## Previous Sprints (Completed)
- Plan & Changes Migration (March 2026)
- Selection-Options UI Improvements (March 10, 2026)
- Project Summary V2 (March 2026)
