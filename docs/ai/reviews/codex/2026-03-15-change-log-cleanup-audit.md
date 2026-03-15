# Audit: Change Log / Track Plans Cleanup

**Date:** 2026-03-15
**Reviewer:** Codex
**Scope:** Current uncommitted sprint work in `ToolContent.tsx`, `ChangesSection.tsx`, `DocumentsSection.tsx`, `FileDetailPanel.tsx`, `constants.ts`, and `src/data/project-summary.ts`, reviewed against `docs/ai/sprints/change-log-cleanup.md`.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint pointer and handoff state
- `docs/ai/sprints/change-log-cleanup.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/app/app/tools/project-summary/ToolContent.tsx` — scope label and discussion naming
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — simplified statuses and flat change list
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — add-resource actions and text-entry rendering
- `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` — description/discussion naming, original filename, text-content detail
- `src/app/app/tools/project-summary/constants.ts` — status labels and mappings
- `src/data/project-summary.ts` — new `contentType` / `body` fields and coercion

## Overall Verdict

This cleanup mostly moves the Change Log in the right direction. The status model is calmer, the top scope field is clearer, and the conversation/description naming is more legible for a homeowner. The remaining gaps are both in the new document-entry model: the add-resource modes are not fully separated yet, and archived text entries lose the distinct treatment the sprint introduced.

## What The Feature Appears To Be For

This sprint appears to make the Change Log feel more like a simple living plan plus change record for homeowners, with plainer status language, less grouping ceremony, clearer naming, and room for non-file content like written scope addenda or notes.

## User Journey Assessment

- A homeowner can understand the main page faster now because `Scope of Work`, `Discussion`, and the flatter change list require less product memory.
- The new `Write` entry point is a useful addition because not all plan records are files or links.
- The flow still gets muddled when a homeowner clicks `Link` and then sees `Or upload a file` inside the same form.
- Text entries read clearly while current, but once archived they stop looking like text content and start looking like generic files.

## Mobile UX Assessment

- The flatter change list and shorter status set should scan better on a phone.
- The new add-resource row is compact enough for mobile, but mixing upload into the Link form adds extra decision-making in a small space.
- Archived text entries are especially easy to misread on mobile because the quiet outdated row strips away the text icon, badge, and body preview.

## Desktop UX Assessment

- Desktop hierarchy remains calm and readable.
- The scope label and discussion naming improve catch-up on wider screens.
- The new text-entry feature has a stronger desktop presence in current rows than in archived rows, which makes the resource list feel less consistent over time.

## Copy / Labeling Assessment

- `Scope of Work`, `Discussion`, `Description`, and `Original file` are all meaningful improvements.
- The simplified 4-status change model is easier for a homeowner to understand.
- The top-level add-resource labels are clearer than before, but the Link form still undermines that clarity by presenting an upload fallback inside the same mode.

## Trust / Record-Keeping Assessment

- Adding text entries helps trust because a homeowner can now keep written plan context in the same record, not just attached files.
- That trust weakens when archived text entries lose their visible identity in the list, because a homeowner reviewing older material can no longer easily tell “written note” from “file.”
- Preserving original filenames in metadata is a good improvement for provenance.

## Top Issues

1. **Archived text entries stop looking like text entries**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint explicitly introduced text-based plan content and says text entries should be visually distinct in the resource list. That is true in current rows, but once a text entry is archived it falls into the generic outdated-file row with the default file icon, no `Text` badge, and no body preview. A homeowner reviewing older plan material loses the distinction between a written addendum and an uploaded file.
   Recommendation: Give archived text entries their own outdated-row treatment too: keep the text icon, keep a `Text` badge, and retain at least a minimal body preview or clear text-type marker.

2. **The Link flow still mixes in file-upload behavior**
   Severity: Medium
   Confidence: High
   Why it matters: The cleanup aims to give the homeowner a cleaner `Upload / Link / Write` mental model, but the Link form still contains an `Or upload a file` button. That collapses the separation right after the user chooses a mode and adds one more branch to decode.
   Recommendation: Remove the upload fallback from the Link form, or intentionally combine Upload and Link into a single `Add Resource` flow and update the sprint criteria to match.

## Recommended Next Actions

- Preserve distinct text-entry styling in the archived/older-files section, not just the current-files section.
- Finish the add-resource cleanup by keeping `Upload`, `Link`, and `Write` as genuinely separate entry paths.
- After those two adjustments, this sprint should be close to a clean pass.

## Final Verdict

Mostly. The cleanup improves the homeowner mental model, but the new text-content and add-resource flows are not fully coherent yet.
