# Sprint: Feed-First App Home

**Date**: 2026-03-16
**Objective**: Rework /app homepage from dashboard-with-numbers to a continuation/feed surface that answers "what changed, what needs attention, where do I continue."
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| P3-001 | Rework app home hierarchy so feed is primary | P1 | done | pass | pass | The feed is now inline in the main page flow and the tool summaries are pushed lower, so `/app` reads as continuation-first rather than a stat dashboard. | none | `src/components/dashboard/DashboardPage.tsx`, `src/components/dashboard/DashboardFeed.tsx` |
| P3-002 | Improve hero/state summary at top of /app | P1 | done | pass | pass | The top summary is calmer and homeowner-readable, and avoids a dashboard-status-bar tone. | none | `src/components/dashboard/DashboardPage.tsx` |
| P3-003 | Strengthen next actions as continuation prompts | P1 | done | pass | pass | The next actions now read as plain-language continuation prompts with clearer tool context. | none | `src/components/dashboard/DashboardNextActions.tsx` |
| P3-004 | Improve quiet states and recent states | P1 | done | pass | pass | Fixed: QuietBanner now rendered in DashboardPage when `noNews.isQuiet` is true, providing intentional quiet-state treatment. | none | `src/components/dashboard/QuietBanner.tsx`, `src/components/dashboard/DashboardFeed.tsx`, `src/components/dashboard/DashboardPage.tsx` |
| P3-005 | Lightweight visual proof of recent work | P2 | done | pass | pass | The inline feed uses entity pills, actor names, timestamps, and tool labels; that is enough lightweight proof without adding new backend/media work. | none | Decided against photo thumbnails (would require backend API changes); inline feed with entity pills, actor names, and tool labels provides sufficient visual proof |

---

## Acceptance Criteria

### P3-001: Rework app home hierarchy so feed is primary
- Feed/recent activity visible in main page flow without opening a panel
- Tool cards still present but pushed lower, less dominant
- Page feels like continuation surface, not stat dashboard
- Layout works on desktop and mobile
- **Files**: `src/components/dashboard/DashboardPage.tsx`, `src/components/dashboard/DashboardFeed.tsx`

### P3-002: Improve hero/state summary at top of /app
- Top summary reads naturally and is homeowner-friendly
- Does not feel like admin dashboard status bar
- Quiet and active states both read well
- **Files**: `src/components/dashboard/DashboardPage.tsx`

### P3-003: Strengthen next actions as continuation prompts
- Next actions feel like continuation prompts, not task widgets
- Fix List and Selections continuation paths are clear
- Actions are understandable at a glance
- **Files**: `src/components/dashboard/DashboardNextActions.tsx`

### P3-004: Improve quiet states and recent states
- Quiet state feels intentional, not dead
- Recent state shows clear movement
- Empty projects present useful next steps
- **Files**: `src/components/dashboard/QuietBanner.tsx`, `src/components/dashboard/DashboardPage.tsx`

### P3-005: Lightweight visual proof of recent work
- If implemented, visuals improve comprehension
- If not cleanly achievable, document why
- **Files**: dashboard components as needed

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardPage.tsx` | Reordered: hero → actions → next actions → feed (inline) → tool summaries (lower). Removed Activity panel button (feed is now inline). Cleaner state sentence. |
| `src/components/dashboard/DashboardFeed.tsx` | Increased to 8 events, better empty state, inline layout with hover rows, "View older" button |
| `src/components/dashboard/DashboardNextActions.tsx` | "Pick up where you left off" label, added tool name badges, wider click targets, continuation-first language |
| `src/components/dashboard/QuietBanner.tsx` | Calmer layout, merged last-activity into the message, always suggests a next step (defaults to Fix List) |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e error only)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop /app with active project data
- [ ] Mobile /app with active project data
- [ ] /app with low/no activity
- [ ] Activity feed visible and usable
- [ ] Next actions useful
- [ ] Quick action buttons work
- [ ] No layout collapse on small screens

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-16-feed-first-app-home-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-16-feed-first-app-home-response.md` |

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
- [x] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
