# Audit: Change Log — Plan's Files & Change Attachments

**Date:** 2026-03-15
**Reviewer:** Codex
**Scope:** Latest committed sprint work centered on `816a1ed` in `project-summary.ts`, `useProjectSummaryState.ts`, `DocumentsSection.tsx`, `FileDetailPanel.tsx`, `ToolContent.tsx`, `ChangeDetailContent.tsx`, and `ChangesSection.tsx`, reviewed against `docs/ai/sprints/change-log-files-and-attachments.md`.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint pointer and handoff
- `docs/ai/sprints/change-log-files-and-attachments.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — product context
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/data/project-summary.ts` — document/attachment model and coercion
- `src/app/app/tools/project-summary/useProjectSummaryState.ts` — auto-promotion logic
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — Plan's Files copy and provenance display
- `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` — document provenance metadata
- `src/app/app/tools/project-summary/ToolContent.tsx` — zone naming
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — rich change attachment UI
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — inline attachment rendering

## Overall Verdict

Most of the mechanics in this sprint are implemented correctly, but the top-level rename to `Plan's Files` creates a new homeowner-facing model conflict. The section now claims to be files-only while still accepting and auto-promoting links and written content.

## What The Feature Appears To Be For

This sprint appears to make accepted changes feed cleanly into the homeowner’s main plan record, while giving change attachments the same richer upload/link/text model as the main plan area.

## User Journey Assessment

- Auto-promoting accepted change attachments into the main plan record is directionally right because it reduces duplicate bookkeeping for the homeowner.
- Provenance helps because the homeowner can see where a promoted item came from.
- The main confusion is at the top of the surface: the section is titled `Plan's Files`, but the visible actions still include `Link` and `Add Content`, and accepted change attachments can also promote links and text into that same section.

## Mobile UX Assessment

- The new change-detail attachment controls are compact and should work better on mobile than the older split affordances.
- The naming conflict in the main plan area is harder on mobile because the header and the action row have to explain the model with very little space.

## Desktop UX Assessment

- Desktop benefits from the richer attachment model and provenance metadata.
- The `Plan's Files` label still overpromises a narrower model than the screen actually provides.

## Copy / Labeling Assessment

- `From change` provenance is a good addition.
- `Plan's Files` is not consistent with the rest of the same section, which still presents `Link` and `Add Content` actions and can display non-file entries.
- The empty state also reinforces a files-only concept even though the data model now supports more than files in that section.

## Trust / Record-Keeping Assessment

- Auto-promotion with source-change provenance improves trust.
- The naming mismatch weakens trust because a homeowner cannot easily tell what belongs in `Plan's Files` if the product itself treats links and text as first-class items there.

## Top Issues

1. **`Plan's Files` no longer matches what the section actually contains**
   Severity: Medium
   Confidence: High
   Why it matters: The section header and empty-state copy say this area is for files, but the same section still exposes `Link` and `Add Content` actions in [DocumentsSection.tsx](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/components/DocumentsSection.tsx#L419), and accepted changes auto-promote URL and text attachments into documents in [useProjectSummaryState.ts](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/useProjectSummaryState.ts#L719). For a homeowner, that means the label is now less accurate than the behavior.
   Recommendation: Either revert to a broader label like `Plan Resources`, or narrow the section so it truly only contains file records and move link/text content elsewhere.

## Recommended Next Actions

- Resolve the top-level naming/model mismatch before closing the sprint.
- Keep the auto-promotion and provenance changes; those are the strongest parts of the sprint.
- If `Plan's Files` is a deliberate product decision, remove non-file creation paths from that section and adjust the promoted-attachment rules to match.

## Final Verdict

Not yet. The underlying attachment work is solid, but the homeowner-facing top-level label is now less truthful than the product behavior in the same section.
