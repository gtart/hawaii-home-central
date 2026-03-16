# Audit: Change Log UX Clarity Follow-Up Verification

**Date:** 2026-03-14
**Reviewer:** Codex
**Scope:** Follow-up verification of commits `554d522` and `1c43b02` against the active `Change Log UX Clarity` sprint, focused on `DocumentsSection.tsx`, `ChangesSection.tsx`, `FileDetailPanel.tsx`, and `useProjectSummaryState.ts`.
**Trigger:** User request / follow-up review

## Materials Reviewed

- `docs/ai/active-sprint.md` — current sprint pointer
- `docs/ai/sprints/change-log-ux-clarity.md` — acceptance criteria and prior Codex findings
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — current/outdated file actions
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — collapsed row indicators, expanded actions, add-change form
- `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` — Notes copy consistency
- `src/app/app/tools/project-summary/useProjectSummaryState.ts` — add-change payload persistence for new fields

## Overall Verdict

Claude fixed the main follow-up issues from the previous review. Mobile file actions are now reachable, mobile scan cues are back in collapsed change rows, and the file detail surface now uses `Notes`. But the newest add-change work introduced a save-time attachment race, and the explicit `Full details` action the sprint asked for has been removed.

## What The Feature Appears To Be For

This sprint is trying to make Change Log feel like a clear, lightweight homeowner review tool: current files first, changes second, history third, with less clutter and more confidence about what still needs attention.

## User Journey Assessment

- The main page now behaves better on mobile than the previous review pass.
- The file section once again supports the basic “this is current / this is older” job on touch devices.
- The add-change form is richer and more consistent with the expanded cards, but it now has a hidden failure mode if the user saves while a new attachment is still uploading.
- The dedicated change-detail route still exists, but the main list no longer offers the explicit path to it.

## Mobile UX Assessment

- Mobile file actions are now visible, which fixes the prior blocker.
- Mobile collapsed change rows now keep attachment and note-count cues, which is the right direction.
- The new attachment race is especially risky on mobile because short, impatient save flows are exactly where a homeowner is likely to tap `Add` before an upload spinner finishes.

## Desktop UX Assessment

- Desktop remains calmer and clearer than before.
- The follow-up changes did not reintroduce earlier clutter.
- Removing `Full details` from expanded cards makes desktop feel slightly more self-contained, but it also cuts an explicit escape hatch to the more detailed screen.

## Copy / Labeling Assessment

- `Notes` is now consistent in the file-detail surface.
- The broader copy pass still holds.
- No new copy problems were introduced that matter as much as the interaction bug.

## Trust / Record-Keeping Assessment

- The add-change attachment race is a real trust issue: a homeowner can believe a file is attached to a newly logged change when the UI can still drop it.
- The missing `Full details` link is less severe, but it weakens discoverability of the deeper record when a homeowner wants to inspect one change more carefully.

## Top Issues

1. **New change attachments can be lost if the user saves during upload**
   Severity: High
   Confidence: High
   Why it matters: `handleAdd()` only attaches files already present in `newAttachments`, while the `Add` button stays enabled during `isUploadingNew`. If the homeowner taps `Add` before the upload finishes, the change is created, the form resets, and the eventual upload result no longer gets attached to that saved change.
   Recommendation: Disable `Add` while `isUploadingNew` is true, or queue uploads against the newly created change ID instead of temporary form state.

2. **The sprint-required `Full details` action was removed**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint acceptance criteria explicitly called for a bottom-bar action row with `Full details →` and `Delete`. The detail route still exists, but the main list no longer exposes that path.
   Recommendation: Restore the `Full details` link in the expanded action row, or update the sprint acceptance criteria if the detail page is intentionally being deprecated.

## Recommended Next Actions

- Fix the add-form upload race before calling the interaction work complete.
- Restore or intentionally retire the `Full details` action and document that decision in the sprint.
- After that, this sprint should be close to a clean pass.

## Final Verdict

Mostly, but not fully. The previous review findings were addressed well, but the new attachment race is serious enough that the sprint is not clean yet.
