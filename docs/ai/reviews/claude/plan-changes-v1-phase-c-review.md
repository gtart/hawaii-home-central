# Phase C Review — Record Ownership and Evidence

**Sprint:** Plan & Changes Rebuild v1
**Phase:** C
**Date:** 2026-03-13
**Status:** Complete

---

## What Changed

### Schema (`src/data/project-summary.ts`)
- New `DocScope` type: `'plan' | 'reference'`
- `SummaryDocument` extended with `doc_scope?: DocScope` — defaults to `'plan'`
- `SummaryChange` extended with `affects_sections?: string[]`
- `VALID_DOC_SCOPES` enum set added
- `coerceDocument()` updated to validate and preserve `doc_scope`
- `coerceChange()` updated to validate and preserve `affects_sections` (filters to strings only)

### UI — DocumentsSection
- Section title changed from "Key Plan Documents" to "Documents"
- Documents split into two groups:
  - **Plan Documents** — docs with `doc_scope: 'plan'` or no scope (default)
  - **Reference Documents** — docs with `doc_scope: 'reference'`, shown with "Shared across plan and changes" subtitle
- Each plan doc has a "Ref" button (visible on hover) to move it to reference docs
- Each reference doc has a "Move to Plan" button to move it back
- Add form includes a "Belongs to:" toggle: Plan / Reference (shared)
- Existing documents without `doc_scope` default to `'plan'` — no migration needed

### UI — ChangeDetailContent
- Added "Affects Plan Sections" pill selector (PCV1-019)
- Five toggleable pills: Scope, Included, Not Included, Budget, Open Items
- Active pills highlighted in sandstone; inactive in subtle cream
- Read-only mode disables pills
- Data stored as `affects_sections: string[]` on the change record

### Changes Already Complete
- **PCV1-016** (change-level artifacts): Changes already had their own `attachments: ChangeAttachment[]` with full CRUD. The change detail page has file upload, URL attachment, and attachment listing. No additional implementation needed — the UI was already clear about attachment ownership.

---

## Issue Completion

| Issue ID | Title | Status | Acceptance |
|----------|-------|--------|------------|
| PCV1-015 | Make plan-level artifacts belong to the plan | Complete | Pass |
| PCV1-016 | Make change-level artifacts belong to the change | Complete | Pass |
| PCV1-017 | Reduce or eliminate generic collection-level document ambiguity | Complete | Pass |
| PCV1-018 | Add narrow shared Reference Docs area only if truly needed | Complete | Pass |
| PCV1-019 | Add "affects plan sections" metadata to changes | Complete | Pass |

---

## Risks Introduced

1. **Document scope migration**: Existing documents without `doc_scope` default to `'plan'` via the filter `!d.doc_scope || d.doc_scope === 'plan'`. No data migration needed — this is purely additive.

2. **Affects sections data**: Stored as a flat `string[]` rather than an enum. This allows future extensibility (custom sections) but means the UI hardcodes the known sections. New sections would need UI updates.

---

## UX/Copy/Model Regressions to Watch

- The section title changed from "Key Plan Documents" to "Documents" — less descriptive but makes room for the plan/reference split
- The "Ref" move-to-reference button is only visible on hover — could be missed on mobile. The add form's scope toggle is the primary way to set scope.
- "Affects Plan Sections" pills are sandstone-colored when active, which is the accent color. They should stand out well.
- Reference docs section only appears when there are reference docs — no empty state cluttering.

---

## What Codex Should Verify

1. Documents default to plan scope when no `doc_scope` is set
2. "Ref" button on plan docs moves them to reference section
3. "Move to Plan" button on reference docs moves them back
4. Add form scope toggle persists to the created document
5. "Affects Plan Sections" pills toggle correctly and persist
6. Change detail page shows all 5 section pills
7. `coerceDocument` preserves `doc_scope` through ensureShape roundtrip
8. `coerceChange` preserves `affects_sections` through ensureShape roundtrip
9. Build passes with zero errors in `src/`

---

## Build Verification

- `npx tsc --noEmit`: 1 pre-existing error in `e2e/app-ui-review.spec.ts`, 0 errors in `src/`
- `npm run build`: Pass
