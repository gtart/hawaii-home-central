# Homeowner Homepage Design Sprint

**Date:** 2026-03-12
**Goal:** Refactor the authenticated homeowner homepage from a tool-first dashboard into a homeowner-first command center.

**Target feel:** "I immediately understand my renovation and what needs my attention."

---

## Issue Tracker

| ID | Title | Status |
|----|-------|--------|
| HHP-001 | Homepage purpose: tool-first → action-first | done |
| HHP-002 | Strengthen hero/top section | done |
| HHP-003 | Audit and rewrite homepage copy | done |
| HHP-004 | Remove weak metrics from cards | done |
| HHP-005 | Refactor card content hierarchy | done |
| HHP-006 | Demote secondary tools | done |
| HHP-007 | Replace "Getting started" section framing | done |
| HHP-008 | Improve visual hierarchy and contrast | done |
| HHP-009 | Review naming for homeowner-natural language | done |
| HHP-010 | Clarify Quick Capture / Inbox / Activity | done |
| HHP-011 | Review activity badge noise | done |
| HHP-012 | Align left nav with homepage framing | done |
| HHP-013 | Demote non-live items (Find Pros) | done |
| HHP-014 | Support varied project maturity states | done |

---

## Files Changed

| File | What Changed |
|------|-------------|
| `src/components/dashboard/DashboardPage.tsx` | Hero redesign: attention summary replaces "at a glance", action row simplified, QuietBanner removed |
| `src/components/dashboard/DashboardToolGrid.tsx` | Removed "Manage Renovation" header from primary cards, secondary tools in 2-col "Preparation" section, ProDirectory removed |
| `src/components/dashboard/DashboardNextActions.tsx` | Renamed "Next up" → "Needs attention", added Plan & Changes actions, improved copy |
| `src/components/dashboard/DashboardCardPlanAndChanges.tsx` | Cleaner 3-state card, removed ShareMetaLine, improved empty/active copy |
| `src/components/dashboard/DashboardCardSelections.tsx` | Removed "total" counter, removed ShareMetaLine/activity rows, cleaner copy |
| `src/components/dashboard/DashboardCardFixList.tsx` | Removed ShareMetaLine/activity rows, "urgent" label for high-priority, cleaner copy |
| `src/components/dashboard/DashboardCardMoodBoards.tsx` | Compact secondary card (single row), only shown if boards exist |
| `src/components/dashboard/DashboardCardContractChecklist.tsx` | Compact secondary card (single row), only shown if checklists exist |
| `src/components/app/SidebarNav.tsx` | "Getting Started" → "Preparation" to match homepage |

---

## Verification

### HHP-001 — Homepage purpose: tool-first → action-first
Hero now shows data-derived attention summary ("3 selections to decide · 1 active change"). "Needs attention" section shows prioritized next actions. Cards are secondary to the attention signals.

### HHP-002 — Strengthen hero/top section
Project name as H1 (fallback: "My Renovation" instead of "Dashboard"). Subtitle dynamically shows what needs attention, or "Nothing needs your attention right now" when quiet.

### HHP-003 — Audit and rewrite homepage copy
- "Your renovation at a glance" → dynamic attention summary
- "Quick Capture / Capture now, sort later" → just "Capture" (+ icon)
- "Next up" → "Needs attention"
- "Just getting started? You may want to do these first…" → "Preparation"
- Card titles: removed uppercase tracking labels, replaced with `font-medium text-cream/60`
- Empty states: action-oriented descriptions ("Track your project plan..." not "No plan yet.")
- "All caught up" states: simpler ("All issues resolved", "All 5 decided")

### HHP-004 — Remove weak metrics from cards
- Removed "total" counter from Selections header
- Removed ShareMetaLine from all cards (sharing metadata is tool-level detail, not dashboard-level)
- Removed inline activity event rows from Selections and Fix List cards
- Removed "Needs review: [list name]" link from Fix List card
- Plan & Changes: removed plan count, just shows active changes or total changes

### HHP-005 — Refactor card content hierarchy
Cards now follow: **title → big number + label → status line → timestamp → CTA**. Removed inline activity rows, extra counters, and share metadata that broke scanning flow.

### HHP-006 — Demote secondary tools
Mood Boards and Contract Checklist are now compact single-row cards in a 2-column "Preparation" section below primary cards. Only shown when user has created content.

### HHP-007 — Replace "Getting started" section framing
"Just getting started? You may want to do these first…" → "Preparation". Works for any project stage.

### HHP-008 — Improve visual hierarchy and contrast
- Card titles: `text-sm font-medium text-cream/60` (was `text-sm uppercase tracking-wider text-cream/40`)
- Action items: `text-cream/60` (was `text-cream/50`)
- Attention bullets: `w-1.5 h-1.5` (was `w-1 h-1`)
- Capture button: single clean icon (+), no confusing double-icon
- Inbox/Activity: ghost-style buttons (no border/bg) so Capture is clearly primary
- "Needs attention" label: `text-cream/30` (subtle, doesn't compete)

### HHP-009 — Review naming for homeowner-natural language
- "Dashboard" fallback → "My Renovation"
- Card titles: "Plan & Changes", "Selections", "Fix List" (no action verbs — those belong on CTAs)
- Empty states use descriptive phrases: "Track finishes, fixtures, and materials you need to pick"
- "high" badge → "urgent" (more homeowner-natural)

### HHP-010 — Clarify Quick Capture / Inbox / Activity hierarchy
- Capture: primary sandstone button with + icon, clear visual priority
- Inbox/Activity: ghost text-only buttons, secondary to Capture
- Removed double document+image icon combo, replaced with single + icon
- Removed "Capture now, sort later" subtext

### HHP-011 — Review activity badge noise
- Activity count badge (number) replaced with a simple dot indicator (sandstone)
- Dot says "there's something new" without demanding attention with a number
- Inbox keeps numeric badge (actionable count is meaningful there)

### HHP-012 — Align left nav with homepage framing
- "Getting Started" → "Preparation" in sidebar, matching homepage section label
- Section label contrast: `text-cream/30` to match homepage approach

### HHP-013 — Demote non-live items (Find Pros)
- DashboardCardProDirectory removed from homepage entirely
- Find Pros remains in sidebar as disabled "Soon" item (already demoted to cream/20)
- No placeholder/coming-soon card taking up prime homepage real estate

### HHP-014 — Support varied project maturity states
- Hero adapts: shows relevant attention items regardless of project stage
- Empty state: "Everything looks good" (not stage-specific)
- Quiet state: "Nothing needs your attention right now" (valid at any stage)
- Cards: empty states have stage-appropriate descriptions
- Secondary section only appears when user has content (not misleading for new users)
- "Needs attention" section derives from actual data, not assumptions about stage

### Build Verification
- `npx tsc --noEmit` — passes
- `npm run build` — passes
- No broken imports (QuietBanner removed from DashboardPage, ProDirectory removed from grid)
