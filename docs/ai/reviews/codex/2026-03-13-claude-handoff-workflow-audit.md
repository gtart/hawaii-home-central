# Audit: Claude Handoff Workflow

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Uncommitted `CLAUDE.md` changes only, specifically the new sprint handoff and review workflow guidance at `CLAUDE.md:65-114`. I did not review my own audit file or unrelated untracked files.
**Trigger:** User request

## Materials Reviewed

- `CLAUDE.md` — new instructions for current-work discovery and the Claude→Codex sprint handoff workflow
- `docs/ai/active-sprint.md` — current sprint routing and commit pointer
- `docs/ai/sprints/homeowner-homepage-design-sprint.md` — example sprint doc structure the new workflow expects
- `AGENTS.md` — current Codex-side review instructions, to check for workflow consistency
- `docs/ai/reviews/README.md` — existing review ledger workflow

## Overall Verdict

The direction is good: this makes Claude’s handoff to Codex more concrete and gives future reviews a better chance of being grounded in actual acceptance criteria. The problem is that the new instructions overreach in one key place by telling Codex to update sprint docs during review, which conflicts with the repo’s own review-only model. As written, this improves review setup but still leaves process ambiguity.

## What The Feature Appears To Be For

This appears to be a process change meant to make future Claude→Codex handoffs more reviewable by forcing sprint docs to contain issue trackers, acceptance criteria, files changed, and build verification instead of leaving Codex to reconstruct intent from diffs alone.

## User Journey Assessment

- For the internal reviewer workflow, the path is clearer: `active-sprint.md` points to the sprint doc, and the sprint doc should tell Codex what to verify.
- The handoff becomes confusing at the point where Codex is instructed to both remain “review only” and also edit the sprint doc’s `Codex Verified` column.
- A first-time reviewer is likely to hesitate over which instruction wins: write an audit only, or modify the sprint doc as part of the review.
- The next action for Claude is clear; the next action for Codex is not fully coherent.

## Mobile UX Assessment

- Not applicable to this process/documentation change.

## Desktop UX Assessment

- Not applicable to this process/documentation change.

## Copy / Labeling Assessment

- The new handoff copy is concise and operational. It tells Claude what artifacts to maintain and why.
- “Always read `docs/ai/active-sprint.md` first” is a useful improvement because it reduces review guesswork.
- The wording around Codex responsibilities is too definitive where the surrounding repo rules are not aligned.

## Trust / Record-Keeping Assessment

- Requiring sprint docs with issue trackers and acceptance criteria is a real trust improvement because it creates a durable review record instead of relying on memory.
- The instruction that Codex should update `Codex Verified` cells during review undermines trust in the workflow because it contradicts the repo’s review-only rule and can lead to unpredictable reviewer behavior.
- A process doc should reduce ambiguity, not move it to a different file.

## Top Issues

1. **Codex is instructed to edit sprint docs during review despite the repo’s review-only rule**
   Severity: High
   Confidence: High
   Why it matters: The new workflow says Codex updates the sprint doc’s `Codex Verified` column, but the repo-level review instructions still define Codex as review-only by default. That conflict will produce inconsistent review behavior and weakens confidence in the handoff process itself.
   Recommendation: Pick one model and make all review docs agree. If Codex should stay review-only, remove sprint-doc mutation from the workflow and keep verification inside the audit file. If sprint-doc updates are required, explicitly relax the review-only rule for that narrow case in one authoritative place.

2. **The workflow depends on sprint docs being authoritative, but the review ledger docs still describe the older review format**
   Severity: Medium
   Confidence: High
   Why it matters: This handoff system assumes a tighter review workflow than the older ledger README currently documents. That mismatch means the repo still has multiple sources of truth for how reviews are run and recorded.
   Recommendation: Align `docs/ai/reviews/README.md` and any other review-facing docs with the sprint-handoff model so reviewers are not triangulating between competing formats.

## Recommended Next Actions

- Reconcile the `review only` rule with the new `Codex Verified` update requirement in one canonical instruction file.
- Align the review ledger docs with the sprint-handoff workflow so the process is documented consistently end to end.
- Keep the new sprint-doc expectations; they are useful and materially improve future review quality.

## Final Verdict

Mostly. This is a better handoff system than before, but it is not fully trustworthy yet because the repo still gives Codex conflicting instructions about whether a review may modify sprint documentation.
