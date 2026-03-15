# Sprint: Homeowner Copy Correction — Marketing + App Surfaces

**Date**: 2026-03-14
**Objective**: Revise copy across marketing and app surfaces so the product sounds like a practical homeowner organizer — not renovation management software. Narrow the promise, soften inflated claims, and make the Change Log feel like a lightweight record tool.
**Status**: ready_for_codex

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| HCR-001 | Audit target copy surfaces | P0 | done | pass | pending | — | — | — |
| HCR-002 | Revise non-auth marketing copy | P0 | done | pass | pending | — | — | page.tsx, HeroSection.tsx, WhatYouGetSection.tsx, ToolPreviewCards.tsx |
| HCR-003 | Revise shared tool descriptions and auth dashboard/helper copy | P0 | done | pass | pending | — | — | tool-registry.ts, ToolGrid.tsx, DashboardView.tsx, SidebarNav.tsx, MobileBottomNav.tsx, activityHelpers.ts, dashboard cards, tool page headers |
| HCR-004 | Revise Change Log feature copy | P0 | done | pass | pending | — | — | ToolContent.tsx, CurrentPlanSection.tsx |
| HCR-005 | Consistency pass and sprint verification | P1 | done | pass | pending | — | — | 20+ files — all tool labels, page metadata, descriptions aligned |

### Status values
- `todo`, `in_progress`, `blocked`, `done`, `needs_followup`

### Claude Verified values
- `pending`, `pass`, `fail`

### Codex Verified values
- `pending`, `pass`, `concern`, `fail`

### Follow-up values
- `none`, `claude_fix`, `new_issue`, `deferred`

---

## Copy Audit (HCR-001)

All "before" strings from the sprint specification match the actual current code exactly. No drift detected.

### What's overpromising / too broad / too workflow-heavy

**Marketing surfaces:**
- "Tools for every part of a Hawaiʻi renovation" — too broad, implies complete platform
- "lock decisions" — too formal/workflow
- "Each one solves a specific headache" — salesy
- "track every punch-list item so nothing stalls the schedule" — overpromises
- "send a read-only link" — collaboration feature framing too prominent
- "Confidence before you sign" / "know exactly what you are agreeing to" — inflated claim
- "Walk through each bid against the same checklist—so nothing gets missed and you sign with confidence" — too bold
- "Always know what's decided, what's next, and what's blocking" — enterprise-ish workflow language
- "Track fixes and punch list items in real time" — "real time" is overselling

**App surfaces:**
- "Compare bids and avoid gotchas" — slightly salesy
- "Choose finishes by room" — sounds like workflow instruction
- "Fix Issues" sidebar label — less clear than "Fix List"
- "Choose Selections" — too verb-heavy for a nav label
- "Contract Checklist" — consider "Bid Checklist" for simplicity

**Change Log feature:**
- "formal change order" — too construction-document
- "protect the agreed-upon scope" — too formal
- "Unlock & Correct Plan" — heavy language
- "Log a formal amendment" — enterprise wording
- "Start building your plan" / "lock it to keep it as your source of truth" — plan-management mental model
- "corrections are handled by unlocking, and new scope changes are tracked as change orders" — workflow-heavy

---

## Acceptance Criteria

### HCR-002: Revise non-auth marketing copy
- Tools page metadata: "Simple homeowner tools for keeping track of..."
- Tools page intro: "Simple tools to help you stay organized..."
- Tools page supporting line: "Start with the tool that matches the problem..."
- Hero subheadline: "Free tools and guidance to help you keep track of..."
- All 3 benefit bullets revised to grounded, non-inflated versions
- WhatYouGetSection: "Better bid comparisons" heading, concrete description
- ToolPreviewCards: stage subtitle, all 4 tool descriptions revised
- **Files**: `src/app/tools/page.tsx`, `src/components/home/HeroSection.tsx`, `src/components/home/WhatYouGetSection.tsx`, `src/app/tools/ToolPreviewCards.tsx`

### HCR-003: Revise shared tool descriptions and auth dashboard/helper copy
- tool-registry.ts: all 4 visible tool titles renamed + descriptions revised
  - `Fix Issues` → `Fix List`
  - `Choose Selections` → `Selections`
  - `Contract Checklist` → `Bid Checklist`
  - Change Log description revised
- ToolGrid.tsx + DashboardView.tsx: HELPER_COPY aligned (4 strings each)
- SidebarNav.tsx: labels match new tool names
- MobileBottomNav.tsx: labels match new tool names
- activityHelpers.ts: FILTER_CHIPS labels match new tool names
- Dashboard cards renamed: DashboardCardFixList → "Fix List", DashboardCardSelections → "Selections", DashboardCardContractChecklist → "Bid Checklist"
- Tool page headers and metadata updated in:
  - `src/app/app/tools/punchlist/page.tsx` + `ToolContent.tsx`: title → "Fix List", description revised
  - `src/app/app/tools/finish-decisions/page.tsx` + `ToolContent.tsx`: title → "Selections", description revised
  - `src/app/app/tools/before-you-sign/page.tsx` + `BeforeYouSignContent.tsx`: title → "Bid Checklist", description revised
  - `src/app/app/tools/before-you-sign/report/page.tsx` + `[collectionId]/report/page.tsx` + `BeforeYouSignReport.tsx`: report title → "Bid Checklist Report"
- Data files: `src/data/renovation-stages.ts` tool references → "Bid Checklist"
- Resource pages: `src/app/resources/renovation-stages/page.tsx` card title/description updated
- **Primary files**: `src/lib/tool-registry.ts`, `src/components/app/ToolGrid.tsx`, `src/components/app/DashboardView.tsx`, `src/components/app/SidebarNav.tsx`
- **Consistency files**: `src/components/app/MobileBottomNav.tsx`, `src/lib/activityHelpers.ts`, `src/components/dashboard/DashboardCardFixList.tsx`, `src/components/dashboard/DashboardCardSelections.tsx`, `src/components/dashboard/DashboardCardContractChecklist.tsx`, `src/app/app/tools/punchlist/ToolContent.tsx`, `src/app/app/tools/punchlist/page.tsx`, `src/app/app/tools/finish-decisions/ToolContent.tsx`, `src/app/app/tools/finish-decisions/page.tsx`, `src/app/app/tools/before-you-sign/BeforeYouSignContent.tsx`, `src/app/app/tools/before-you-sign/page.tsx`, `src/app/app/tools/before-you-sign/report/page.tsx`, `src/app/app/tools/before-you-sign/[collectionId]/report/page.tsx`, `src/app/app/tools/before-you-sign/report/BeforeYouSignReport.tsx`, `src/data/renovation-stages.ts`, `src/app/resources/renovation-stages/page.tsx`

### HCR-004: Revise Change Log feature copy
- ToolContent.tsx description and disclaimer revised
- CurrentPlanSection.tsx: intervention body, buttons, help text, draft guidance, draft checklist, guidance footer all revised
- **Files**: `src/app/app/tools/project-summary/ToolContent.tsx`, `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx`

### HCR-005: Consistency pass and sprint verification
- No remaining references to old tool names ("Fix Issues", "Choose Selections", "Contract Checklist") in user-facing UI across the files listed in HCR-003
- Product sounds narrower and more honest
- Homepage/tools page no longer overpromise
- Fix List reads as practical lead tool
- Selections reads as organized decision support
- Change Log reads as lightweight homeowner record
- Sidebar/dashboard/helper copy coherent
- Build passes
- **Known deferred**: Playbook body prose (`fair-bid-checklist/PlaybookContent.tsx`, `responsibility-matrix/PlaybookContent.tsx`) still say "Contract Checklist" — editorial review needed
- **Known deferred**: `CLAUDE.md` tool names table references old names
- **Files**: all files listed in HCR-002, HCR-003, and HCR-004

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/tools/page.tsx` | Metadata, intro, supporting line revised — narrower, more practical |
| `src/components/home/HeroSection.tsx` | Hero subheadline + 3 benefit bullets — grounded, non-inflated |
| `src/components/home/WhatYouGetSection.tsx` | "Confidence before you sign" → "Better bid comparisons" |
| `src/app/tools/ToolPreviewCards.tsx` | Stage subtitle, all 4 tool descriptions + title "Contract Checklist" → "Bid Checklist" |
| `src/lib/tool-registry.ts` | All tool titles renamed (Fix List, Selections, Bid Checklist) + descriptions revised |
| `src/components/app/ToolGrid.tsx` | HELPER_COPY aligned to new style |
| `src/components/app/DashboardView.tsx` | HELPER_COPY aligned to new style |
| `src/components/app/SidebarNav.tsx` | Labels: Fix List, Selections, Bid Checklist |
| `src/components/app/MobileBottomNav.tsx` | Labels aligned with sidebar |
| `src/lib/activityHelpers.ts` | FILTER_CHIPS labels aligned |
| `src/components/dashboard/DashboardCardFixList.tsx` | "Fix Issues" → "Fix List" |
| `src/components/dashboard/DashboardCardSelections.tsx` | "Choose Selections" → "Selections" |
| `src/components/dashboard/DashboardCardContractChecklist.tsx` | "Contract Checklist" → "Bid Checklist" |
| `src/app/app/tools/punchlist/ToolContent.tsx` | Header title/eyebrow/description revised |
| `src/app/app/tools/punchlist/page.tsx` | Metadata title → "Fix List" |
| `src/app/app/tools/finish-decisions/page.tsx` | Metadata title → "Selections" |
| `src/app/app/tools/finish-decisions/ToolContent.tsx` | Header title/eyebrow/description revised |
| `src/app/app/tools/before-you-sign/page.tsx` | Metadata title → "Bid Checklist" |
| `src/app/app/tools/before-you-sign/BeforeYouSignContent.tsx` | Header title/eyebrow/description revised |
| `src/app/app/tools/before-you-sign/report/*.tsx` | Report titles → "Bid Checklist Report" |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Description and disclaimer revised |
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Intervention, buttons, draft guidance — lighter homeowner record model |
| `src/data/renovation-stages.ts` | Tool references → "Bid Checklist" |
| `src/app/resources/renovation-stages/page.tsx` | Card title/description updated |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Marketing pages read as practical homeowner tools, not renovation platform
- [ ] App surfaces are consistent with marketing tone
- [ ] Change Log no longer implies formal plan management

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
| Playbook body text: `fair-bid-checklist/PlaybookContent.tsx` and `responsibility-matrix/PlaybookContent.tsx` still say "Contract Checklist" in guide prose | These are educational content pages where "Contract Checklist" appears in explanatory text. Renaming in guide prose requires editorial review — deferred. |
| CLAUDE.md tool names table | Documentation references old names — should be updated separately |
