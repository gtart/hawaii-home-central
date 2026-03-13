# Audit: Homeowner Homepage Design

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Sprint commit `6076c0a` only: `src/components/dashboard/DashboardPage.tsx`, `DashboardToolGrid.tsx`, `DashboardNextActions.tsx`, `DashboardCardPlanAndChanges.tsx`, `DashboardCardSelections.tsx`, `DashboardCardFixList.tsx`, `DashboardCardMoodBoards.tsx`, `DashboardCardContractChecklist.tsx`, and `src/components/app/SidebarNav.tsx`, reviewed against `docs/ai/sprints/homeowner-homepage-design-sprint.md`.
**Trigger:** User request

## Materials Reviewed

- `docs/ai/active-sprint.md` — current sprint pointer and commit
- `docs/ai/sprints/homeowner-homepage-design-sprint.md` — issue tracker and acceptance criteria for HHP-001 through HHP-014
- `src/components/dashboard/DashboardPage.tsx` — hero, action row, attention summary
- `src/components/dashboard/DashboardNextActions.tsx` — prioritized action links
- `src/components/dashboard/DashboardToolGrid.tsx` — primary vs secondary tool grouping
- `src/components/dashboard/DashboardCardPlanAndChanges.tsx` — homepage card for plan/change state
- `src/components/dashboard/DashboardCardSelections.tsx` — selections card
- `src/components/dashboard/DashboardCardFixList.tsx` — fix list card
- `src/components/dashboard/DashboardCardMoodBoards.tsx` — secondary compact card
- `src/components/dashboard/DashboardCardContractChecklist.tsx` — secondary compact card
- `src/components/app/SidebarNav.tsx` — “Preparation” label update
- `src/server/dashboard/index.ts` — dashboard summary fields used by homepage cards
- Validation: `npx tsc --noEmit` passes

## Overall Verdict

This is a real improvement over the old tool-dashboard framing. The homepage now reads much more like a homeowner command center, and most of the sprint’s hierarchy and copy goals are visible in the code. The remaining misses are not structural rewrites; they are product-meaning issues where the homepage still either sends users to generic destinations or uses wording/state summaries that are less homeowner-clear than the sprint asked for.

## What The Feature Appears To Be For

This appears to turn `/app` into a quick “what needs me now?” surface for a homeowner, with the homepage surfacing current attention items first and demoting tools that are useful but not part of day-to-day project control.

## User Journey Assessment

- The top-of-page flow is materially better: project identity, attention summary, clear action row, then “Needs attention,” then tool cards.
- The primary/secondary split is clearer and more homeowner-natural than the old “tool grid” framing.
- The main journey weakness is that some “Needs attention” links no longer take the homeowner directly to the specific collection with work waiting. In a multi-collection product, generic tool-root links add friction right at the point the homepage is supposed to reduce it.
- The Plan & Changes card also under-signals when a homeowner has a plan documented but no formal changes yet, which makes the homepage feel more change-tracker-centric than plan-centric.

## Mobile UX Assessment

- Based on the code, the homepage should remain lighter and easier to scan on mobile than before because the inline activity rows and secondary-card bulk were removed.
- The biggest mobile risk is extra navigation cost from generic action links in `DashboardNextActions.tsx`; on a phone, landing at a tool root or picker instead of the relevant collection is more noticeable friction.
- I did not run a live mobile walkthrough in this review, so this is a code-based assessment rather than a rendered verification.

## Desktop UX Assessment

- The desktop hierarchy is stronger: primary cards first, secondary tools visually demoted, and less noisy metadata inside cards.
- The design now reads more like a homeowner dashboard and less like an internal ops panel.
- The main desktop weakness is still the same journey gap: some top-priority actions are summaries, not true direct routes to the specific place that needs action.

## Copy / Labeling Assessment

- Most of the copy rewrite is in the right direction: “Capture,” “Needs attention,” “Preparation,” “All issues resolved,” and the card empty states are cleaner and less SaaS-like.
- One explicit sprint requirement still fails: the sprint called for user-facing “high” priority language to become “urgent,” but `DashboardPage.tsx:42` and `DashboardNextActions.tsx:23` still use “high-priority.”
- The new Plan & Changes copy in the quiet state is weaker than the sprint intent because “No changes recorded yet” does not tell the homeowner whether their plan itself exists and is current.

## Trust / Record-Keeping Assessment

- Removing low-value counters and activity snippets improves signal-to-noise, which helps the homepage feel calmer and more trustworthy.
- The trust gap is in Plan & Changes: if a homeowner has already documented a plan but not yet logged changes, the homepage currently reads as if the important thing missing is “changes,” not whether the plan is present and current.
- Direct-action links also matter for trust. A homepage that says something needs attention should take the user as close as possible to that exact work.

## Top Issues

1. **“Needs attention” links are not direct enough for a multi-collection product**
   Severity: High
   Confidence: High
   Why it matters: The homepage is supposed to answer “what needs me?” and move the homeowner straight into that work. In `src/components/dashboard/DashboardNextActions.tsx:44-63`, both Selections and Plan & Changes action items route to the generic tool root instead of the specific collection with the unresolved work. On HHC’s multi-collection model, that can dump the user into a picker or a generic landing screen, which adds friction right where the sprint was trying to remove it.
   Recommendation: Restore collection-aware deep links for actions whenever the data already identifies a relevant list/collection, even if the label stays high-level.

2. **The sprint’s “high” → “urgent” language cleanup is incomplete**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint explicitly called for homeowner-natural language and replacing “high” with “urgent.” The homepage still surfaces “high-priority” in the hero summary (`src/components/dashboard/DashboardPage.tsx:42`) and in the first fix-list action (`src/components/dashboard/DashboardNextActions.tsx:23`). That leaves the most visible attention language sounding more like a task system than a homeowner tool.
   Recommendation: Replace remaining “high-priority” homepage strings with the new “urgent” framing so the top-level language is consistent.

3. **Plan & Changes under-represents an existing plan when there are no changes yet**
   Severity: Medium
   Confidence: High
   Why it matters: In `src/components/dashboard/DashboardCardPlanAndChanges.tsx:47-60`, any summary with zero total changes falls into a quiet state that says “No changes recorded yet.” For a homeowner who already documented scope, inclusions, exclusions, or budget, that copy hides the fact that the plan exists and may be up to date. This weakens HHP-014’s “varied project maturity states” goal and makes the card feel change-led rather than plan-led.
   Recommendation: Distinguish “plan exists, no changes yet” from “tool not started,” and surface at least one plan signal in that quiet state.

## Recommended Next Actions

- Make “Needs attention” links collection-aware again for Selections and Plan & Changes.
- Finish the user-facing terminology cleanup by removing the remaining “high-priority” strings from the homepage.
- Adjust the quiet Plan & Changes card so it acknowledges a documented plan even when no changes have been logged yet.

## Final Verdict

Mostly. This homepage is meaningfully more homeowner-first than the old dashboard, but it is not fully there yet because a few top-level signals still either route too generically or describe the homeowner’s situation less clearly than the sprint intended.
