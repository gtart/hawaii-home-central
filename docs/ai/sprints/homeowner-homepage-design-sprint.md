# Homeowner Homepage Design Sprint

**Date:** 2026-03-13
**Commit:** `6076c0a`
**Goal:** Refactor the authenticated homeowner homepage from a tool-first dashboard into a homeowner-first command center.

**Target feel:** "I immediately understand my renovation and what needs my attention."

---

## Issue Tracker

| ID | Title | Status | Claude Verified | Codex Verified |
|----|-------|--------|-----------------|----------------|
| HHP-001 | Homepage purpose: tool-first → action-first | done | yes | pending |
| HHP-002 | Strengthen hero/top section | done | yes | pending |
| HHP-003 | Audit and rewrite homepage copy | done | yes | pending |
| HHP-004 | Remove weak metrics from cards | done | yes | pending |
| HHP-005 | Refactor card content hierarchy | done | yes | pending |
| HHP-006 | Demote secondary tools | done | yes | pending |
| HHP-007 | Replace "Getting started" section framing | done | yes | pending |
| HHP-008 | Improve visual hierarchy and contrast | done | yes | pending |
| HHP-009 | Review naming for homeowner-natural language | done | yes | pending |
| HHP-010 | Clarify Quick Capture / Inbox / Activity | done | yes | pending |
| HHP-011 | Review activity badge noise | done | yes | pending |
| HHP-012 | Align left nav with homepage framing | done | yes | pending |
| HHP-013 | Demote non-live items (Find Pros) | done | yes | pending |
| HHP-014 | Support varied project maturity states | done | yes | pending |

---

## Issues: Requirements + Acceptance Criteria

### HHP-001 — Homepage purpose: tool-first → action-first

**Requirement:** The homepage should orient around what needs the homeowner's attention, not around which tools exist. The page should answer "what needs me?" before "what tools do I have?"

**Acceptance criteria:**
- Hero subtitle shows a data-derived attention summary (e.g. "3 selections to decide · 1 active change")
- A "Needs attention" section with prioritized action links appears before the tool cards
- Tool cards are visually secondary to the attention signals

**Files to check:** `DashboardPage.tsx` (hero + attention derivation), `DashboardNextActions.tsx` (action list)

---

### HHP-002 — Strengthen hero/top section

**Requirement:** The hero should establish project identity and summarize what needs attention. It should not be a generic "Your renovation at a glance."

**Acceptance criteria:**
- H1 shows project name, fallback is "My Renovation" (not "Dashboard")
- Subtitle is dynamic: attention items when things need action, "Nothing needs your attention right now" when quiet, "Everything looks good" as generic fallback
- No static "at a glance" copy

**Files to check:** `DashboardPage.tsx` lines 34–67

---

### HHP-003 — Audit and rewrite homepage copy

**Requirement:** All homepage copy should use plain homeowner language, not system/product jargon.

**Acceptance criteria (before → after):**
- "Your renovation at a glance" → dynamic attention summary
- "Quick Capture" + "Capture now, sort later" → just "Capture"
- "Next up" → "Needs attention"
- "Just getting started? You may want to do these first…" → "Preparation"
- Card titles: no uppercase tracking labels, use `font-medium text-cream/60`
- Empty states: action-oriented descriptions (e.g. "Track finishes, fixtures, and materials you need to pick")
- "All caught up" states: plain language ("All issues resolved", "All 5 decided")
- "high" priority badge → "urgent"

**Files to check:** All card components, `DashboardNextActions.tsx`, `DashboardToolGrid.tsx`, `DashboardPage.tsx`

---

### HHP-004 — Remove weak metrics from cards

**Requirement:** Remove low-value counts and system-level metadata that clutter cards without helping homeowner prioritization.

**Acceptance criteria:**
- No "X total" counter on Selections card header
- No `ShareMetaLine` on any card
- No inline activity event rows on Selections or Fix List cards
- No "Needs review: [list name]" link on Fix List card
- Plan & Changes card shows active changes or total changes, not plan count

**Files to check:** All card components — verify `ShareMetaLine` is not imported, `ActivityEventRow` is not imported

---

### HHP-005 — Refactor card content hierarchy

**Requirement:** Cards should follow a consistent scanning hierarchy so homeowners can quickly get the signal.

**Acceptance criteria:**
- All active-state cards follow: **title → big number + label → status line → timestamp → CTA button**
- No inline activity rows breaking the scanning flow
- No extra counters between the number and the CTA

**Files to check:** Active states in `DashboardCardPlanAndChanges.tsx`, `DashboardCardSelections.tsx`, `DashboardCardFixList.tsx`

---

### HHP-006 — Demote secondary tools

**Requirement:** Mood Boards and Contract Checklist should not have equal visual weight with core renovation tools (Plan, Selections, Fix List).

**Acceptance criteria:**
- Primary cards (Plan & Changes, Selections, Fix List) render in a 3-column grid
- Secondary cards (Mood Boards, Contract Checklist) render as compact single-row cards in a separate 2-column section
- Secondary section only appears when user has created content (boards or checklists exist)
- `DashboardCardProDirectory` is NOT rendered on the homepage

**Files to check:** `DashboardToolGrid.tsx`

---

### HHP-007 — Replace "Getting started" section framing

**Requirement:** "Just getting started? You may want to do these first…" is misleading for active projects. Replace with durable framing.

**Acceptance criteria:**
- Section label is "Preparation" (not "Getting started" or the old long phrase)
- Label works whether the project is new or mid-renovation

**Files to check:** `DashboardToolGrid.tsx` (homepage), `SidebarNav.tsx` (sidebar)

---

### HHP-008 — Improve visual hierarchy and contrast

**Requirement:** Quick comprehension requires better contrast, separation, and scanability.

**Acceptance criteria:**
- Card titles use `text-sm font-medium text-cream/60` (not `text-sm uppercase tracking-wider text-cream/40`)
- "Needs attention" action items use `text-cream/60` (not `text-cream/50`)
- Attention bullet dots are `w-1.5 h-1.5` (not `w-1 h-1`)
- Capture button has a single + icon (not two overlapping document+image icons)
- Inbox/Activity buttons are ghost-style (no border, no background) so Capture reads as primary

**Files to check:** `DashboardPage.tsx` (action row), `DashboardNextActions.tsx` (bullets), all card titles

---

### HHP-009 — Review naming for homeowner-natural language

**Requirement:** User-facing names should feel natural to a homeowner, not product-internal.

**Acceptance criteria:**
- Fallback project name: "My Renovation" (not "Dashboard")
- Card titles are noun labels ("Plan & Changes", "Selections", "Fix List") — action verbs belong on CTAs only
- "high" priority → "urgent"
- Empty state descriptions use renovation language

**Files to check:** `DashboardPage.tsx` (fallback), all card components (titles + CTAs)

---

### HHP-010 — Clarify Quick Capture / Inbox / Activity hierarchy

**Requirement:** The three controls should have clear visual roles — Capture is the primary action, Inbox/Activity are secondary navigation.

**Acceptance criteria:**
- Capture: solid sandstone button with + icon, labeled "Capture"
- Inbox: ghost text button with inbox icon, no border/background
- Activity: ghost text button with activity icon, no border/background
- No "Capture now, sort later" subtext
- No double document+image icon combo

**Files to check:** `DashboardPage.tsx` lines 69–110

---

### HHP-011 — Review activity badge noise

**Requirement:** The activity unseen count badge adds noise without helping prioritization. A number demands attention; a dot signals "something new."

**Acceptance criteria:**
- Activity shows a small sandstone dot (`w-2 h-2 rounded-full bg-sandstone`) when unseen > 0
- No numeric count on Activity button
- Inbox KEEPS its numeric badge (actionable count is meaningful there)

**Files to check:** `DashboardPage.tsx` lines 106–108 (Activity badge), lines 91–95 (Inbox badge)

---

### HHP-012 — Align left nav with homepage framing

**Requirement:** Sidebar section labels should match the homepage section labels for coherence.

**Acceptance criteria:**
- Sidebar section label reads "Preparation" (was "Getting Started")
- Label uses `text-cream/30` (was `text-cream/40`)

**Files to check:** `SidebarNav.tsx` line 235–236

---

### HHP-013 — Demote non-live items (Find Pros)

**Requirement:** Coming-soon placeholders should not occupy prime homepage real estate.

**Acceptance criteria:**
- `DashboardCardProDirectory` is NOT rendered on the homepage (no import, no render)
- Find Pros remains in sidebar as a disabled item with "Soon" label (already existed)

**Files to check:** `DashboardToolGrid.tsx` (verify no ProDirectory import or render), `SidebarNav.tsx` (Find Pros still in nav)

---

### HHP-014 — Support varied project maturity states

**Requirement:** Homepage copy and structure should work for: just getting started, mid-project, actively resolving issues, mostly through selections, and maintenance/cleanup.

**Acceptance criteria:**
- Hero adapts: shows relevant attention items regardless of stage
- Generic states: "Everything looks good" (not stage-specific), "Nothing needs your attention right now"
- Empty states have stage-appropriate descriptions
- Secondary section only appears when user has created content (not misleading for new users)
- "Needs attention" derives from actual data, not assumptions about stage

**Files to check:** `DashboardPage.tsx` (hero states), all card empty states, `DashboardToolGrid.tsx` (secondary section conditional)

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

## Build Verification
- `npx tsc --noEmit` — passes
- `npm run build` — passes
- No broken imports (QuietBanner removed from DashboardPage, ProDirectory removed from grid)
