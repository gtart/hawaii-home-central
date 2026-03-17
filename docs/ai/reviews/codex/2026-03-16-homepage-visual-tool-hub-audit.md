# Audit: homepage visual tool hub

**Date:** 2026-03-16
**Reviewer:** Codex
**Scope:** Active sprint `Homepage Rebuild: Visual Tool Cards + Contextual Story Previews` at commit `90c3e4b`, with focused review of homepage card UI and dashboard preview aggregation in `src/components/dashboard/DashboardPage.tsx`, `src/components/dashboard/DashboardToolGrid.tsx`, `src/components/dashboard/DashboardCardFixList.tsx`, `src/components/dashboard/DashboardCardSelections.tsx`, `src/components/dashboard/DashboardCardPlanAndChanges.tsx`, and `src/server/dashboard/index.ts`
**Trigger:** User request

## Materials Reviewed

- `docs/ai/active-sprint.md` — confirmed current sprint, status, and review target commit
- `docs/ai/sprints/homepage-visual-tool-hub.md` — validated ledger and acceptance criteria for P1-001 through P1-007
- `docs/ai/project-context.md` — checked homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — applied homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — followed required audit structure
- `docs/ai/reviews/README.md` — confirmed ledger and audit workflow
- `src/components/dashboard/DashboardPage.tsx` — reviewed homepage hierarchy, header, and feed toggle treatment
- `src/components/dashboard/DashboardToolGrid.tsx` — reviewed primary vs secondary tool ordering
- `src/components/dashboard/DashboardCardFixList.tsx` — reviewed story-preview card and empty state
- `src/components/dashboard/DashboardCardSelections.tsx` — reviewed story-preview card and empty state
- `src/components/dashboard/DashboardCardPlanAndChanges.tsx` — reviewed story-preview card and empty state
- `src/server/dashboard/index.ts` — reviewed `toolPreviews` construction and recency logic
- `gh issue list --limit 30` — checked current known backlog context

## Overall Verdict

This homepage rebuild is a meaningful improvement. The page now orients a homeowner around the three main renovation jobs instead of dropping them into a mixed feed, and the empty states are much calmer and more teachable.

One important detail is still off: Plan & Changes previews are not actually "recent" in the same way as the other two cards. That weakens the homepage's catch-up value exactly in the tool homeowners rely on for formal record-keeping.

## What The Feature Appears To Be For

This appears to help a homeowner open the app and immediately answer three questions: what needs fixing, what still needs choosing, and what plan/change record needs attention right now.

## User Journey Assessment

- The top-level journey is much clearer than the old feed-first home. A first-time homeowner can understand the three main work areas quickly.
- The next action is legible: click into the relevant card rather than decode a mixed stream of events.
- The secondary tools are appropriately demoted, which helps the homepage feel like a renovation control surface instead of a general tools directory.
- The weak spot is the Plan & Changes card. If a change was created earlier but updated recently, the homepage can still hide that activity, so the user may not realize where the current conversation or record movement actually is.

## Mobile UX Assessment

- The compact card stack and three-preview limit fit short phone sessions well.
- Empty states stay readable and actionable without long explanatory copy.
- The collapsed activity feed helps mobile scanning because it avoids pushing the primary cards below a large text block.
- The Plan & Changes recency issue matters on mobile because the homepage is acting as a quick catch-up surface. If the wrong change appears "recent," the user has less room to compensate by scanning deeper context.

## Desktop UX Assessment

- Desktop hierarchy is improved. The three main cards get the prime space, and secondary tools are visually separated instead of competing at the top.
- The compact header and feed toggle reduce the old dashboard heaviness.
- The card design still feels homeowner-first rather than admin-heavy.
- The remaining gap is not layout, but relevance: desktop users also expect the preview rows to reflect the freshest Plan & Changes movement, not merely the newest-created change entries.

## Copy / Labeling Assessment

- `Fix List`, `Selections`, `Plan & Changes`, and `Recent activity` are all plain and legible.
- The empty states teach the job of each tool without drifting into internal-product language.
- The compact state sentence under the project name is easy to parse.
- No major copy problems stood out in this sprint.

## Trust / Record-Keeping Assessment

- This homepage is now much closer to a trustworthy "where do I need to go?" layer for a homeowner.
- The trust gap is concentrated in Plan & Changes preview recency. That tool is the most formal record in the set, so surfacing it by `created_at` instead of `updated_at` can make the homepage under-report the freshest movement in the project record.
- For a homeowner trying to catch up after contractor messages or spouse edits, "recent" needs to mean recently changed, not just recently created.

## Top Issues

1. **Plan & Changes previews are not actually recent**
   Severity: Medium
   Confidence: High
   Why it matters: The homepage promises recent story previews, but Plan & Changes uses `created_at` for both sorting and display in `src/server/dashboard/index.ts`. A change that was created days ago but updated today can disappear behind newer-created but less relevant entries. That weakens the homepage's role as a calm catch-up tool and makes the formal project record feel less current than it is.
   Recommendation: Build `planChanges` previews from `updated_at` with `created_at` as fallback, and use that same timestamp in the preview row so the relative time matches the real latest change activity.

## Recommended Next Actions

- Update `planChangesPreviews` in `src/server/dashboard/index.ts` to sort by `updated_at` and surface that timestamp in the preview item.
- Re-check the homepage with a seeded project where an older change receives a fresh status or note update, to confirm the preview ordering now matches homeowner expectations.
- After that fix, the sprint can likely close cleanly without broader homepage redesign changes.

## Final Verdict

Mostly yes. This is substantially closer to a simple, trustworthy homeowner renovation home screen, but the Plan & Changes preview recency bug should be fixed before calling the sprint fully done.
