# Audit: Change Log UX Clarity

**Date:** 2026-03-14
**Reviewer:** Codex
**Scope:** Current uncommitted sprint changes in `ToolContent.tsx`, `DocumentsSection.tsx`, `ChangesSection.tsx`, and `MilestoneTimeline.tsx`, reviewed against `docs/ai/sprints/change-log-ux-clarity.md`.
**Trigger:** User request / in-progress sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — current sprint and handoff status
- `docs/ai/sprints/change-log-ux-clarity.md` — acceptance criteria and ledger
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/app/app/tools/project-summary/ToolContent.tsx` — top-level hierarchy, header actions, disclaimer
- `src/app/app/tools/project-summary/components/DocumentsSection.tsx` — current working files redesign
- `src/app/app/tools/project-summary/components/ChangesSection.tsx` — grouped change review queue and expanded cards
- `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` — history restyling
- `src/app/app/tools/project-summary/components/FileDetailPanel.tsx` — reachable file-detail surface needed to validate mobile action access

## Overall Verdict

The new structure is directionally right. The page reads more like a homeowner record and less like document control software. But two important pieces are still not ready to close: current-file management breaks on mobile, and the new collapsed change rows hide key scan signals on mobile even though that is the core jobsite use case.

## What The Feature Appears To Be For

This sprint appears to make the Change Log easier for a homeowner to use as a single place to see the files they are building from, the changes that still need follow-up, and the quieter history behind those decisions.

## User Journey Assessment

- The top-to-bottom story is clearer: description, working files, changes, then history.
- The expanded change cards are much easier to read than the earlier denser rows.
- The file section feels calmer, but managing file status now depends on hover-only controls.
- The change queue is visually cleaner, but on phones it removes too much signal because attachments and comment counts disappear from collapsed rows.

## Mobile UX Assessment

- The lighter headers and simpler sections should scan better on a phone.
- Current Working Files has a real mobile blocker: `Archive`, `Restore`, and row-level `Delete` only appear on `group-hover`, and the file detail sheet does not expose equivalent actions.
- Change rows also lose attachment and comment indicators on mobile because those indicators are hidden behind `md` breakpoints, so a homeowner has to open rows one by one to know which changes have supporting context.

## Desktop UX Assessment

- Desktop hierarchy is cleaner and calmer than before.
- The ghost header actions and quieter history card are appropriate on wide screens.
- The documents and changes sections still feel homeowner-first on desktop, but the review should not treat desktop success as enough because the sprint affects phone-heavy flows.

## Copy / Labeling Assessment

- `Change Log`, `Current Working Files`, `Changes`, `History`, and the shorter disclaimer are all improvements.
- The new descriptions are plainer and more action-oriented.
- `FileDetailPanel` still labels the discussion area `Comments`, while the main page now says `Notes`, so the terminology is not fully consistent inside the same feature.

## Trust / Record-Keeping Assessment

- Grouping changes by follow-up state improves trust because the homeowner can see what still needs attention.
- Hiding mobile scan cues weakens trust because a change with discussion or supporting files looks identical to one without them until expanded.
- Making file status actions unreachable on touch risks the homeowner carrying an outdated working file longer than intended, which is exactly the kind of record-keeping confusion this redesign is meant to reduce.

## Top Issues

1. **Current-file management is unreachable on mobile**
   Severity: High
   Confidence: High
   Why it matters: The redesign moves `Archive`, `Restore`, and `Delete` behind hover-only row controls in the file list, but there is no replacement in the mobile file detail sheet. A homeowner on-site can open a file, but cannot reliably mark it outdated or restore an older one from a phone.
   Recommendation: Add visible mobile-safe actions either in the row itself or inside `FileDetailPanel`, and do not rely on hover-only affordances for file state changes.

2. **Collapsed change rows drop key scan signals on mobile**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint explicitly calls for bare comment counts and icon-only attachment indicators to support review-queue scanning. In the current implementation both are hidden behind `hidden md:*`, so mobile users lose exactly the cues that tell them which changes have supporting context.
   Recommendation: Keep the indicators subtle, but render them on mobile too. A small attachment icon and bare count are enough.

3. **File detail copy still uses `Comments` instead of `Notes`**
   Severity: Low
   Confidence: High
   Why it matters: This does not break the workflow, but it weakens the calm, coherent language pass the sprint is aiming for.
   Recommendation: Rename the file-detail discussion area to `Notes` or intentionally keep `Comments` everywhere in this feature. Do not split the terminology.

## Recommended Next Actions

- Restore mobile-safe file actions before treating the Current Working Files redesign as complete.
- Show attachment/comment indicators in collapsed change rows on mobile as well as desktop.
- Finish the copy pass inside `FileDetailPanel` so the feature uses one discussion term consistently.

## Final Verdict

Mostly no for this sprint’s current state. The hierarchy and visual cleanup are good, but the mobile action gap and missing mobile scan cues mean it is not yet a fully trustworthy homeowner tool.
