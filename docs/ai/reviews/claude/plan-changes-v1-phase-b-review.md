# Phase B Review — Open Items System

**Sprint:** Plan & Changes Rebuild v1
**Phase:** B
**Date:** 2026-03-13
**Status:** Complete

---

## What Changed

### Schema (`src/data/project-summary.ts`)
- New `OpenItemStatus` type: `'open' | 'waiting' | 'resolved' | 'closed'`
- New `OpenItem` interface with status, resolution metadata (`resolved_at`, `resolved_by`, `resolution_note`), waiting metadata (`waiting_on`), and standard audit fields
- `CurrentPlan` interface extended with `open_items: OpenItem[]`
- `SummaryChange` interface extended with `open_items?: OpenItem[]`
- `still_to_decide` marked as `@deprecated` on `CurrentPlan` — kept for backward-compatible migration
- `VALID_OPEN_ITEM_STATUSES` enum set added
- `coerceOpenItem()` / `coerceOpenItems()` validation functions added
- `migratePlanItemToOpenItem()` converts legacy `PlanItem` (from `still_to_decide`) to `OpenItem` with status `'open'`
- `coerceV2()` updated: if `open_items` array exists, uses it directly; if only `still_to_decide` exists, migrates items to `open_items` and empties `still_to_decide`
- v1→v2 migration updated to place migrated decisions directly into `open_items`
- Default payload includes `open_items: []`

### State Hook (`useProjectSummaryState.ts`)
- Added plan-level open item methods:
  - `addOpenItem(text, createdBy?)` — creates new open item with status `'open'`
  - `updateOpenItem(id, updates, updatedBy?)` — updates text, status, waiting_on
  - `resolveOpenItem(id, note?, actor?)` — sets status to `'resolved'`, captures resolution metadata, creates `open_item_resolved` milestone
  - `deleteOpenItem(id)` — removes open item
- Added change-level open item methods:
  - `addChangeOpenItem(changeId, text, createdBy?)` — adds open item to a specific change
  - `updateChangeOpenItem(changeId, itemId, updates, actor?)` — updates change open item (auto-sets `resolved_at` when status → resolved)
  - `deleteChangeOpenItem(changeId, itemId)` — removes change open item

### UI — OpenItemsList Component (NEW)
- New component at `components/OpenItemsList.tsx`
- Renders items with color-coded status dots (cream=open, amber=waiting, emerald=resolved, grey=closed)
- Status dropdown: click dot to change status via custom div-based dropdown (not native `<select>`)
- Inline text editing (click to edit, Enter to save, Escape to cancel)
- Delete with confirmation
- Quick resolve button on hover → opens `ResolveDialog` modal with optional resolution note
- Resolved/closed items shown in collapsible `<details>` with strikethrough text
- Shows resolution note and date under resolved items
- Status badges for non-open statuses (e.g., "Waiting on contractor")
- Add new item input at bottom

### UI — CurrentPlanSection
- Replaced "Still to Decide" label with "Plan Open Items"
- Replaced `PlanItemList` with `OpenItemsList` for open items
- Added unresolved open items readiness indicator banner (amber, shows count + waiting breakdown)
- Added `ApproveWithOpenItemsWarning` dialog (PCV1-013):
  - Triggered when clicking Approve/Re-approve with unresolved items
  - Shows amber warning icon and count of unresolved items
  - "Go Back" and "Approve Anyway" options
  - If user proceeds, approval happens normally (PCV1-012)
- Unresolved items remain visible after approval (PCV1-012)

### UI — ChangeDetailContent
- Added "Open Items" section to change detail page
- Uses `OpenItemsList` component for change-level open items
- Supports full CRUD: add, update, resolve, delete

### UI — MilestoneTimeline
- Added `open_item_resolved` event icon

### API — Collections Previews
- Added `unresolvedOpenItemCount` to preview response
- Computed from `open_items.filter(i => i.status === 'open' || i.status === 'waiting').length`

### UI — CollectionsPickerView
- Added `unresolvedOpenItemCount` to preview interface
- Updated "to decide" labels to "open items" with pluralization
- Prioritizes `unresolvedOpenItemCount` over legacy `stillToDecideCount`

### UI — ChangesSection
- Updated `openItemCount` computation from `still_to_decide.length` to `open_items.filter(active).length`

---

## Issue Completion

| Issue ID | Title | Status | Acceptance |
|----------|-------|--------|------------|
| PCV1-009 | Replace "Still to Decide" with explicit open-item model | Complete | Pass |
| PCV1-010 | Add statuses for open items | Complete | Pass |
| PCV1-011 | Make open-item resolution explicit | Complete | Pass |
| PCV1-012 | Support approval with unresolved open items | Complete | Pass |
| PCV1-013 | Prompt before approving with unresolved items | Complete | Pass |
| PCV1-014 | Surface unresolved items as readiness indicators | Complete | Pass |

---

## Risks Introduced

1. **Data migration**: Existing payloads with `still_to_decide` items will be silently migrated to `open_items` on next `ensureShape()` call. Once migrated, `still_to_decide` array is emptied. This is the same proven pattern used for v1→v2 and plan status migrations.

2. **still_to_decide deprecation**: The field is kept in the `CurrentPlan` interface and still filtered in `deletePlanItem()` for backward compat. It will naturally phase out as no UI writes to it anymore.

3. **Change open items**: Stored as optional `open_items?: OpenItem[]` on `SummaryChange`. Existing changes without open items render correctly (empty list with add option).

---

## UX/Copy/Model Regressions to Watch

- "Still to Decide" label is fully replaced with "Plan Open Items" in the plan section
- The `CollectionsPickerView` now shows "X open items" instead of "X to decide" — applies to both desktop table and mobile card views
- Open items with "waiting" status show who/what they're waiting on — this is a new concept users haven't seen before
- The resolve dialog is a modal — on mobile it appears centered (consistent with other modals in the app)

---

## What Codex Should Verify

1. The `ensureShape()` function correctly migrates `still_to_decide` items to `open_items` with status `'open'`
2. If both `open_items` and `still_to_decide` exist, `open_items` takes precedence
3. `OpenItemsList` renders status dots with correct colors
4. Status dropdown works (click dot → dropdown → select status)
5. Resolve dialog captures optional note and sets `resolved_at` / `resolution_note`
6. Resolved items show in collapsible section with strikethrough
7. Approval warning dialog appears when approving with unresolved items
8. "Approve Anyway" button in warning dialog proceeds with approval
9. Unresolved items remain visible after plan is approved
10. Change detail page shows open items section with CRUD
11. Milestone timeline shows `open_item_resolved` events
12. CollectionsPickerView shows "X open items" badge
13. Build passes with zero errors in `src/`

---

## Build Verification

- `npx tsc --noEmit`: 1 pre-existing error in `e2e/app-ui-review.spec.ts` (not related to sprint changes), 0 errors in `src/`
- `npm run build`: Pass
