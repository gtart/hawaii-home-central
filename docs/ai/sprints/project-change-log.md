# Sprint: Project Change Log (Homeowner Version)

**Date**: 2026-03-14
**Objective**: Convert the current Track Plans / Project Summary feature into a lighter, clearer, homeowner-first **Project Change Log** — reducing conceptual weight, improving file handling, making small changes easier to log, and avoiding the impression of formal change management.
**Status**: implementation

---

## Conversion Map (Current → New)

### Concepts Reused
| Current | New | Notes |
|---------|-----|-------|
| DocumentsSection (upload, current/outdated, detail panel) | **Latest Reference Files** | Keep upload infra, file detail panel, current/outdated toggle. Remove plan vs reference scope distinction — all files are reference files. Add category labels. |
| ChangesSection (change list, add form, status) | **Change Log** | Rename from "Change Orders" to "Change Log". Lighter entries. Add category + room/area fields. New 5-status model. |
| InlineEdit, StatusBadge, SectionHeader | Keep as-is | Reusable UI primitives |
| MilestoneTimeline | Keep (renamed "Activity") | Simplify event types |
| Comment system | Keep | Already clean |
| File upload infra (uploadProjectSummaryFile, FileDetailPanel) | Keep | Already solid |
| useProjectSummaryState core CRUD | Keep | Extend with category/room fields |

### Concepts Removed / De-emphasized
| Current | Action | Reason |
|---------|--------|--------|
| Plan lock/unlock/approve workflow | **Remove prominence** — keep data fields for backward compat but remove from primary UI | Too formal for homeowner tool |
| "Change Order" language | **Rename** → "Change" or "Change entry" | Too heavy |
| Incorporation (marking change as "Added to Plan") | **Remove from UI** | Workflow concept that doesn't fit |
| Proposed vs Final cost/schedule | **Remove from UI** — keep data fields | Over-structured |
| Contractor response field | **Remove from UI** | Future feature, not V1 |
| Open Questions as separate section | **Fold into change log** — changes with "Needs Confirmation" status serve this role | Reduces section count |
| LinkPills / AttachMenu / EntityPickerModal | **Remove from active UI** | Cross-tool linking is future scope |
| Plan Items (included/not included lists) | **Remove from active UI** | Legacy concept |
| Plan status bar prominence | **Replace** with simple project description | Too workflow-heavy |
| Budget calculations (baseline + changes) | **Simplify** — keep cost impact per change, remove budget section | Over-structured |

### Concepts Added
| New | Details |
|-----|---------|
| Change categories | Plan, Electrical, Plumbing, Cabinets, Appliances, Finish, Structural, Field Note, Scope, Pricing |
| Room / area field | Free-text field on change entries |
| 5-status model | Noted, Needs Confirmation, Confirmed, Completed, Superseded |
| Disclaimer copy | "This tool is for homeowner organization and reference only." |
| Page description | "Keep a simple record of what changed during your renovation." |

### Status Mapping (New UI → Storage)
| New UI Status | Storage Status | Color |
|---------------|---------------|-------|
| Noted | `requested` | blue |
| Needs Confirmation | `awaiting_homeowner` | amber |
| Confirmed | `approved_by_homeowner` | emerald |
| Completed | `done` | emerald (brighter) |
| Superseded | `closed` | neutral/gray |

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| PCL-001 | Inspect current implementation and map conversion plan | P0 | done | pass | pending | — | none | this sprint doc |
| PCL-002 | Reframe feature copy and mental model | P0 | done | pass | pending | — | none | ToolContent.tsx |
| PCL-003 | Simplify top-of-page hierarchy | P0 | done | pass | pending | — | none | ToolContent.tsx |
| PCL-004 | Restructure page around two primary zones | P0 | done | pass | pending | — | none | ToolContent.tsx, DocumentsSection.tsx, ChangesSection.tsx |
| PCL-005 | Improve Latest Reference Files UX | P0 | done | pass | pending | — | none | DocumentsSection.tsx |
| PCL-006 | Improve Change Log UX and scanning | P0 | done | pass | pending | — | none | ChangesSection.tsx, ChangeDetailContent.tsx, useProjectSummaryState.ts, data/project-summary.ts |
| PCL-007 | Clarify confirmation status (5-status model) | P1 | done | pass | pending | — | none | constants.ts, ChangesSection.tsx, ChangeDetailContent.tsx |
| PCL-008 | De-emphasize or remove V1 clutter | P1 | done | pass | pending | — | none | ToolContent.tsx, ChangeDetailContent.tsx |
| PCL-009 | Refine page surfaces and visual behavior | P1 | done | pass | pending | — | none | MilestoneTimeline.tsx, ToolContent.tsx |
| PCL-010 | Verification and sprint closeout | P1 | done | pass | pending | — | none | this sprint doc |

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

### PCL-001: Inspect current implementation and map conversion plan
- Sprint ledger includes a clear conversion map from current feature → new feature model
- Implementation is grounded in the real repo structure, not assumptions
- **Files**: this sprint doc

### PCL-002: Reframe feature copy and mental model
- Page title/description updated to Project Change Log language
- No "change order" language — use "change" or "entry"
- No "official plan" or "source of truth for scope" language
- Disclaimer copy present
- Positioning: "Keep a simple record of what changed during your renovation"
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`

### PCL-003: Simplify top-of-page hierarchy
- Lock/unlock/approve buttons removed from primary UI
- Plan status bar removed or replaced with simple project description
- Top of page is materially lighter — user reaches content faster
- No intervention dialogs on page load
- **Files**: `CurrentPlanSection.tsx`, `ToolContent.tsx`

### PCL-004: Restructure page around two primary zones
- Page reads as: (1) Latest Reference Files, (2) Change Log
- No section sprawl — supporting content organized under those two zones
- MilestoneTimeline moved to bottom or collapsed
- Page feels unified, not widget-like
- **Files**: `ToolContent.tsx`, `CurrentPlanSection.tsx`, `ChangesSection.tsx`, `DocumentsSection.tsx`

### PCL-005: Improve Latest Reference Files UX
- Documents section clearly labeled "Latest Reference Files"
- Remove plan vs reference scope distinction — all files are reference files
- Add document category display
- Current/outdated toggle retained
- File upload and detail panel work cleanly
- Clear separation from change-entry attachments
- **Files**: `DocumentsSection.tsx`, `constants.ts`

### PCL-006: Improve Change Log UX and scanning
- Change entries are summary-first (title, status, category, room visible at glance)
- Add form includes: title, notes, category dropdown, room/area, status
- Expanded detail stays light
- Mobile scanning is easy — entries don't take excessive vertical space
- Small changes feel natural to log
- **Files**: `ChangesSection.tsx`, `ChangeDetailContent.tsx`, `useProjectSummaryState.ts`

### PCL-007: Clarify confirmation status (5-status model)
- Statuses: Noted, Needs Confirmation, Confirmed, Completed, Superseded
- Mapped to existing storage statuses for backward compatibility
- Status display is clear but lightweight (no enterprise feel)
- **Files**: `constants.ts`, `ChangesSection.tsx`, `ChangeDetailContent.tsx`

### PCL-008: De-emphasize or remove V1 clutter
- Open Questions section removed from primary page (role served by "Needs Confirmation" status)
- LinkPills / AttachMenu / EntityPickerModal hidden from active UI
- Plan Items (included/not included) hidden
- Budget section removed from primary page
- Incorporated changes section removed
- Contractor response field hidden in detail view
- **Files**: `CurrentPlanSection.tsx`, `ChangeDetailContent.tsx`, `ToolContent.tsx`

### PCL-009: Refine page surfaces and visual behavior
- Cleaner section separation
- Better visual hierarchy between reference files and change log
- Improved contrast on interactive elements
- No large regressions elsewhere
- **Files**: all project-summary component files

### PCL-010: Verification and sprint closeout
- Self-review notes answer: is the feature lighter? does it read as homeowner tool? is file UX clearer? are changes easier to scan on mobile? does it avoid implying formal plan management?
- Deferred items explicitly listed
- Sprint recoverable for future sessions
- **Files**: this sprint doc

---

## Sprint Phases

### Phase 1 — Product reframe + page structure
- PCL-001 (conversion map — done)
- PCL-002 (copy and mental model)
- PCL-003 (top-of-page simplification)
- PCL-004 (two-zone restructure)

### Phase 2 — Core UX improvements
- PCL-005 (reference files UX)
- PCL-006 (change log UX)
- PCL-007 (5-status model)

### Phase 3 — Cleanup + polish
- PCL-008 (remove clutter)
- PCL-009 (visual refinement)
- PCL-010 (verification)

---

## Files Changed

| File | Change |
|------|--------|
| `docs/ai/sprints/project-change-log.md` | Created sprint doc |
| `docs/ai/active-sprint.md` | Updated to point to this sprint |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Rewritten: title/description/copy to "Project Change Log", removed CurrentPlanSection, added inline project description, disclaimer, two-zone layout |
| `src/app/app/tools/project-summary/constants.ts` | Added 5-status model (ChangeLogStatus, CHANGE_LOG_STATUS_CONFIG, toChangeLogStatus), change categories |
| `src/app/app/tools/project-summary/components/DocumentsSection.tsx` | Rewritten: standalone "Latest Reference Files" section, removed plan vs reference scope, removed inline prop |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Rewritten: "Change Log" with category dropdown, room/area field, 5-status dropdown, simplified cost impact |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | Rewritten: 5-status model, category/room fields, removed incorporation/open questions/proposed vs final |
| `src/app/app/tools/project-summary/useProjectSummaryState.ts` | Extended addChange to accept category and room |
| `src/data/project-summary.ts` | Added category and room fields to SummaryChange, updated coerceChange |
| `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` | Renamed header from "Changelog" to "Activity" |
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Fixed type error (dead code — no longer imported by ToolContent) |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Page reads as Project Change Log, not formal plan management
- [ ] Reference files section is clear and usable
- [ ] Change log entries are easy to scan
- [ ] Small changes feel first-class
- [ ] No formal approval language visible
- [ ] Disclaimer copy present

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | — |
| Claude Response | — |

---

## Scope Change Log

| Date | Issue | Classification | Reason |
|------|-------|---------------|--------|
| — | — | — | — |

---

## PCL-010 Self-Review Notes

**Is the feature lighter?** Yes. Removed plan lock/unlock/approve workflow, incorporation dialog, open questions section, budget calculations, proposed vs final cost/schedule, contractor response field, and plan items. The page now has two clear zones instead of the previous multi-section layout.

**Does it read as a homeowner tool?** Yes. All "change order" language replaced with "change log" / "log a change". No formal approval language. Disclaimer explicitly states this is for organization and reference only. Description reads: "Keep a simple record of what changed during your renovation."

**Is file UX clearer?** Yes. Documents section is now standalone "Latest Reference Files" with current/outdated split. Removed the plan vs reference scope distinction — all files are reference files. Upload button is prominent with sandstone accent.

**Are changes easier to scan on mobile?** Yes. Change entries show title, status, category, and room at a glance. The add form is streamlined (title, notes, category, room). 5-status model (Noted → Needs Confirmation → Confirmed → Completed → Superseded) is more intuitive than the previous 3-status model.

**Does it avoid implying formal plan management?** Yes. No lock/unlock buttons, no approval workflow, no "change order" language, no "source of truth for scope" framing. The tool positions itself as an organization aid, not a contract document.

**Backward compatibility:** All changes preserve existing data. New category and room fields are optional. Storage statuses unchanged — 5 UI statuses map to the existing 6 storage statuses via `toChangeLogStatus()`. Legacy `SimpleChangeStatus` constants retained for any code paths that reference them.

**Dead code note:** `CurrentPlanSection.tsx` is no longer imported by `ToolContent.tsx` but remains in the repo. Type error was fixed (removed stale props) so it compiles, but it could be deleted in a future cleanup.

---

## Sprint Closure Checklist

- [ ] Every in-scope issue is `done` or explicitly moved out
- [ ] Every completed issue: `Claude Verified: pass`
- [ ] Every completed issue: `Codex Verified: pass`
- [ ] Every issue's `Follow-up` is explicit
- [ ] Build/typecheck recorded
- [ ] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`

---

## Deferred Items

| Item | Reason |
|------|--------|
| Read-only share | Future — not V1 |
| Comment threads on changes | Already exists but not core to this sprint |
| Contractor confirmations / acknowledgments | Future — not V1 |
| Cross-tool linking (LinkPills, EntityPicker) | Data preserved, UI hidden — re-enable when needed |
| Budget calculations | Data preserved, UI removed — can rebuild if needed |
| Plan Items (included/not included) | Data preserved, UI hidden |
| Proposed vs Final cost/schedule | Data preserved, UI hidden |
