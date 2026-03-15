# Sprint: Change Log / Track Plans Follow-Up Polish

**Date**: 2026-03-15
**Objective**: Tighten the last layer of UX, wording, and model consistency so the Track Plans / Change Log surface feels fully coherent after the major cleanup sprint.
**Status**: complete

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| CLG-401 | Rename resources section to match mixed resource model | P1 | done | pass | pass | The resource area now uses mixed-resource language consistently: section header, empty state, archived summary, and the ToolContent zone comment all match the broader model. | none | DocumentsSection.tsx, ToolContent.tsx |
| CLG-402 | Improve wording for text-entry creation CTA | P1 | done | pass | pass | `Add Content` is clearer than `Write`, and the button title and text form still read coherently. | none | DocumentsSection.tsx |
| CLG-403 | Tighten original filename wording in file detail panel | P2 | done | pass | pass | The metadata label now correctly says `Original filename`, which is more precise. | none | FileDetailPanel.tsx |
| CLG-404 | Audit change-level discussion naming for consistency | P1 | done | pass | pass | The change detail page now uses `Description` for the field, `Discussion` for the mobile thread entry point, and the stale 5-status comments were corrected. | none | ChangeDetailContent.tsx, ChangesSection.tsx |
| CLG-405 | Review add-resource flow for clarity and compactness | P2 | done | pass | pass | The add-resource actions remain compact and legible, and the outdated-doc delete affordance now uses the neutral `Delete` tooltip. | none | DocumentsSection.tsx |
| CLG-406 | General copy and surface audit for leftover old language | P1 | done | pass | pass | In the touched polish scope, the visible mixed-resource and discussion naming is aligned with the current model. | none | DocumentsSection.tsx, ChangesSection.tsx, ToolContent.tsx |

### Status values
- `todo`, `in_progress`, `blocked`, `done`, `needs_followup`

### Claude Verified values
- `pending`, `pass`, `fail`

### Codex Verified values
- `pending`, `pass`, `concern`, `fail`

### Follow-up values
- `none`, `claude_fix`, `new_issue`, `deferred`

---

## Acceptance Criteria

### CLG-401: Rename resources section to match mixed resource model
- Section header changed from "Current Working Files" to "Plan Resources"
- Comment in ToolContent.tsx updated to match
- Outdated section summary text updated (no longer says "older files" if mixed)
- Empty state copy updated to reflect mixed resource types
- **Files**: `src/app/app/tools/project-summary/components/DocumentsSection.tsx`, `src/app/app/tools/project-summary/ToolContent.tsx`

### CLG-402: Improve wording for text-entry creation CTA
- "Write" button label changed to "Add Content"
- Button title updated
- Text form heading/placeholder still make sense with new CTA wording
- **Files**: `src/app/app/tools/project-summary/components/DocumentsSection.tsx`

### CLG-403: Tighten original filename wording in file detail panel
- Metadata label changed from "Original file" to "Original filename"
- **Files**: `src/app/app/tools/project-summary/components/FileDetailPanel.tsx`

### CLG-404: Audit change-level discussion naming for consistency
- In ChangeDetailContent.tsx: description field label "Notes" renamed to "Description"
- Mobile comments button "Comments" renamed to "Discussion"
- Sidebar title "Change Discussion" kept (already clear)
- Stale JSDoc comment "5 homeowner-friendly statuses" fixed to "4"
- **Files**: `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`

### CLG-405: Review add-resource flow for clarity and compactness
- Add-resource button titles are consistent and clear
- Delete tooltip on outdated docs updated from "Delete file" to "Delete"
- **Files**: `src/app/app/tools/project-summary/components/DocumentsSection.tsx`

### CLG-406: General copy and surface audit for leftover old language
- No "files" or "Notes" labels remain where mixed resources or Discussion is meant
- Stale JSDoc "5 homeowner-friendly statuses" comments updated to "4" in ChangesSection.tsx
- Empty state and helper copy aligned with current model
- **Files**: `src/app/app/tools/project-summary/components/DocumentsSection.tsx`, `src/app/app/tools/project-summary/components/ChangesSection.tsx`, `src/app/app/tools/project-summary/ToolContent.tsx`, `src/app/app/tools/project-summary/constants.ts`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/project-summary/components/DocumentsSection.tsx` | Renamed section header "Current Working Files" → "Plan Resources". Updated empty state copy for mixed resources. Updated archived summary from "older files" to "archived". Renamed "Write" button to "Add Content". Updated button title. Changed "Delete file" tooltip to "Delete". |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Updated zone comment from "Current Working Files" to "Plan Resources". |
| `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` | Renamed metadata label "Original file" → "Original filename". |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | Renamed description field label "Notes" → "Description". Renamed mobile comments button "Comments" → "Discussion". Fixed stale JSDoc "5 statuses" → "4 statuses". |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Fixed stale JSDoc "5 statuses" → "4 statuses". |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Section header for mixed resources says "Plan Resources"
- [ ] Text-entry CTA says "Add Content"
- [ ] Original filename label says "Original filename"
- [ ] Change-level discussion naming is aligned (Description, Discussion)
- [ ] Add-resource flow feels coherent
- [ ] No leftover old labels remain in visible UI

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-15-change-log-polish-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-15-change-log-polish-response.md` |

---

## Scope Change Log

| Date | Issue | Classification | Reason |
|------|-------|---------------|--------|
| — | — | — | — |

---

## Sprint Closure Checklist

- [x] Every in-scope issue is `done` or explicitly moved out
- [x] Every completed issue: `Claude Verified: pass`
- [x] Every completed issue: `Codex Verified: pass`
- [x] Every issue's `Follow-up` is explicit
- [x] Build/typecheck recorded
- [x] Codex audit linked above
- [x] Claude response linked above (if follow-up occurred) — no follow-up needed, all passed clean
- [x] `docs/ai/active-sprint.md` status set to `complete`
