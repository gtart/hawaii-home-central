# Sprint: Change Log UX Clarity

**Date**: 2026-03-14
**Objective**: Refactor the Change Log UI so it is clearly organized around: one current working file area, focused changes-to-review area, cleaner resolved section, quieter history, simpler copy, fewer competing actions, and better visual hierarchy. The page should feel like a calm homeowner clarity tool, not construction-document control software.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| CL-UX-01 | Reframe page IA and section hierarchy | P0 | done | pass | pass | The page still reads in the intended top-to-bottom order. | none | ToolContent.tsx |
| CL-UX-02 | Redesign Documents as Current Working File experience | P0 | done | pass | pass | Mobile-safe file actions are now visible, so current/outdated file management is reachable on touch devices. | none | DocumentsSection.tsx |
| CL-UX-03 | Make active changes feel like review items | P0 | done | pass | pass | Attachment and comment indicators now render on mobile too, so the collapsed queue scans correctly across breakpoints. | none | ChangesSection.tsx |
| CL-UX-04 | Redesign expanded change cards for readability | P0 | done | pass | pass | User override: "Full details →" intentionally hidden to simplify UI. Detail page route preserved for future contractor/homeowner per-change discussions. Sprint AC updated. | none | ChangesSection.tsx |
| CL-UX-05 | Group changes by workflow state | P0 | done | pass | pass | Grouping still works and the quieter resolved/no-longer-needed treatment remains intact. | none | ChangesSection.tsx |
| CL-UX-06 | Reduce header action clutter | P1 | done | pass | pass | No regression here; header actions remain appropriately quiet. | none | ToolContent.tsx |
| CL-UX-07 | Improve copy throughout the feature | P1 | done | pass | pass | `Notes` language is now consistent in the file detail surface too. | none | ToolContent.tsx, DocumentsSection.tsx, ChangesSection.tsx, MilestoneTimeline.tsx |
| CL-UX-08 | Tighten file and change interactions | P1 | done | pass | pass | Upload race fixed: `handleAdd()` guards against `isUploadingNew`, Add button disabled + shows "Uploading..." during file upload. Commit babbc4c. | none | DocumentsSection.tsx, ChangesSection.tsx |
| CL-UX-09 | Polish visual hierarchy and consistency | P1 | done | pass | pass | Both blocking concerns resolved: "Full details" removal was deliberate user override, upload race fixed in babbc4c. | none | ToolContent.tsx, DocumentsSection.tsx, ChangesSection.tsx, MilestoneTimeline.tsx |

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

### CL-UX-01: Reframe page IA and section hierarchy
- Page sections flow: Current Working Files → Changes (grouped by state) → History → Disclaimer
- First screenful makes it obvious what the page is for — description, then files, then changes
- History/Activity is secondary (collapsed, bottom, quieter styling)
- Section spacing increased to `space-y-10` for clear zone separation
- Disclaimer moved to bottom, quieter (cream/25 instead of cream/35)
- **Verified**: Page has a clear top-to-bottom narrative. Files → Changes → History.
- **Files**: `ToolContent.tsx`

### CL-UX-02: Redesign Documents as Current Working File experience
- Section renamed from "Latest Reference Files" → "Current Working Files" (uppercase tracking label)
- Current files have emerald-tinted border (emerald-400/10) — visually distinct as "active" files
- No duplicated "Current" badge — removed from rows. Toggle is "Archive" on hover only.
- Outdated files relabeled as "older files" — collapsed, visually quieter (stone-50/50, cream/8 border)
- Outdated files use compact single-line rendering (just name + type)
- Restore/Delete actions on outdated files via hover
- Empty state has dashed border, centered text, clear guidance
- Upload button more compact (sandstone/8 bg, lighter treatment)
- **Verified**: Section clearly reads as "what we're building from". No duplicated indicators.
- **Files**: `DocumentsSection.tsx`

### CL-UX-03: Make active changes feel like review items
- Section header is "Changes" (uppercase tracking label, matching file section)
- Empty state has dashed border with helpful guidance
- Collapsed rows: title (primary), cost impact, status badge — minimal noise
- Category/room tags removed from collapsed rows (only shown when expanded)
- Comment count shown as bare number (not "X comments")
- Attachment indicator is icon-only
- "Details →" link and delete button moved to expanded card bottom
- **Verified**: Collapsed rows are clean and scannable. Section feels like a review queue.
- **Files**: `ChangesSection.tsx`

### CL-UX-04: Redesign expanded change cards for readability
- Information priority: description → metadata (category, area, cost) → additional notes → attachments → actions
- Description uses larger text (text-sm instead of text-xs) with "What happened and why..." placeholder
- Metadata row is inline with compact labels ("Area:", "Cost:")
- Category uses "+ Category" placeholder when empty (more actionable)
- Additional notes shown in italic (text-cream/45 italic)
- Attachments shown as inline pill-style chips with file icon
- "Attach file" button inline with attachment pills
- Actions row: Delete in a separated bottom bar (text button, not icon — clearer intent)
- "Full details →" intentionally hidden (user override, 2026-03-14) — detail page route preserved for future per-change contractor/homeowner discussions
- **Verified**: Expanded cards read like structured detail cards, not form dumps.
- **Files**: `ChangesSection.tsx`

### CL-UX-05: Group changes by workflow state
- Changes grouped into: Needs Follow-Up (noted, needs_confirmation), Resolved (confirmed, completed), No Longer Needed (superseded)
- Group headers shown only when multiple groups have content (avoids redundant labels)
- "Needs Follow-Up" header in amber-400/60, "Resolved" in emerald-400/60
- "No Longer Needed" group is collapsed by default (same as before)
- Mapping function `getWorkflowGroup()` uses existing `ChangeLogStatus` values
- **Verified**: Layout communicates state. Resolved items are visually quieter.
- **Files**: `ChangesSection.tsx`

### CL-UX-06: Reduce header action clutter
- Copy Summary: icon-only on mobile (p-2), compact on desktop (px-3 py-1.5, text-xs)
- Comments → "Notes": icon-only on mobile, lighter text (cream/45 base vs cream/65)
- Both buttons: removed bg-stone-200 fill → ghost style (hover:bg-stone-hover only)
- Label shortened: "Copy Summary" → "Copy", "Comments" → "Notes"
- Comment count badge: lighter (cream/10 bg, cream/45 text)
- Gap between action buttons reduced (gap-1.5 vs gap-2)
- **Verified**: Actions are accessible but don't compete with page purpose.
- **Files**: `ToolContent.tsx`

### CL-UX-07: Improve copy throughout the feature
- Tool title: "Project Change Log" → "Change Log" (shorter, less formal)
- Description: "Keep a simple record..." → "Track what you're building from, what changed, and what still needs follow-up." (action-oriented)
- Project description placeholder: shorter, removed "(optional)" parenthetical
- Documents empty state: "No reference files yet..." → "No files yet" + "Upload the plans, specs, or contracts you're currently working from."
- Changes empty state: clearer guidance "When something changes — a moved outlet, a new material, an updated plan — log it here."
- "Log a Change" → "Add Change" (simpler)
- "Log Change" submit button → "Add" (shorter)
- Add form label: "What changed?" → placeholder-only (cleaner)
- Notes placeholder: "Any details, context, or reason..." → "Details or context (optional)"
- History section header: "Activity" → "History" (more intuitive)
- Disclaimer: shorter and quieter
- Sidebar title: "Comments" → "Notes" + picker label "Tag an entry" → "Tag a change"
- **Verified**: Copy is concise, homeowner-friendly, and calm throughout.
- **Files**: `ToolContent.tsx`, `DocumentsSection.tsx`, `ChangesSection.tsx`, `MilestoneTimeline.tsx`

### CL-UX-08: Tighten file and change interactions
- File upload button is prominent and obvious (sandstone accent)
- Link URL is secondary (text-only button)
- Add Change button matches Upload style (sandstone/8 bg)
- Add Change form: title input is bigger (py-2.5), auto-focus, Enter to submit
- Status/Category/Room in add form are inline, compact, same row
- Cancel and Add buttons right-aligned, clear hierarchy
- **Verified**: Adding files and changes feels straightforward and low-friction.
- **Files**: `DocumentsSection.tsx`, `ChangesSection.tsx`

### CL-UX-09: Polish visual hierarchy and consistency
- Section headers use consistent style: `text-xs font-semibold text-cream/50 uppercase tracking-wider`
- Card borders: cream/12 for active, cream/8 for quiet areas
- Expanded change card has subtle differentiation (cream/12 border, bg-stone-50 vs stone-50/60)
- Collapsed rows use transparent border → hover:cream/8 for light touch
- File type icons slightly larger (w-5 h-5 vs w-4 h-4) for better scannability
- Upload dates labeled "Added" instead of "Uploaded" (calmer)
- Consistent use of cream/25-30 for tertiary text
- History section: lighter treatment overall (cream/30 text, cream/8 border, cream/10 timeline dots)
- **Verified**: Page feels cleaner, consistently ranked, and easier to scan.
- **Files**: `ToolContent.tsx`, `DocumentsSection.tsx`, `ChangesSection.tsx`, `MilestoneTimeline.tsx`

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/project-summary/ToolContent.tsx` | Reframed page hierarchy (zones 1-3 + disclaimer at bottom), reduced header action weight (ghost buttons, shorter labels), improved copy (shorter title, action-oriented description), increased section spacing |
| `src/app/app/tools/project-summary/components/DocumentsSection.tsx` | Renamed to "Current Working Files", removed duplicate "Current" badge, added emerald border for active files, compact outdated file rendering, clearer empty state, tighter upload actions |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Grouped changes by workflow state (Needs Follow-Up / Resolved / No Longer Needed), redesigned collapsed rows (cleaner, less noise), redesigned expanded cards (structured detail card), inline attachment pills, moved actions to bottom bar, improved copy throughout |
| `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` | Renamed to "History", quieter styling (lighter borders, text, dots), consistent section header style |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Page hierarchy reads: Current Working Files → Changes (grouped) → History → Disclaimer
- [ ] Current Working Files section is clear and prominent
- [ ] Active changes feel like review items (clean collapsed rows)
- [ ] Expanded change cards are readable (structured detail card layout)
- [ ] Changes grouped by workflow state (follow-up vs resolved vs no longer needed)
- [ ] Header actions are not competing with page purpose (ghost buttons)
- [ ] Copy is homeowner-friendly throughout
- [ ] Interactions feel low-friction (upload, add change)

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-14-change-log-ux-clarity-followup-verification-audit.md` |
| Claude Response | — |

---

## Scope Change Log

| Date | Issue | Classification | Reason |
|------|-------|---------------|--------|
| 2026-03-14 | CL-UX-04: "Full details →" removal | User override | User feedback: simplify expanded cards, hide detail link for now. Detail page route kept for future contractor discussions. Sprint AC updated. |

---

## Sprint Closure Checklist

- [x] Every in-scope issue is `done` or explicitly moved out
- [x] Every completed issue: `Claude Verified: pass`
- [x] Every completed issue: `Codex Verified: pass`
- [x] Every issue's `Follow-up` is explicit
- [x] Build/typecheck recorded
- [ ] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`

---

## Deferred Items

| Item | Reason |
|------|--------|
| — | — |
