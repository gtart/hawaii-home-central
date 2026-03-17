# Sprint: Change Log — Plan's Files & Change Attachments

**Date**: 2026-03-15
**Objective**: Rename resources section to Plan's Files, auto-promote accepted change attachments, add provenance tracking, and give changes the same Upload/Link/Add Content attachment model as the main resource section.
**Status**: ready_for_codex

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| CLG-501 | Rename resources section to Plan's Files + microcopy | P1 | done | pass | concern | The new header/microcopy landed, but the section still exposes `Link` and `Add Content` actions and also receives auto-promoted link/text attachments, so `Plan's Files` no longer matches what the surface actually contains. | claude_fix | DocumentsSection.tsx, ToolContent.tsx |
| CLG-502 | Add sourceChangeId/sourceChangeTitle to SummaryDocument | P0 | done | pass | pass | The new provenance fields are present on `SummaryDocument` and load through coercion without breaking old payloads. | none | project-summary.ts |
| CLG-503 | Auto-promote change attachments when status → Added to Plan | P0 | done | pass | pass | Status transition promotion logic is present, dedupes by URL, and maps file/link/text attachments into documents with change provenance. | none | useProjectSummaryState.ts |
| CLG-504 | Show source-change provenance on auto-promoted documents | P1 | done | pass | pass | Current documents now show `From change: ...`, and the detail panel metadata includes a `From change` row. | none | DocumentsSection.tsx, FileDetailPanel.tsx |
| CLG-505 | Extend ChangeAttachment to support text content | P1 | done | pass | pass | Change attachments now support `text`, optional URL, and body coercion for backward-compatible loading. | none | project-summary.ts |
| CLG-506 | Upgrade change detail page with Upload/Link/Add Content | P0 | done | pass | pass | The change detail attachment area now supports Upload/Link/Add Content, and inline change rows handle text attachments without forcing a URL. | none | ChangeDetailContent.tsx, ChangesSection.tsx |

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

### CLG-501: Rename resources section to Plan's Files + microcopy
- Section header reads "Plan's Files" (not "Plan Resources" or "Current Working Files")
- ToolContent zone comment updated
- Empty state: "Plans, contracts, agreed-upon images, and other reference files. Files from accepted changes are added here automatically."
- **Files**: `src/app/app/tools/project-summary/components/DocumentsSection.tsx`, `src/app/app/tools/project-summary/ToolContent.tsx`

### CLG-502: Add sourceChangeId/sourceChangeTitle to SummaryDocument
- `SummaryDocument` interface has optional `sourceChangeId` and `sourceChangeTitle` fields
- `coerceDocument` handles these fields (backward-compatible)
- **Files**: `src/data/project-summary.ts`

### CLG-503: Auto-promote change attachments when status → Added to Plan
- When `updateChange` sets status to `approved_by_homeowner`, `accepted_by_contractor`, or `done` (and previous status was NOT one of these), file attachments from the change are copied to `documents`
- Auto-promoted documents carry `sourceChangeId` and `sourceChangeTitle`
- Duplicate URLs are not re-promoted (checked by matching fileUrl/url)
- Text attachments are promoted as `contentType: 'text'`
- URL attachments are promoted as `contentType: 'link'`
- **Files**: `src/app/app/tools/project-summary/useProjectSummaryState.ts`

### CLG-504: Show source-change provenance on auto-promoted documents
- Current file/text entries show "From change: [title]" when `sourceChangeTitle` is present
- FileDetailPanel metadata grid shows "From change" row when `sourceChangeTitle` is present
- **Files**: `src/app/app/tools/project-summary/components/DocumentsSection.tsx`, `src/app/app/tools/project-summary/components/FileDetailPanel.tsx`

### CLG-505: Extend ChangeAttachment to support text content
- `ChangeAttachment.type` union extended to `'file' | 'url' | 'text'`
- `url` field is now optional (text attachments have no URL)
- `body` field added for text content
- `coerceAttachment` handles text type (url not required for text)
- **Files**: `src/data/project-summary.ts`

### CLG-506: Upgrade change detail page with Upload/Link/Add Content
- Change detail attachments section uses Upload/Link/Add Content button row (matching Plan's Files pattern)
- Link form: name field + URL field
- Add Content form: title + body textarea
- Attachment list renders text entries with text icon, "Text" badge, body preview
- Inline change row in ChangesSection handles text attachments (no URL → span instead of link)
- **Files**: `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx`, `src/app/app/tools/project-summary/components/ChangesSection.tsx`

---

## Files Changed

| File | Change |
|------|--------|
| `src/data/project-summary.ts` | Added `sourceChangeId`, `sourceChangeTitle` to `SummaryDocument`. Extended `ChangeAttachment.type` to include `'text'`, made `url` optional, added `body` field. Updated `coerceDocument` and `coerceAttachment`. |
| `src/app/app/tools/project-summary/useProjectSummaryState.ts` | Added auto-promotion logic in `updateChange`: when status moves to Added to Plan, copies change attachments to documents with provenance fields. |
| `src/app/app/tools/project-summary/components/DocumentsSection.tsx` | Renamed section to "Plan's Files". Updated empty state microcopy. Added source-change provenance display on current file and text entries. |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Updated zone comment. |
| `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` | Added "From change" row in metadata grid. |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | Replaced basic attachment UI with Upload/Link/Add Content pattern. Added text content form and rendering. |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Updated inline attachment rendering to handle text attachments (no URL). |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Section header says "Plan's Files"
- [ ] Empty state microcopy mentions accepted changes
- [ ] Changing a change status to "Added to Plan" auto-promotes its attachments
- [ ] Auto-promoted docs show "From change: [title]"
- [ ] Change detail page has Upload/Link/Add Content buttons
- [ ] Text content can be added to changes
- [ ] Text attachments display correctly in inline change rows
- [ ] Old payloads still load through ensureShape()

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-15-change-log-files-attachments-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-15-change-log-files-attachments-response.md` |

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
- [x] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
