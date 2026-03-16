# Audit: Feed-First App Home

**Date:** 2026-03-16
**Reviewer:** Codex
**Scope:** Latest committed sprint work at `2eb5056` in `DashboardPage.tsx`, `DashboardFeed.tsx`, `DashboardNextActions.tsx`, and `QuietBanner.tsx`, reviewed against `docs/ai/sprints/feed-first-app-home.md`.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint pointer and handoff
- `docs/ai/sprints/feed-first-app-home.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/components/dashboard/DashboardPage.tsx`
- `src/components/dashboard/DashboardFeed.tsx`
- `src/components/dashboard/DashboardNextActions.tsx`
- `src/components/dashboard/QuietBanner.tsx`
- `src/components/app/ActivityEventRow.tsx`
- `src/lib/activityHelpers.ts`
- `src/hooks/useDashboard.ts`

## Overall Verdict

The feed-first direction is good, but the quiet/empty-state portion of the sprint is not actually shipped. The redesigned `QuietBanner` exists in code and is never rendered on `/app`.

## What The Feature Appears To Be For

This sprint appears to turn `/app` into a continuation surface that quickly tells a homeowner what changed, what needs attention, and where to resume work.

## User Journey Assessment

- The page now reads in the right order: summary, quick actions, continuation prompts, recent changes, then tool summaries.
- The next actions and inline feed are more aligned with “pick up where you left off” than the older dashboard.
- The weak point is the quiet state: when there is little or no activity, the page does not actually show the newly designed quiet-state treatment.

## Mobile UX Assessment

- The simplified stack should work better on mobile than the previous dashboard-heavy home.
- Quiet projects are still weak on mobile because the page can collapse into a short hero sentence, no next actions, an empty feed box, and then lower tool cards without a stronger orienting banner.

## Desktop UX Assessment

- Desktop hierarchy is cleaner and more continuation-first.
- Recent activity is easier to consume inline.
- Quiet states still feel under-designed because the dedicated quiet component is not mounted.

## Copy / Labeling Assessment

- The new summary sentence and section labels are calmer.
- `Pick up where you left off` is a better frame than task-widget language.
- The quiet-state copy in `QuietBanner.tsx` is better than what users actually get, but it is currently dead code.

## Trust / Record-Keeping Assessment

- Inline recent activity improves trust because recent movement is visible without opening a side panel.
- Quiet projects are less trustworthy than intended because the page does not clearly explain what to do next when there is little to show.

## Top Issues

1. **The improved quiet-state component is not wired into `/app`**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint explicitly calls for intentional quiet and empty states, but [QuietBanner.tsx](/home/greggtarter/HIhomecentral/src/components/dashboard/QuietBanner.tsx#L35) is not rendered anywhere. [DashboardPage.tsx](/home/greggtarter/HIhomecentral/src/components/dashboard/DashboardPage.tsx#L65) only shows the hero sentence, next actions when present, the feed, and tool summaries. For low-activity or empty projects, that means the redesigned quiet-state UX never appears and the homeowner still gets a relatively thin, un-guided state.
   Recommendation: Render `QuietBanner` in `DashboardPage` when the project is quiet or when the feed/actions are empty, and use it to provide the intended next-step suggestion.

## Recommended Next Actions

- Wire `QuietBanner` into `/app` for low-activity and empty-project states.
- Keep the feed-first ordering and continuation prompts; those are the strongest parts of the sprint.

## Final Verdict

Not yet. The page structure is improved, but the quiet-state work is incomplete because the new quiet-state component is not actually used.
