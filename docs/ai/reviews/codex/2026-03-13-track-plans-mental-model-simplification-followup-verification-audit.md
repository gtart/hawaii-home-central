# Audit: Track Plans Mental Model Simplification Follow-up Verification

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Claude's follow-up changes addressing the 5 fails and 4 concerns from the prior Track Plans mental-model audit.
**Trigger:** User request / post-fix verification

## Materials Reviewed

- `docs/ai/active-sprint.md` — confirmed follow-up handoff state
- `docs/ai/sprints/track-plans-mental-model-simplification.md` — updated ledger and revised acceptance notes
- `docs/ai/reviews/claude/2026-03-13-track-plans-followup-response.md` — Claude's claimed fixes
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — file-vs-URL primary action check
- `src/app/app/tools/project-summary/components/AttachMenu.tsx` — link action naming
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` — linking hint, pending impact, draft guidance, terminology
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — change linking visibility and copy
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — detail-page language consistency
- `src/components/app/CollectionsPickerView.tsx` — picker terminology consistency
- `src/app/app/tools/project-summary/ToolContent.tsx` — tool-level copy cleanup

## Overall Verdict

The substantive follow-up fixes are real. The five failed issues from my prior review are now resolved in code, and three of the four concerns are resolved as well.

One low-grade wording inconsistency remains: the add-to-plan dialogs now say `Add to Your Plan`, but the explanatory sentence still refers to the `official plan record`. That does not reopen the sprint structurally, but it means the homeowner-language pass is not quite fully clean.

## What The Feature Appears To Be For

This feature is trying to give a homeowner one clear renovation record: a current plan, then later changes attached to that plan, with related files and linked decisions easy to understand.

## User Journey Assessment

- The journey is now easier to follow. Uploading files is primary, change linking is named explicitly, and the plan now teaches where linking belongs.
- The change flow is materially better because linked Selections and Fix Items appear earlier in the expanded row, before attachments.
- The remaining issue is just wording polish, not workflow ambiguity.

## Mobile UX Assessment

- By code inspection, the follow-up improves mobile comprehension because the previously vague `Link` trigger is now explicit.
- I did not run live mobile QA in this pass.

## Desktop UX Assessment

- Desktop list/detail scanability remains solid, and the revised labels reduce interpretation overhead.
- No new desktop-specific regressions stood out in the follow-up diff.

## Copy / Labeling Assessment

- `Your Plan` is better than `Official Plan` for this homeowner-facing flow.
- `Still to Decide` is now used consistently in the picker and detail views.
- The one leftover mismatch is the phrase `official plan record` inside the add-to-plan explanatory text in both change incorporate dialogs.

## Trust / Record-Keeping Assessment

- The budget now distinguishes pending impact from approved totals, which is a meaningful trust improvement.
- The clarified plan-linking scope is acceptable because the product and sprint doc now match: linking happens on changes, not directly on the plan.

## Top Issues

1. **Residual “official plan record” copy remains in add-to-plan dialogs**
   Severity: Low
   Confidence: High
   Why it matters: The sprint’s homeowner-language pass is mostly complete, but the dialog title and body now speak in two different voices.
   Recommendation: Change the explanatory sentence to match `Your Plan` wording in both incorporate dialogs.

## Recommended Next Actions

- Clean up the two remaining `official plan record` sentences in the incorporate dialogs.
- After that copy fix, TP-024 can move from `concern` to `pass`.

## Final Verdict

Mostly yes. The important fixes I asked for are now in code, and the remaining issue is a small copy cleanup rather than a workflow or trust problem.
