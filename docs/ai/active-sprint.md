# Active Sprint

## Current: Track Plans UI Redesign (March 13, 2026)

### Sprint Doc
`docs/ai/sprints/track-plans-ui-redesign.md`

### Objective
Major UI overhaul of Track Plans — compact plan card, file management improvements, change order tabs, field redesign, and cross-tool entity picker.

### Commits
- `d202610`

### Files Changed (Sprint)
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx`
- `src/app/app/tools/project-summary/components/ChangesSection.tsx`
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx`
- `src/app/app/tools/project-summary/ToolContent.tsx`
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`
- `src/app/app/tools/project-summary/components/AttachMenu.tsx`
- `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` (new)
- `src/app/app/tools/project-summary/components/EntityPickerModal.tsx` (new)
- `src/app/app/tools/project-summary/components/OpenItemsList.tsx`
- `src/app/app/tools/project-summary/components/SectionHeader.tsx`
- `src/app/api/collections/[id]/entities/route.ts` (new)
- `src/app/api/tools/entities/route.ts` (new)

### Status
- [x] Phase 1: Plan Card Cleanup (PLAN-001, 002, 003)
- [x] Phase 2: File Management (PLAN-004, 005)
- [x] Phase 3: Change Order Redesign (PLAN-006, 007, 008, 009)
- [x] Phase 4: Cross-Tool + Polish (PLAN-010, 011)
- [x] TypeScript passes
- [x] Production build passes
- [ ] Codex review

---

## Previous Sprints (Completed)
- Comment Readability + Email Notifications (March 13, 2026) — `d202610`
- Plan & Changes Rebuild v1 (March 13, 2026) — `e78b17e`, `6888bdc`
- UX Fixes: Track Plans/Choose Selections/Fix Issues (March 13, 2026) — `c61237e`
- Homeowner Homepage Design Sprint (March 13, 2026) — `6076c0a`
- Plan & Changes Migration (March 2026)
- Selection-Options UI Improvements (March 10, 2026)
- Project Summary V2 (March 2026)
