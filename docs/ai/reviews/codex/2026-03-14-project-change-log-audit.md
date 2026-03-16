# Audit: Project Change Log

**Date:** 2026-03-14
**Reviewer:** Codex
**Scope:** Reviewed the active sprint `Project Change Log (Homeowner Version)` from current branch state with no tracked uncommitted changes, focusing on recent commit `0a17ed7` and the touched `src/app/app/tools/project-summary/**` files plus the sprint ledger.
**Trigger:** User request / sprint close

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint and handoff state
- `docs/ai/sprints/project-change-log.md` — issue ledger, acceptance criteria, self-review notes
- `docs/ai/project-context.md` — homeowner/product context
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — required review lens
- `docs/ai/review-templates/hhc-review-template.md` — required audit structure
- `docs/ai/reviews/README.md` — ledger workflow
- `docs/ai/qa/mobile-checklist.md` and `docs/ai/qa/desktop-checklist.md` — UI review expectations
- `gh issue list --limit 30` — backlog context
- `src/app/app/tools/project-summary/ToolContent.tsx` — page framing and prefill flow
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — reference files UX and persistence behavior
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — change log scanning, add form, mobile summary behavior
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — detail-page simplification
- `src/app/app/tools/project-summary/constants.ts` — 5-status model and category list
- `src/app/app/tools/project-summary/useProjectSummaryState.ts` — change creation/update behavior
- `src/data/project-summary.ts` — payload compatibility
- `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` — bottom activity section

## Overall Verdict

This is a strong directional simplification. The page is materially lighter, the homeowner framing is better, and the two-zone structure is clearer than the old plan-management model.

The main problem is that one core acceptance item did not actually land: the change log is not fully “summary-first” on mobile, and the add form is missing the required status field. There is also one trust regression in the old cross-tool create-entry path, which now discards durable linking while still accepting linked-entry context.

## What The Feature Appears To Be For

This appears to help a homeowner keep a lightweight running record of renovation changes and reference files without turning the experience into formal change-order software.

## User Journey Assessment

- The top-level journey is clearer. A homeowner now sees one optional project description, a brief disclaimer, current files, and a change log.
- Logging a change is more approachable than the previous plan/change workflow. The “Log a Change” CTA is clear and the language is simpler.
- The main journey breaks on mobile scanability. The sprint promised title, status, category, and room at a glance, but category and room disappear on mobile summary rows.
- The old cross-tool “create entry” path still exists, but the new UI no longer preserves a real link. That creates a subtle trust problem for users coming in from Selections or Fix List.

## Mobile UX Assessment

- The main page is flatter and less cognitively heavy than before.
- The add form is reasonably short, but it omits the status field the sprint explicitly required.
- Mobile scanability is weaker than the sprint claims because category and room are hidden behind `md:inline`, so phone users only get title and status in the collapsed list.

## Desktop UX Assessment

- Desktop hierarchy is calmer and easier to catch up on than the prior version.
- Files and changes are visually separated in a way that supports faster comprehension.
- The change rows scan better on desktop than mobile because the category and room chips are only visible there.

## Copy / Labeling Assessment

- `Project Change Log`, `Latest Reference Files`, and the disclaimer copy all move the feature in a better direction.
- The new 5-status labels are understandable and substantially less enterprise-coded than the old storage labels.
- The remaining wording risk is not the visible page copy; it is the hidden prefill flow, which still comes from “Add to Plan & Changes” entry points but no longer results in a visible durable relationship.

## Trust / Record-Keeping Assessment

- The page does a better job of signaling that this is a homeowner reference tool, not a contract-management system.
- The reference-files UI is cleaner, but the old document scope is still being written under the hood (`doc_scope: 'plan'`), so the model has not actually been flattened the way the sprint claims.
- The bigger trust issue is the cross-tool prefill regression: linked-entry context is still accepted into the change-log draft, but the actual structured link is thrown away on save.

## Top Issues

1. **Change log acceptance is not met on mobile or in the add form**
   Severity: High
   Confidence: High
   Why it matters: The sprint says change entries should show title, status, category, and room at a glance, and the add form should include a status field. In code, category and room are hidden on mobile summary rows, and the add form has no status input at all. That means the core “easy to scan, easy to log” promise is not actually delivered for a homeowner using a phone.
   Recommendation: Add a status control to the add form and make category/room visible in the collapsed mobile row, even if abbreviated.

2. **Cross-tool create-entry flow now loses durable linkage**
   Severity: Medium
   Confidence: High
   Why it matters: `ToolContent` still reads linked-entry context from session storage, but `ChangesSection` now only uses that data to prefill title and notes. The structured relationship is no longer saved or shown. For a homeowner coming from Selections or Fix List, the app still feels like it is creating a linked record when it is actually downgrading that into plain text.
   Recommendation: Either remove that prefill path for this sprint or preserve a visible durable reference in the saved change entry.

3. **Reference-file scope was hidden in UI, not actually removed**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint says all files are now reference files, but new documents are still persisted with `doc_scope: 'plan'`. That mismatch can leak into other surfaces later and makes the conversion less trustworthy than the ledger implies.
   Recommendation: Stop writing `doc_scope: 'plan'` for new files, or explicitly migrate the model if the distinction is truly being retired.

## Recommended Next Actions

- Re-open PCL-006 and add the missing status field plus mobile-visible category/room summary treatment.
- Decide whether cross-tool create-entry should be disabled for this sprint or preserved as a real structured relationship.
- Clean up the file model so “all files are reference files” is true in storage, not just in the visible section label.

## Final Verdict

Mostly, but not yet fully. The product direction is much better, but the core change-log workflow is still overclaimed in the sprint doc, especially for mobile scanning and linked-entry trust.
