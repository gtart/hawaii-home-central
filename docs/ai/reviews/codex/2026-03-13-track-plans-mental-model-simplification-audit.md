# Audit: Track Plans Mental Model Simplification

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Current uncommitted sprint changes for Track Plans, centered on the collection picker, detail page structure, plan/change flows, document/link affordances, and sprint ledger acceptance criteria.
**Trigger:** User request / sprint close

## Materials Reviewed

- `docs/ai/active-sprint.md` — confirmed active sprint and review target
- `docs/ai/sprints/track-plans-mental-model-simplification.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — product context and homeowner audience
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — required review lens
- `docs/ai/review-templates/hhc-review-template.md` — required audit structure
- `docs/ai/reviews/README.md` — ledger/audit workflow
- `docs/ai/qa/mobile-checklist.md` and `docs/ai/qa/desktop-checklist.md` — user-facing QA expectations
- `gh issue list --limit 30` — current backlog context
- `src/app/app/tools/project-summary/CollectionPickerWrapper.tsx` — default picker view
- `src/components/app/CollectionsPickerView.tsx` — list/card scanability and naming consistency
- `src/app/app/tools/project-summary/ToolContent.tsx` — page structure, header framing, copy summary
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` — plan summary, CTAs, budget, empty state
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — unified changes flow and link actions
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — change detail clarity and attachments
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — plan document add flow
- `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` — history trust/readability
- `src/app/app/tools/project-summary/components/OpenItemsList.tsx` — still-to-decide interactions
- `src/app/app/tools/project-summary/components/AttachMenu.tsx` and `src/app/app/tools/project-summary/components/EntityPickerModal.tsx` — link discoverability and mobile/desktop behavior
- `src/app/api/tools/entities/route.ts` — entity-picker support data

## Overall Verdict

This sprint materially improves the feature. The page now reads much more clearly as current plan first, then changes against that plan, and the activity/timeline clutter is mostly gone.

The problem is that the ledger overstates what landed. The homeowner mental model is better, but the sprint did not finish the “explicit linking” and “plan-linked records” work, and it still leaves a few key guidance gaps that matter for trust and first-run comprehension.

## What The Feature Appears To Be For

This appears to help a homeowner keep one authoritative renovation plan, approve it as the baseline, and then track later changes against that baseline without losing the original record.

## User Journey Assessment

- The main journey is much clearer now. The detail page centers on the current plan, then changes, then a concise history.
- The state-dependent plan CTA is strong. Draft, approved, and unlocked states point the homeowner toward the next likely action.
- The remaining confusion is around linking. The sprint says linking Selections and Fix List items should be explicit, but the plan still has no such area and the change flow still hides it behind generic `Link` controls.
- First-run guidance is better, but it still does not teach the full intended workflow. A new homeowner would learn scope, files, still-to-decide items, budget, and approval, but not that they should connect related Selections or Fix List items.

## Mobile UX Assessment

- By code inspection, the mobile structure is improved. Entity picking and resolve flows use bottom-sheet patterns, and the main page is flatter and easier to scan than before.
- The weakest mobile spots are the tiny, low-emphasis add controls in plan documents and expanded change rows. Those controls are present, but they are not strong “next step” affordances for a stressed homeowner on a phone.
- I did not run live mobile QA, so this is a code-based assessment rather than a runtime pass.

## Desktop UX Assessment

- Desktop hierarchy is calmer. The main content column has a clear order and the comments rail is visually secondary.
- The list view is the right default and does a good job foregrounding comparison data for plans.
- The lingering desktop weakness is that some important actions still read like secondary utilities instead of the main workflow, especially around linking.

## Copy / Labeling Assessment

- `Track Your Plans` is clearer than the previous narrower framing, and the approved/unlocked copy does a better job teaching the baseline-change model.
- The feature still mixes terms for the same concept. The plan and change views say `Still to Decide`, while collection cards still say `open items`.
- `Official Plan` is understandable inside the detail page, but generic `Link` action text is still too vague for the acceptance criteria this sprint claimed to satisfy.

## Trust / Record-Keeping Assessment

- The feature is more trustworthy than before because history is cleaner, approval states are legible, and changes are better separated from the baseline plan.
- The most important trust gap is that plan-level linked records are still not real in the UI or data model, despite the sprint ledger claiming they are complete.
- The budget view is also incomplete for record-keeping because it shows approved totals but not pending impact, which is exactly the distinction a homeowner needs when trying to understand financial exposure.

## Top Issues

1. **Plan-level linking is still not implemented**
   Severity: High
   Confidence: High
   Why it matters: The sprint says homeowners can explicitly connect the plan to Selections and Fix List items, but the plan card has no linked-items area and the sprint notes still admit the data model lacks plan links. That means the ledger is marking complete behavior the product does not actually support.
   Recommendation: Either add real plan-level linking with visible linked items in the plan card, or move that work out of the sprint and update the ledger/scope honestly.

2. **Primary linking and file actions are still not explicit enough**
   Severity: High
   Confidence: High
   Why it matters: The acceptance criteria asked for visible `Add File`, `Link Fix List`, and `Link Selections` actions. Instead, the plan still leads with `Link URL`, and changes still rely on generic `Upload` / `Link` affordances after expansion. A homeowner should not have to infer what “Link” means here.
   Recommendation: Make file upload primary, move URL into a secondary path, and surface direct text actions for `Link Selection` and `Link Fix Item`.

3. **Budget presentation still omits pending impact**
   Severity: Medium
   Confidence: High
   Why it matters: Showing only baseline, approved changes, and current total hides the homeowner’s current exposure when there are pending changes under review. That weakens the feature’s value as a reliable money record.
   Recommendation: Add a separate pending impact line sourced from requested / awaiting-homeowner changes and keep it visually separate from approved totals.

4. **First-run guidance still skips part of the intended workflow**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint aimed to teach a simple homeowner workflow, but the draft guidance never mentions linking related Selections or Fix List items. That leaves the user with a partially taught process.
   Recommendation: Update the plan empty state and first-run helper copy so it teaches scope, files, linked items, still-to-decide items, and approval in the intended order.

5. **Concept naming is calmer, but not fully consistent**
   Severity: Medium
   Confidence: High
   Why it matters: `Still to Decide` is a better phrase than the old wording, but collection cards still use `open items`, so the feature has not fully resolved its mental-model language. That matters for spouses/collaborators trying to catch up quickly.
   Recommendation: Standardize the chosen term across picker cards, detail views, summaries, and any remaining backlog copy.

## Recommended Next Actions

- Re-open TP-007, TP-008, TP-009, TP-016, and TP-017 instead of closing the sprint as fully passed.
- Decide whether plan-level linking is truly in scope for this feature or whether links are change-only; then make the product and ledger match that decision.
- Do one more homeowner-language pass on labels and add controls before treating TP-024 as done.

## Final Verdict

Mostly, but not yet fully. The structure now feels much more like a homeowner renovation tool than a PM console, but the sprint still claims completion on a few workflow-critical pieces that the current UI does not actually deliver.
