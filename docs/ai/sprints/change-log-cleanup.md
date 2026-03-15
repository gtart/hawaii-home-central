# Sprint: Change Log / Track Plans Cleanup

**Date**: 2026-03-15
**Objective**: Refine the Track Plans / Change Log surface so it feels like a simpler homeowner-facing living plan + changes tool. Fix duplicate naming, simplify statuses, flatten change list, add text-based content entries, and clean up UI clutter.
**Status**: ready_for_codex

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| CLG-301 | Simplify user-facing change status model | P0 | done | pass | pass | The visible status model is reduced to the intended 4 labels and the main mappings agree. | none | constants.ts, ChangesSection.tsx |
| CLG-302 | Remove separate Resolved grouping, use flat list | P0 | done | pass | pass | Grouped sections are gone and the list is now flat and reverse-chronological. | none | ChangesSection.tsx |
| CLG-303 | Label top scope field clearly | P1 | done | pass | pass | Scope of Work label and clearer placeholder are present. | none | ToolContent.tsx |
| CLG-304 | Rename plan-level Notes to Discussion | P1 | done | pass | pass | Header button and sidebar now consistently say Discussion. | none | ToolContent.tsx |
| CLG-305 | Fix duplicate Notes in file detail panel | P1 | done | pass | pass | File detail naming now cleanly separates Description from Discussion. | none | FileDetailPanel.tsx |
| CLG-306 | Make original filename explicit | P1 | done | pass | pass | Original filename is now visible in file detail metadata when present. | none | FileDetailPanel.tsx |
| CLG-307 | Remove or reframe weak header actions | P1 | done | pass | concern | The top row now has Upload, Link, and Write, but the Link form still includes an `Or upload a file` action, which reintroduces the mixed-mode flow this cleanup was trying to simplify. | none | ToolContent.tsx, DocumentsSection.tsx |
| CLG-308 | Add text-based plan content entries | P0 | done | pass | concern | Current text entries are distinct, but archived text entries fall back to the generic outdated-file row and lose the Text badge/body-preview distinction in the same resource list. | none | project-summary.ts, DocumentsSection.tsx, FileDetailPanel.tsx |
| CLG-309 | Clarify comment hierarchy naming | P1 | done | pass | pass | Main tool-surface conversation naming now uses Discussion consistently. | none | ToolContent.tsx, FileDetailPanel.tsx |

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

### CLG-301: Simplify user-facing change status model
- Visible statuses reduced to 4: Noted, Needs Confirmation, Added to Plan, No Longer Needed
- No visible status says "Completed" or "Confirmed"
- "Added to Plan" is the post-confirmation state
- Storage statuses `approved_by_homeowner`, `accepted_by_contractor`, `done` all map to `added_to_plan`
- `CHANGE_STATUS_CONFIG` labels for those 3 storage statuses updated to "Added to Plan"
- Status dropdown, pill rendering, and mapping function all agree
- Dead `WorkflowGroup` type and `getWorkflowGroup()` removed
- **Files**: `src/app/app/tools/project-summary/constants.ts`, `src/app/app/tools/project-summary/components/ChangesSection.tsx`

### CLG-302: Remove separate Resolved grouping, use flat list
- No separate Resolved section remains
- No separate "No longer needed" collapsed bucket
- One main changes list sorted reverse-chronologically (newest first)
- Row status remains visible and editable via StatusDropdown
- **Files**: `src/app/app/tools/project-summary/components/ChangesSection.tsx`

### CLG-303: Label top scope field clearly
- Field is visibly labeled "Scope of Work" with uppercase tracking label
- Placeholder: "What are you renovating? e.g. 'Full kitchen and master bath remodel'"
- **Files**: `src/app/app/tools/project-summary/ToolContent.tsx`

### CLG-304: Rename plan-level Notes to Discussion
- Header action button reads "Discussion" (not "Notes")
- Sidebar title reads "Discussion" (not "Notes")
- **Files**: `src/app/app/tools/project-summary/ToolContent.tsx`

### CLG-305: Fix duplicate Notes in file detail panel
- File metadata freeform field labeled "Description" (not "Note")
- Comment thread labeled "Discussion" (not "Notes")
- Empty state: "No discussion yet." (not "No notes yet.")
- Input placeholder: "Add a comment..." (not "Add a note...")
- Click-to-edit text: "Click to add a description..." (not "Click to add a note...")
- **Files**: `src/app/app/tools/project-summary/components/FileDetailPanel.tsx`

### CLG-306: Make original filename explicit
- Document cards use human-readable `label`
- Detail panel shows original `fileName` in metadata as "Original file" when present
- Renaming display title does not destroy original file provenance
- **Files**: `src/app/app/tools/project-summary/components/FileDetailPanel.tsx`

### CLG-307: Remove or reframe weak header actions
- "Copy" button removed from header (along with `handleCopySummary` and `copiedSummary` state)
- "Link URL" standalone text CTA replaced with styled "Link" button with link icon
- "Write" button added for text content creation
- Upload, Link, and Write buttons form coherent row of add-resource actions
- **Files**: `src/app/app/tools/project-summary/ToolContent.tsx`, `src/app/app/tools/project-summary/components/DocumentsSection.tsx`

### CLG-308: Add text-based plan content entries
- `SummaryDocument` extended with `contentType?: 'file' | 'link' | 'text'` and `body?: string`
- `coerceDocument` in `ensureShape()` handles new fields — old payloads load fine (fields are optional)
- "Write" button in header opens text entry form (title + body textarea)
- Text entries render with distinct styling: sandstone/10 border, text icon, "Text" badge, 2-line body preview
- FileDetailPanel shows editable "Content" section for text entries instead of file preview/download
- Raw body stored directly in `body` field, no compression/summarization
- **Files**: `src/data/project-summary.ts`, `src/app/app/tools/project-summary/components/DocumentsSection.tsx`, `src/app/app/tools/project-summary/components/FileDetailPanel.tsx`

### CLG-309: Clarify comment hierarchy naming
- Within the Project Summary surface, "Discussion" is used consistently for threaded conversations
- "Description" used for file metadata freeform text
- No "Notes" label remains in the main tool surface (ToolContent, FileDetailPanel, DocumentsSection)
- Note: `ChangeDetailContent.tsx` (change detail page) still uses "Notes" for change description — this is a different surface and out of scope
- **Files**: `src/app/app/tools/project-summary/ToolContent.tsx`, `src/app/app/tools/project-summary/components/FileDetailPanel.tsx`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/project-summary/constants.ts` | Reduced user-facing statuses from 5 to 4: removed "Confirmed" and "Completed", added "Added to Plan". Updated `CHANGE_STATUS_CONFIG` labels, `CHANGE_LOG_STATUS_CONFIG`, `CHANGE_LOG_STATUS_ORDER`, and `toChangeLogStatus()`. |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Removed `WorkflowGroup` type and `getWorkflowGroup()`. Replaced grouped rendering (needs_followup/resolved/no_longer_needed) with single flat reverse-chronological list. |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Added "Scope of Work" label. Renamed "Notes" to "Discussion" in header button and sidebar. Removed "Copy" header action and related state/handler. |
| `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` | Renamed "Note" → "Description", "Notes" → "Discussion" in comment thread. Updated empty states and placeholders. Added original filename in metadata. Added text content viewing/editing for `contentType: 'text'`. Added `onUpdateBody` prop. |
| `src/app/app/tools/project-summary/components/DocumentsSection.tsx` | Replaced "Link URL" standalone CTA with styled "Link" button. Added "Write" button for text content. Added text entry form (title + body). Updated `renderCurrentDoc` for text entries (distinct styling). Extracted `renderDocActions` helper. Passes `onUpdateBody` to FileDetailPanel. |
| `src/data/project-summary.ts` | Added `DocumentContentType = 'file' | 'link' | 'text'`. Added `contentType` and `body` fields to `SummaryDocument`. Updated `coerceDocument` to handle new fields. |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Simplified statuses render correctly (Noted, Needs Confirmation, Added to Plan, No Longer Needed)
- [ ] One flat change list works (newest first)
- [ ] File detail panel naming is fixed (Description + Discussion, no duplicate Notes)
- [ ] Original filename displays correctly in file detail metadata
- [ ] Plan-level Discussion works (sidebar title and header button)
- [ ] Text-content entry can be created via "Write" button and persists
- [ ] Text entries visually distinct from file entries in resource list
- [ ] Text entry body is editable in detail panel
- [ ] Old collections still load through ensureShape()
- [ ] Scope of Work label visible above scope field

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-15-change-log-cleanup-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-15-change-log-cleanup-response.md` |

---

## Scope Change Log

| Date | Issue | Classification | Reason |
|------|-------|---------------|--------|
| — | — | — | — |

---

## Sprint Closure Checklist

- [ ] Every in-scope issue is `done` or explicitly moved out
- [ ] Every completed issue: `Claude Verified: pass`
- [ ] Every completed issue: `Codex Verified: pass`
- [ ] Every issue's `Follow-up` is explicit
- [x] Build/typecheck recorded
- [ ] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`

---

## Deferred Items

| Item | Reason |
|------|--------|
| `ChangeDetailContent.tsx` "Notes" label | Different surface (change detail page) — renaming requires reviewing that page's full naming conventions separately |
