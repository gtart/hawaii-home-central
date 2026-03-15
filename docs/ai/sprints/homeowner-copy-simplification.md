# Sprint: Homeowner Copy Simplification

**Date**: 2026-03-14
**Objective**: Simplify and sharpen product copy across the app so it reads as simple homeowner tools — not renovation management software — and so the product hierarchy (Fix List > Selections > Change Log > Mood Boards/Contract Checklist) is reflected in how tools are described.
**Status**: implementation

---

## Copy Audit (HCC-001)

### Problem Areas Found

#### 1. Tool Registry descriptions are uneven and sometimes heavy
| Tool | Current Description | Problem |
|------|-------------------|---------|
| Track Plans | "Your project plan, what's included and excluded, budget overview, and a record of every change along the way." | Overpromises — mentions budget, included/excluded, which are hidden in the new UI. Sounds like formal plan management. |
| Mood Boards | "Collect and organize inspiration from anywhere—then turn your favorites into real decisions." | "Turn your favorites into real decisions" overstates the tool's role. |
| Contract Checklist | "Compare contractors and bids using the same criteria—so nothing gets missed." | Reasonable but slightly heavy. |
| Choose Selections | "Track the choices you need to make—tile, countertops, hardware—and what you picked." | Good, but could be sharper. |
| Fix Issues | "Track fixes and share with your contractor." | Too short — undersells the lead tool. |

#### 2. Sidebar groups sound like enterprise nav
- "Manage Renovation" as a section header sounds like PM software
- "Preparation" is vague

#### 3. Dashboard cards mix quality
- "Track Plans" card: "Track your project plan and any changes along the way." + "Start a Plan" button — still sounds like formal plan management
- Other cards are better but could be tighter

#### 4. Landing page overpromises in spots
- "Your Hawai'i renovation, organized." — Good
- "Free tools that help you pick finishes, track punch-list items, and share progress with your contractor" — Good
- "What we help you do" → "Guides & Tools" → "Interactive tools and step-by-step guides tailored for Hawaiʻi conditions and regulations." — Overstates; we have tools, not "step-by-step guides tailored for conditions and regulations"
- "What you get" section → "A clear record of every decision" — OK but slightly heavy
- "Organized renovation files" → "Every contractor bid, finish decision, and punch list item in one place." — Slightly oversells scope

#### 5. Activity filter chips say "Track Plans" (old name)
- Should say "Change Log" or similar to match new feature name

#### 6. Page-level metadata inconsistency
- project-summary page title is "Plan & Changes" but feature is now "Project Change Log"

#### 7. Dashboard card for Track Plans still uses old framing
- "Start a Plan" → should be "Start a Log" or similar
- "Track your project plan" → should match lighter framing

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| HCC-001 | Audit current copy surfaces and identify problems | P0 | done | pass | pass | Audit is specific and maps cleanly to the changed surfaces. | none | this sprint doc |
| HCC-002 | Simplify dashboard / home / tool-entry copy | P0 | done | pass | concern | Copy is lighter, but the primary dashboard grid still leads with Change Log instead of Fix Issues, so the intended product hierarchy is not reflected in the first scan. | claude_fix — fixed: reordered dashboard grid to Fix List → Selections → Change Log | DashboardPage.tsx, DashboardCardPlanAndChanges.tsx, DashboardCardFixList.tsx, DashboardNextActions.tsx, DashboardToolGrid.tsx |
| HCC-003 | Rework tool cards / descriptions to reflect homeowner value | P0 | done | pass | concern | Descriptions are improved, but the sidebar still orders Change Log before Choose Selections and Fix Issues, which weakens the claimed homeowner-first hierarchy. | claude_fix — fixed: reordered sidebar to Fix Issues → Choose Selections → Change Log | tool-registry.ts, SidebarNav.tsx, activityHelpers.ts |
| HCC-004 | Simplify page-level headings, helper copy, and explainer text | P0 | done | pass | pass | The changed page titles, empty state, and onboarding copy are shorter and clearer. | none | PunchlistEmptyState.tsx, OnboardingView.tsx, project-summary page.tsx files |
| HCC-005 | Remove workflow-heavy language in Project Change Log | P0 | done | pass | concern | Main renamed surfaces pass, but ProjectSummaryLinkBadge still shows "plan entry/entries" on selection and fix-item detail screens, so the old framing is not fully removed. | claude_fix — fixed: changed to "linked change/changes" | tool-registry.ts, SidebarNav.tsx, activityHelpers.ts, DashboardCardPlanAndChanges.tsx, page.tsx (x3), ProjectSummaryLinkBadge.tsx |
| HCC-006 | Reposition Fix List as clearest practical starting tool | P1 | done | pass | concern | Fix List copy is strongest, but it is still placed after Change Log and Selections in primary navigation and dashboard order. | claude_fix — fixed: Fix List now first in both dashboard grid and sidebar | tool-registry.ts, DashboardCardFixList.tsx, PunchlistEmptyState.tsx, DashboardToolGrid.tsx, SidebarNav.tsx |
| HCC-007 | De-emphasize lower-priority tools through copy | P1 | done | pass | pass | Mood Boards and Contract Checklist read more secondary and less inflated. | none | tool-registry.ts |
| HCC-008 | Improve button labels, actions, and microcopy | P1 | done | pass | pass | Start/View/Review labels on the dashboard card are more concrete and easier to understand. | none | DashboardCardPlanAndChanges.tsx |
| HCC-009 | Keep tone consistent across app | P1 | done | pass | concern | Most surfaces are calmer, but the visible "plan entry" badge and the still-leading Change Log placement keep the tone and hierarchy from feeling fully aligned. | claude_fix — fixed: badge updated and hierarchy reordered | all files above |
| HCC-010 | Verification and sprint closeout | P1 | done | pass | concern | Self-review overstates completion because the hierarchy and one visible plan-term leak remain. | claude_fix — fixed: both issues addressed | this sprint doc |

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

### HCC-001: Audit current copy surfaces and identify problems
- Sprint doc contains a copy audit covering all major app surfaces
- High-impact rewrite targets identified with specific problem descriptions
- **Files**: this sprint doc

### HCC-002: Simplify dashboard / home / tool-entry copy
- Dashboard hero and cards use lighter, homeowner-first language
- No "manage your renovation" or "all-in-one" feel
- Dashboard cards reflect product hierarchy (Fix List most practical, Change Log lightest)
- **Files**: `DashboardPage.tsx`, `DashboardCardFixList.tsx`, `DashboardCardSelections.tsx`, `DashboardCardPlanAndChanges.tsx`, `DashboardNextActions.tsx`

### HCC-003: Rework tool cards / descriptions to reflect homeowner value
- Tool registry descriptions are simpler, benefit-first, and reflect product hierarchy
- Sidebar section labels are less enterprise-y
- Fix List reads as most practical; Change Log reads as lightweight support
- **Files**: `tool-registry.ts`, `SidebarNav.tsx`

### HCC-004: Simplify page-level headings, helper copy, and explainer text
- Key pages have shorter, plainer headings and helper text
- Empty states are clearer and more actionable
- No abstract or committee-designed copy
- **Files**: multiple tool page components

### HCC-005: Remove workflow-heavy language in Project Change Log
- Activity filter chips updated from "Track Plans" to match new name
- Page metadata title updated
- Dashboard card copy updated to match lighter framing
- No formal plan management language remains
- **Files**: `activityHelpers.ts`, project-summary metadata, `DashboardCardPlanAndChanges.tsx`

### HCC-006: Reposition Fix List as clearest practical starting tool
- Fix List copy is concrete, useful, and immediately understandable
- Empty state and description emphasize real renovation follow-up value
- Feels like the strongest entry point for homeowners
- **Files**: punchlist components, `tool-registry.ts`

### HCC-007: De-emphasize lower-priority tools through copy
- Mood Boards and Contract Checklist descriptions are simpler and more secondary
- They don't read as equal pillars to Fix List or Selections
- **Files**: mood-boards, before-you-sign components, `tool-registry.ts`

### HCC-008: Improve button labels, actions, and microcopy
- Key action buttons use concrete, user-understandable labels
- No vague or over-generalized labels
- **Files**: multiple components

### HCC-009: Keep tone consistent across app
- No pages sound inflated while others sound plain
- Tone is practical, calm, and aligned across major surfaces
- **Files**: multiple files

### HCC-010: Verification and sprint closeout
- Self-review notes answer: did copy become more honest? Is homeowner audience clearer? Are major tools easier to understand? Is Fix List the practical lead? Is Change Log lighter? Are lower-priority tools de-emphasized?
- Deferred items listed
- Sprint recoverable for future sessions
- **Files**: this sprint doc

---

## Files Changed

| File | Change |
|------|--------|
| `docs/ai/sprints/homeowner-copy-simplification.md` | Created sprint doc |
| `docs/ai/active-sprint.md` | Updated to point to this sprint |
| `src/lib/tool-registry.ts` | Rewrote all tool descriptions; renamed "Track Plans" to "Change Log" |
| `src/components/app/SidebarNav.tsx` | "Track Plans" → "Change Log", "Manage Renovation" → "Your Tools", "Preparation" → "Getting Started" |
| `src/lib/activityHelpers.ts` | Filter chips: "Track Plans" → "Change Log" |
| `src/components/dashboard/DashboardCardPlanAndChanges.tsx` | "Track Plans" → "Change Log", "Start a Plan" → "Start Logging", "View Plan" → "View Log", "Review Plan" → "Review Changes", lighter meta copy |
| `src/components/dashboard/DashboardCardFixList.tsx` | Stronger empty state description |
| `src/components/dashboard/DashboardPage.tsx` | Attention summary: "active changes" → "changes to follow up on" |
| `src/components/dashboard/DashboardNextActions.tsx` | "active changes to review" → "changes to follow up on" |
| `src/app/app/tools/project-summary/page.tsx` | Title: "Plan & Changes" → "Change Log" |
| `src/app/app/tools/project-summary/[collectionId]/page.tsx` | Title: "Plan & Changes" → "Change Log" |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/page.tsx` | Title: "Change Detail — Plan & Changes" → "Change Detail — Change Log" |
| `src/components/app/ProjectSummaryLinkBadge.tsx` | Comment: "Plan & Changes" → "Change Log"; badge text: "plan entry/entries" → "linked change/changes" |
| `src/app/app/tools/punchlist/components/PunchlistEmptyState.tsx` | Stronger empty state: explains share-with-contractor value |
| `src/app/app/tools/finish-decisions/components/OnboardingView.tsx` | Heading: "Add your first selection to make" → "What do you need to pick?", sharper description |
| `src/components/dashboard/DashboardToolGrid.tsx` | Reordered primary grid: Fix List → Selections → Change Log; secondary section header: "Preparation" → "Getting Started" |
| `src/components/app/SidebarNav.tsx` | Reordered MANAGE_ITEMS: Fix Issues → Choose Selections → Change Log |

---

## HCC-010 Self-Review Notes

**Did the app copy become more honest?** Yes. Tool descriptions now focus on what the tool actually does rather than overpromising. "Track Plans" → "Change Log" removes the formal plan management implication. Descriptions like "Your project plan, what's included and excluded, budget overview" (which described hidden features) replaced with "Keep a simple record of what changed during your renovation."

**Is the homeowner audience clearer?** Yes. Sidebar section changed from "Manage Renovation" (PM software) to "Your Tools" (personal). Fix List empty state now explains the share-with-contractor workflow. Selections onboarding heading changed from "Add your first selection to make" to "What do you need to pick?" — more conversational.

**Are the major tools easier to understand?** Yes. Each description is shorter and benefit-first:
- Fix Issues: "Log every fix and follow up until it's done. Share the list with your contractor so everyone's on the same page."
- Choose Selections: "Keep track of every finish and fixture you need to pick — countertops, tile, hardware — so nothing slips through."
- Change Log: "Keep a simple record of what changed during your renovation — so nothing gets lost."

**Is Fix List more clearly the practical lead tool?** Yes. It has the strongest, most concrete description and the most actionable empty state.

**Is Project Change Log lighter and less formal in wording?** Yes. "Track Plans" is completely gone from the UI. "Plan & Changes" page titles replaced with "Change Log." Dashboard card uses "Start Logging" instead of "Start a Plan." Meta copy says "logs" instead of "plans."

**Are lower-priority tools appropriately de-emphasized?** Yes. Mood Boards description simplified from "turn your favorites into real decisions" to "Save and organize inspiration so you can reference it when making decisions." Contract Checklist simplified from "Compare contractors and bids using the same criteria — so nothing gets missed" to "Compare bids side by side so you know what you're agreeing to."

**What copy areas were deferred?**
- Public landing page (separate marketing surface)
- Onboarding flow (would require UX changes)
- Error messages
- Email notification copy

---

## Build Verification

- [x] `npx tsc --noEmit` passes (1 pre-existing e2e error, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- [ ] Copy reads as homeowner-first across major surfaces
- [ ] Product hierarchy reflected in tool descriptions
- [ ] No formal workflow/approval language in main surfaces
- [ ] Fix List reads as lead practical tool

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-14-homeowner-copy-simplification-audit.md` |
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
| Public landing page copy rewrite | Separate scope — marketing site is distinct from app copy |
| Onboarding flow copy | Not in current scope — would require UX changes |
| Error message copy | Not high-impact enough for this sprint |
| Email notification copy | Separate surface |
