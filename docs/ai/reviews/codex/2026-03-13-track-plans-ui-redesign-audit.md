# Audit: track-plans-ui-redesign

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Current uncommitted Track Plans UI Redesign work in `src/app/app/tools/project-summary/*`, `src/app/api/collections/[id]/entities/route.ts`, and `src/app/api/tools/entities/route.ts`, reviewed against `docs/ai/sprints/track-plans-ui-redesign.md`.
**Trigger:** User request

## Materials Reviewed

- `docs/ai/active-sprint.md` — current sprint pointer
- `docs/ai/sprints/track-plans-ui-redesign.md` — issue list and acceptance criteria
- `src/app/app/tools/project-summary/ToolContent.tsx` — page framing, copy summary, content detection
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` — compact plan card, unresolved items, incorporated changes
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — quick upload, inline files, detail panel launch
- `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` — document side panel / bottom sheet
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — tabs, inline uploads, redesigned change rows
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — field labels and metadata
- `src/app/app/tools/project-summary/components/AttachMenu.tsx` — entity picker entry point
- `src/app/app/tools/project-summary/components/EntityPickerModal.tsx` — cross-tool picker behavior
- `src/app/app/tools/project-summary/components/OpenItemsList.tsx` — mobile bottom sheet resolve flow

## Overall Verdict

The redesign is moving in a better direction visually: the plan card is shorter, the file flow is more usable, and the change log is easier to scan. It is not a clean pass yet. One acceptance criterion is still missing, and two parts of the redesign create homeowner-trust risk by hiding existing plan content or making cross-tool linking too ambiguous in real projects.

## What The Feature Appears To Be For

This appears to be the homeowner’s primary project-plan record: keep the official plan readable, attach plan files, document change orders, and link those changes back to selections or fix items.

## User Journey Assessment

- The main page now orients the homeowner faster around scope, files, unresolved items, budget, and changes.
- The file flow is noticeably simpler because uploads and file detail are closer to where the homeowner is already reading.
- The journey weakens for existing users with older included/not-included data, because those plan records now disappear from the main UI and copy summary with no visible migration or substitute.
- The link-picker flow also becomes shaky when a homeowner has multiple selections/fix-list collections with similar item names, because the picker does not show which list an item belongs to.

## Mobile UX Assessment

- The new file detail panel and resolve-item dialog do follow the bottom-sheet pattern on mobile, which is aligned with the repo’s standards.
- The compact plan card should scan better on a phone than the older longer card.
- The entity picker’s missing collection context is more risky on mobile because the homeowner has less surrounding space to infer where an item came from.

## Desktop UX Assessment

- Desktop hierarchy is improved: the plan card is more compact and the tabbed change log is easier to parse.
- The file detail sidebar is a good use of desktop space.
- The redesign still leaves a confidence gap where legacy plan inclusions/exclusions are no longer visible anywhere in the main experience.

## Copy / Labeling Assessment

- “Unresolved Items” is a better homeowner label than “Open Items.”
- “Scope / What’s Changed,” “Reason,” and “Note from Contractor” are clearer than the older change-detail labels.
- Naming is still a little mixed across the feature (`Track Your Plans`, `Official Plan`, and `Plan & Changes` metadata), which makes the tool feel not fully settled yet.

## Trust / Record-Keeping Assessment

- The redesign keeps the stronger audit-trail work from the previous sprint.
- The most serious trust risk in this round is not a missing milestone but hidden homeowner data: older included/not-included scope records still exist in the payload but are no longer visible in the product.
- The second trust risk is mis-linking: the cross-tool entity picker does not show collection titles even though the API returns them, so duplicate labels across multiple lists are easy to confuse.

## Top Issues

1. **Legacy included/not-included scope data is now effectively hidden**
   Severity: High
   Confidence: High
   Why it matters: PLAN-001 removes the included/not-included UI, but there is no visible migration or replacement for homeowners who already used those sections as their scope record. The data still exists in the payload, yet it no longer appears in the main UI or the copied summary, and `hasContent` now ignores it. That means real plan information can vanish from the homeowner’s working record without being deleted, which is a trust problem.
   Recommendation: Either migrate existing included/not-included content into a new visible structure, or continue surfacing legacy content read-only until migration is complete. See [`ToolContent.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/ToolContent.tsx#L117), [`ToolContent.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/ToolContent.tsx#L252), and [`useProjectSummaryState.ts`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/useProjectSummaryState.ts#L273).

2. **PLAN-008 is not fully implemented: “last edited by” metadata is missing**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint acceptance explicitly requires “Creation date + last edited by metadata visible on detail page.” The current detail screen only shows created and last-edited dates, with no editor identity, and the change state does not appear to persist updater identity for normal change edits. This is a direct acceptance miss in a feature that is supposed to feel like a reliable project record.
   Recommendation: Either add real change-level editor metadata to the model/state updates and render it on detail, or mark PLAN-008 incomplete. See [`ChangeDetailContent.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx#L270) and [`useProjectSummaryState.ts`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/useProjectSummaryState.ts#L679).

3. **Cross-tool entity picker is too ambiguous when projects have multiple lists**
   Severity: Medium
   Confidence: High
   Why it matters: The new APIs return `collectionTitle`, but the picker never shows it. If a homeowner has two selection lists with similar item names, or two fix lists with repeated item labels, the picker offers no way to tell which source collection they are linking. That makes mis-linking easy and undercuts the value of “real” entity linking.
   Recommendation: Show the source collection title in each picker row and include it in search/filter matching. See [`EntityPickerModal.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/components/EntityPickerModal.tsx#L100) plus [`route.ts`](/home/greggtarter/HIhomecentral/src/app/api/tools/entities/route.ts#L55).

## Recommended Next Actions

- Fix the hidden-legacy-data problem before shipping this redesign to existing projects.
- Complete PLAN-008 by adding real “last edited by” support, or mark it incomplete in the sprint doc.
- Add collection context to the entity picker so cross-tool links remain trustworthy in multi-list projects.

## Final Verdict

Mostly, but not fully. The UI is calmer and more usable, but the redesign still weakens homeowner trust where older scope data disappears and where linked entities are not clearly identifiable.
