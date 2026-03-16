# Audit: Homeowner Copy Simplification

**Date:** 2026-03-14
**Reviewer:** Codex
**Scope:** Commit `67ffe4c` and the active sprint surfaces it changed: dashboard cards, sidebar/navigation labels, tool registry descriptions, project-summary metadata, punchlist empty state, selections onboarding, and linked Change Log badges.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — current sprint pointer and claimed review scope
- `docs/ai/sprints/homeowner-copy-simplification.md` — issue ledger, acceptance criteria, self-review
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — required audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/components/dashboard/DashboardCardPlanAndChanges.tsx` — renamed Change Log card
- `src/components/dashboard/DashboardCardFixList.tsx` — Fix List entry copy
- `src/components/dashboard/DashboardToolGrid.tsx` — actual dashboard tool order
- `src/components/dashboard/DashboardPage.tsx` — hero attention summary
- `src/components/dashboard/DashboardNextActions.tsx` — follow-up phrasing
- `src/components/app/SidebarNav.tsx` — renamed sections and current tool order
- `src/lib/tool-registry.ts` — tool descriptions and hierarchy framing
- `src/lib/activityHelpers.ts` — activity filter labels
- `src/app/app/tools/punchlist/components/PunchlistEmptyState.tsx` — Fix List empty state
- `src/app/app/tools/finish-decisions/components/OnboardingView.tsx` — Selections first-run copy
- `src/app/app/tools/project-summary/page.tsx` — page metadata
- `src/app/app/tools/project-summary/[collectionId]/page.tsx` — page metadata
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/page.tsx` — page metadata
- `src/components/app/ProjectSummaryLinkBadge.tsx` — linked-entry badge wording

## Overall Verdict

This sprint meaningfully improves the product’s tone. The major descriptions are shorter, less inflated, and more homeowner-readable. But it does not fully land the claimed hierarchy or naming cleanup: Change Log still takes the lead slot in primary surfaces, and one visible badge still talks about "plan entries."

## What The Feature Appears To Be For

This sprint appears to make the app read like a calm homeowner renovation toolkit instead of workflow software, with Fix List as the clearest practical tool and Change Log positioned as a lighter supporting record.

## User Journey Assessment

- A homeowner will understand the renamed dashboard card and page titles faster than before.
- The next actions and empty states are clearer and more concrete.
- The hierarchy still feels muddled because the first primary tool a user sees in the dashboard and sidebar is Change Log, not Fix Issues.
- On linked selection/fix detail pages, the badge wording still implies "plan" management rather than a simple change record.

## Mobile UX Assessment

- The changed work is mostly copy, so it does not introduce new mobile layout risk in code.
- Shorter card and heading copy is better for phone scanning.
- The remaining "plan entry" badge wording is especially noticeable on compact detail screens because the badge is small and high-signal.

## Desktop UX Assessment

- Desktop scanability improved in the dashboard cards and sidebar headers.
- The primary desktop hierarchy is still off because the left rail and main dashboard grid both foreground Change Log ahead of Fix Issues.
- That makes the product feel more like record-keeping first, follow-up second, which is the opposite of the intended homeowner priority.

## Copy / Labeling Assessment

- The tool descriptions are cleaner and more honest.
- "Your Tools" and "Getting Started" are better than the earlier enterprise-like labels.
- "Start Logging," "View Log," and "Review Changes" are clearer than the older plan-management CTAs.
- `ProjectSummaryLinkBadge` still exposes "plan entry/entries," which directly undercuts the rename to Change Log.

## Trust / Record-Keeping Assessment

- The copy now better matches what the product actually stores, which helps trust.
- The leftover "plan entry" badge is not a data-loss issue, but it weakens confidence in the mental model because the same thing is called a log in one place and a plan in another.
- The hierarchy mismatch also subtly tells homeowners to think about the change record before the practical fix workflow, which is not the strongest guidance during active construction.

## Top Issues

1. **Fix List still is not positioned as the practical lead tool**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint objective explicitly says the product hierarchy should read `Fix List > Selections > Change Log`, but the dashboard and sidebar still lead with Change Log. A homeowner doing fast triage will infer that logging project changes is the primary job, not tracking concrete fixes.
   Recommendation: Reorder the primary surfaces so Fix Issues appears before Change Log in the dashboard grid and sidebar, or explicitly justify a different hierarchy in the sprint doc.

2. **A visible Change Log badge still uses old "plan entry" wording**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint claims the old plan-management framing was removed, but linked badges on selection and fix-item detail pages still say `plan entry/entries`. That creates naming drift right inside the active homeowner workflow.
   Recommendation: Rename the badge to `change log entry/entries` or just `linked change/changes` in `ProjectSummaryLinkBadge.tsx` so detail screens match the rest of the product.

## Recommended Next Actions

- Reorder dashboard and sidebar primary tools to match the intended homeowner hierarchy.
- Update `ProjectSummaryLinkBadge` user-facing text to remove `plan entry/entries`.
- Re-run a quick copy sweep for visible Change Log-related components before closing the sprint, not just the files Claude edited.

## Final Verdict

Mostly, but not fully. The tone is better and the product reads more honestly, but the remaining hierarchy mismatch and the lingering `plan entry` label keep it from feeling completely coherent as a simple homeowner tool.
