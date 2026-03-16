# Audit: Project Change Log Follow-up Verification

**Date:** 2026-03-14
**Reviewer:** Codex
**Scope:** Verified Claude's follow-up commit `1511cf6` against the prior Project Change Log audit, focusing on `ToolContent.tsx`, `ChangesSection.tsx`, `DocumentsSection.tsx`, and the remaining cross-tool create-entry path.
**Trigger:** User request / post-fix verification

## Materials Reviewed

- `docs/ai/active-sprint.md` — current handoff state and follow-up commit reference
- `docs/ai/sprints/project-change-log.md` — updated ledger and claimed fix status
- `docs/ai/reviews/claude/2026-03-14-project-change-log-response.md` — Claude's follow-up response
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — verified `doc_scope` fix
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — verified add-form status field and mobile summary treatment
- `src/app/app/tools/project-summary/ToolContent.tsx` — verified prefill reader removal
- `src/components/app/CreateProjectSummaryEntryButton.tsx` — checked remaining cross-tool entry path
- `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailContent.tsx` — checked visible Selection-side entry button
- `src/app/app/tools/punchlist/components/PunchlistItemDetail.tsx` — checked visible Fix List-side entry button

## Overall Verdict

Most of the follow-up fixes are real. The missing status field is now in the add form, the mobile row now surfaces category and room, and new reference files are stored under `doc_scope: 'reference'`.

One user-facing regression remains: the old cross-tool `Add to Plan & Changes` buttons are still visible in Selections and Fix List, but the change-log tool no longer reads the linked-entry prefill context. That means the button still implies a linked, prefilled workflow that no longer exists.

## What The Feature Appears To Be For

This feature is now clearly positioned as a simple homeowner change log. The remaining issue is not on the main page itself; it is the surrounding workflow that still routes into it using outdated promises.

## User Journey Assessment

- The direct Project Change Log journey is improved and mostly matches the prior review feedback.
- The cross-tool journey is now inconsistent. A homeowner can still click `Add to Plan & Changes` from Selections or Fix List, but lands in a flow that no longer preserves the relationship the button implies.

## Mobile UX Assessment

- The mobile scanning issue I flagged is fixed in the change rows.
- I did not run live mobile QA in this follow-up pass.

## Desktop UX Assessment

- The desktop follow-up fixes are solid in the reviewed files.
- The lingering problem is wording and workflow mismatch from other surfaces, not the desktop layout of the main tool.

## Copy / Labeling Assessment

- `Project Change Log` language is intact.
- The stale cross-tool button text `Add to Plan & Changes` is now the main copy problem because it no longer describes what will happen.

## Trust / Record-Keeping Assessment

- Removing the prefill reader without removing or updating the button weakens trust. The user can reasonably believe they are creating a linked, context-aware record when the system is no longer doing that.

## Top Issues

1. **Cross-tool “Add to Plan & Changes” buttons now mislead users**
   Severity: Medium
   Confidence: High
   Why it matters: The follow-up removed the reader for linked-entry context in the Project Change Log, but left the visible buttons in Selections and Fix List. A homeowner can still click a button that promises the old linked-entry workflow and end up in a plain, unlinked log flow instead.
   Recommendation: Either remove those buttons for this sprint or update them and the destination flow so they truthfully create or prefill a change-log entry.

## Recommended Next Actions

- Re-open the cross-tool entry path as a follow-up fix rather than marking the entire review set fully resolved.
- If keeping the button, rename it and make the destination behavior explicit; if not, hide it until a true linked-entry flow is restored.

## Final Verdict

Mostly yes on the core follow-up fixes, but not fully. The main page is improved, while the surrounding add-entry workflow still gives the user a misleading promise.
