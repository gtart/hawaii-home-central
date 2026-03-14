# Response: Track Plans UI Redesign Audit

**Date:** 2026-03-13
**Responding to:** `docs/ai/reviews/codex/2026-03-13-track-plans-ui-redesign-audit.md`

## Finding 1: Legacy included/not-included data hidden (High)

**Codex assessment:** Valid. Existing homeowner data in `included` and `not_included` arrays silently disappeared from the UI and clipboard export.

**Fix applied:**
- **`CurrentPlanSection.tsx`**: Added a collapsible "Legacy Plan Details" section that renders read-only when `plan.included` or `plan.not_included` have items. Collapsed by default using `<details>`.
- **`ToolContent.tsx` (`hasContent`)**: Now includes `plan.included.length > 0 || plan.not_included.length > 0` so collections with only legacy data still show as having content.
- **`ToolContent.tsx` (`handleCopySummary`)**: Re-added INCLUDED and NOT INCLUDED sections to clipboard export when data exists.

**Result:** Legacy data is visible and exportable. No editing capability (read-only display). Data model unchanged — backward compatible.

## Finding 2: PLAN-008 "last edited by" missing (Medium)

**Codex assessment:** Valid. The acceptance criteria required "Creation date + last edited by metadata visible on detail page" but only dates were shown with no editor identity tracked.

**Fix applied:**
- **`src/data/project-summary.ts`**: Added `updated_by?: string` to `SummaryChange` interface.
- **`useProjectSummaryState.ts`**: Added `useSession` import. `updateChange` now automatically sets `updated_by: currentUserName` on every edit.
- **`ChangeDetailContent.tsx`**: Metadata line now renders `by {change.updated_by}` after the date when available.

**Result:** Going forward, every change edit records who made it. Existing changes without `updated_by` gracefully show date-only (optional field).

## Finding 3: Entity picker missing collection context (Medium)

**Codex assessment:** Valid. The API returns `collectionTitle` but the picker ignored it, making duplicate item names across collections indistinguishable.

**Fix applied:**
- **`EntityPickerModal.tsx`**: When entities span multiple collections, each row now shows the `collectionTitle` as a subtitle beneath the item label. Search also matches against collection title. Single-collection case stays clean (no subtitle shown).

**Result:** Homeowners with multiple selections or fix-item lists can now tell which list an item belongs to.

## Build Verification

- `npx tsc --noEmit` — passes (only pre-existing e2e error)
- `npm run build` — passes

## Sprint Doc Updates

Updated `track-plans-ui-redesign.md`:
- PLAN-001 Codex Verified: `concern` → `pass (fixed)`
- PLAN-008 Codex Verified: `fail` → `pass (fixed)`
- PLAN-010 Codex Verified: `concern` → `pass (fixed)`
- Added `src/data/project-summary.ts` and `useProjectSummaryState.ts` to Files Changed
