# Audit: Selections Simplification into Selection Boards

**Date:** 2026-03-16
**Reviewer:** Codex
**Scope:** Latest committed sprint work at `7258c40` in `DecisionTrackerPage.tsx`, `OnboardingView.tsx`, and `ToolContent.tsx`, reviewed against `docs/ai/sprints/selections-simplification.md`.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint pointer and handoff
- `docs/ai/sprints/selections-simplification.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx`
- `src/app/app/tools/finish-decisions/components/OnboardingView.tsx`
- `src/app/app/tools/finish-decisions/ToolContent.tsx`

## Overall Verdict

This is a meaningful simplification pass, and the board mental model is much clearer than before. Two small but real mismatches remain: the desktop list is not fully down to the promised 4-column layout, and the read-only empty state still uses the old list language.

## What The Feature Appears To Be For

This sprint appears to recast Selections as a set of simple decision boards, where each board is one homeowner choice with options, tags, and one eventual pick.

## User Journey Assessment

- The onboarding and inline add flow now make it easier to understand how to start.
- The list rows/cards read more like real decisions than before.
- Tags and location are more naturally folded into the decision itself instead of feeling like management metadata.
- The remaining gaps are mostly polish/consistency issues, not core flow failures.

## Mobile UX Assessment

- Mobile cards are cleaner and the selected-option treatment is clearer.
- Emoji fallbacks help reduce dead-looking rows when no thumbnail exists.

## Desktop UX Assessment

- Desktop is simpler than before, but it still carries one extra action column that weakens the “just four columns” cleanup.

## Copy / Labeling Assessment

- `Start a selection board`, `Each board is one decision`, and `Browse Selection Packs` are strong homeowner-facing improvements.
- The read-only empty state still says `This list doesn't have any selections yet`, which breaks the new board framing for viewers.

## Trust / Record-Keeping Assessment

- The clearer selected-option treatment helps a homeowner trust that one final choice was actually made.
- Consistent board language matters here because the whole simplification depends on that mental model being stable across states.

## Top Issues

1. **The desktop “Selection Boards” table still has an extra action column**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint acceptance criteria explicitly say the desktop table should be simplified to 4 columns: thumbnail, Selection, Status, Updated. But [DecisionTrackerPage.tsx](/home/greggtarter/HIhomecentral/src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx#L737) still renders a separate trailing chevron column. That keeps a bit of the old management-table feel the sprint was trying to remove.
   Recommendation: Fold row navigation into the existing row/selection cell affordance and remove the dedicated chevron column.

2. **The read-only empty state still uses the old list language**
   Severity: Medium
   Confidence: High
   Why it matters: The onboarding and header copy now teach a board mental model, but the read-only empty state in [DecisionTrackerPage.tsx](/home/greggtarter/HIhomecentral/src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx#L420) still says `This list doesn't have any selections yet.` A collaborator/viewer hitting that state gets the old framing back immediately.
   Recommendation: Rewrite the read-only empty state to match the board model, for example by referring to selection boards or decisions instead of a list.

## Recommended Next Actions

- Remove the extra desktop action column so the list really lands as a 4-column board index.
- Update the read-only empty state to use board language.

## Final Verdict

Almost. The simplification is real and directionally good, but the board model is not fully consistent yet across desktop layout and read-only empty state.
