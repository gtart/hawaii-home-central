# Sprint: Track Plans UI Redesign

**Date**: March 13, 2026
**Objective**: Major UI overhaul of the Track Plans (project-summary) tool — compact plan card, file management improvements, change order tabs, field redesign, and cross-tool entity picker.

---

## Issue Tracker

| ID | Title | Status | Claude Verified | Codex Verified |
|----|-------|--------|-----------------|----------------|
| PLAN-001 | Remove "What's Included" / "What's Not Included" from UI | done | yes | pass (fixed) |
| PLAN-002 | Rename "Open Items" → "Unresolved Items" (UI only) | done | yes | pass |
| PLAN-003 | Compact Plan Card Layout | done | yes | pass |
| PLAN-004 | Quick File Upload Plus Button | done | yes | pass |
| PLAN-005 | File Detail Sidebar / Bottom Sheet | done | yes | pass |
| PLAN-006 | Change Order Tabs (Accepted / Pending / Not Approved) | done | yes | pass |
| PLAN-007 | Accepted Changes Inline in Plan Card | done | yes | pass |
| PLAN-008 | Change Order Field Redesign + Labels | done | yes | pass (fixed) |
| PLAN-009 | Change Order Inline File Upload | done | yes | pass |
| PLAN-010 | Cross-Tool Entity Picker Modal | done | yes | pass (fixed) |
| PLAN-011 | Mobile Bottom Sheet Polish | done | yes | pass |

---

## Acceptance Criteria

### PLAN-001: Remove "What's Included" / "What's Not Included" from UI
- Plan card no longer renders included/not-included PlanItemList sections
- Copy Summary (clipboard export) omits those sections
- "Affects Plan Sections" toggles on ChangeDetailContent only show: scope, budget, open_items
- Data model (`PlanItem` type, `ensureShape` coercion) unchanged — backward compat
- **Files**: `CurrentPlanSection.tsx`, `ToolContent.tsx`, `ChangeDetailContent.tsx`

### PLAN-002: Rename "Open Items" → "Unresolved Items" (UI only)
- Every user-facing "Open Items" label reads "Unresolved Items"
- Internal type names (`OpenItem`, `open_items`, `OpenItemStatus`) unchanged
- **Files**: `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `ChangeDetailContent.tsx`, `ToolContent.tsx`

### PLAN-003: Compact Plan Card Layout
- Plan card is visually shorter (fewer banners, tighter spacing)
- Section order: Scope → Documents/Files → Unresolved Items → Budget
- All functionality preserved (approve, unlock, edit scope)
- Works on desktop and mobile
- **Files**: `CurrentPlanSection.tsx`

### PLAN-004: Quick File Upload Plus Button
- Prominent `+` button next to "Documents & Files" header (sandstone accent)
- Single click opens native file picker
- Upload uses existing `uploadProjectSummaryFile` helper
- Secondary "Link URL" text button still available
- **Files**: `DocumentsSection.tsx`

### PLAN-005: File Detail Sidebar / Bottom Sheet
- Clicking a document opens detail panel with: preview/icon, metadata, editable note, comment thread
- Desktop: slide-in sidebar from right
- Mobile: bottom sheet with drag handle and backdrop
- Comments use `useComments` with `targetType: 'document'`, `targetId: doc.id`
- **Files**: `FileDetailPanel.tsx` (new), `DocumentsSection.tsx`

### PLAN-006: Change Order Tabs
- Three tabs: Accepted (default), Pending Review (count pill), Not Approved
- Accepted: `approved_by_homeowner`, `accepted_by_contractor`, `done`
- Pending Review: `requested`, `awaiting_homeowner`
- Not Approved: `closed`
- Tab styling: cream/sandstone, underline indicator
- All actions work within each tab
- **Files**: `ChangesSection.tsx`

### PLAN-007: Accepted Changes Inline in Plan Card
- Incorporated changes appear as compact cards within plan card
- Collapsed by default, expandable
- Shows title, incorporation date, cost impact
- Clicking links to change detail page
- **Files**: `CurrentPlanSection.tsx`

### PLAN-008: Change Order Field Redesign + Labels
- Labels: Description → "Scope / What's Changed", Rationale → "Reason", Note → "Additional Notes", Contractor Response → "Note from Contractor"
- Budget shows proposed/final side by side (desktop) or stacked (mobile)
- Creation date + "last edited by" metadata visible on detail page
- "Affects Plan Sections" toggles removed
- **Files**: `ChangesSection.tsx`, `ChangeDetailContent.tsx`

### PLAN-009: Change Order Inline File Upload
- File upload button visible in expanded change row (not just detail page)
- Uploaded files appear in attachments immediately
- No regression on detail page upload
- **Files**: `ChangesSection.tsx`

### PLAN-010: Cross-Tool Entity Picker Modal
- "Link Selection" opens modal showing real selections from Choose Selections tool
- "Link Fix Item" opens modal showing real fix items from Fix Issues tool
- Search/filter works
- Selected entity creates `SummaryLink` with proper `entityId`, `collectionId`, `label`
- Mobile: bottom sheet
- No changes to Fix List or Selections code
- **Files**: `entities/route.ts` (new API), `EntityPickerModal.tsx` (new), `AttachMenu.tsx`

### PLAN-011: Mobile Bottom Sheet Polish
- All new modals render as bottom sheets below `md:` breakpoint
- Bottom sheets have drag handle and backdrop
- Desktop modals are centered overlays
- **Files**: `FileDetailPanel.tsx`, `EntityPickerModal.tsx`, `OpenItemsList.tsx`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Remove included/not-included, rename open items, compact layout, incorporated changes section |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Tab redesign, field labels, inline file upload, rename open items |
| `src/app/app/tools/project-summary/components/DocumentsSection.tsx` | Quick upload button, clickable rows for detail panel |
| `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` | NEW — file detail sidebar/bottom sheet |
| `src/app/app/tools/project-summary/components/EntityPickerModal.tsx` | NEW — cross-tool entity picker |
| `src/app/app/tools/project-summary/components/AttachMenu.tsx` | Wire to EntityPickerModal, add projectId prop |
| `src/app/app/tools/project-summary/components/OpenItemsList.tsx` | Resolve dialog: desktop modal + mobile bottom sheet |
| `src/app/app/tools/project-summary/components/SectionHeader.tsx` | Add extraActions prop |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Copy Summary updates, rename labels |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | Field labels, remove affects sections, metadata display, budget side-by-side |
| `src/app/api/collections/[id]/entities/route.ts` | NEW — API to list entities within a collection |
| `src/app/api/tools/entities/route.ts` | NEW — API to list entities across collections by toolKey |
| `src/data/project-summary.ts` | Added `updated_by` field to `SummaryChange` interface |
| `src/app/app/tools/project-summary/useProjectSummaryState.ts` | Added `useSession`, auto-sets `updated_by` on change edits |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (only pre-existing e2e error)
- [x] `npm run build` passes
