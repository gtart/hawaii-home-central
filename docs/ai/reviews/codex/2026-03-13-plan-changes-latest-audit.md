# Audit: plan-changes-latest

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Current uncommitted Plan & Changes follow-up changes in `src/app/app/tools/project-summary/*`, `src/app/api/collections/previews/route.ts`, `src/components/app/SidebarNav.tsx`, `src/lib/tool-registry.ts`, `src/app/share/[toolKey]/[token]/page.tsx`, plus active sprint docs.
**Trigger:** User request

## Materials Reviewed

- `docs/ai/active-sprint.md` — current sprint pointer and status
- `docs/ai/active-sprint-plan-changes-v1.md` — current sprint review status
- `docs/ai/reviews/claude/plan-changes-v1-codex-response.md` — Claude's claimed fix summary
- `src/app/app/tools/project-summary/ToolContent.tsx` — tool-level framing and page header
- `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` — official plan section, open-items label, inline documents
- `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` — change-detail fixes
- `src/app/api/collections/previews/route.ts` — index readiness derivation
- `src/components/app/CollectionsPickerView.tsx` — list/grid confidence states
- `src/components/app/SidebarNav.tsx` — primary navigation label
- `src/lib/tool-registry.ts` — tool title used across the app

## Overall Verdict

Claude fixed the four blocking trust issues from the earlier audit, and those fixes still look good. The latest round also renames the feature from "Plan & Changes" to "Official Plan" almost everywhere, and that creates a new clarity problem: homeowners can more easily understand the plan record, but less easily understand where formal changes live. This update is close, but I would not call it a clean pass yet.

## What The Feature Appears To Be For

This still appears to be the homeowner's main record for the official plan plus the formal change log attached to that plan.

## User Journey Assessment

- The internal workflow is clearer than before: approved plan, open items, inline documents, and change log all still exist.
- The navigation and page-level naming now imply this is only the official plan, even though a large part of the job is still documenting and reviewing changes.
- A homeowner trying to log a contractor change from the sidebar or tool list may not immediately infer that "Official Plan" is also where changes are managed.

## Mobile UX Assessment

- Moving documents inline into the plan card should reduce page hopping and help mobile scanning.
- The naming regression matters on mobile because navigation labels carry more of the orientation burden when visible space is tighter.

## Desktop UX Assessment

- Desktop hierarchy remains solid and the inline documents move is sensible.
- The broader tool label now understates the presence of the change log, which weakens catch-up clarity for a spouse or homeowner returning later.

## Copy / Labeling Assessment

- "Official Plan" is a good section label inside the page.
- It is a weaker product/tool label than "Plan & Changes" because it hides half the feature's job.
- Renaming "Plan Open Items" to just "Open Items" inside the plan card also weakens the distinction from change-level open items.

## Trust / Record-Keeping Assessment

- The record-keeping mechanics remain stronger than before, especially after the previous fixes.
- The main risk here is not data loss but false mental model: if the homeowner thinks this tool is only the locked plan, they may hesitate before using it to manage changes.

## Top Issues

1. **Tool-level rename to "Official Plan" obscures the change-log job**
   Severity: Medium
   Confidence: High
   Why it matters: "Official Plan" works well as an internal section heading, but it is too narrow as the product label in navigation, registry, share-page messaging, and page headers. Homeowners still need this feature for formal changes, and the new name makes that less discoverable.
   Recommendation: Keep "Official Plan" as the primary section inside the page, but retain a tool-level label that still signals changes, such as "Plan & Changes" or "Official Plan & Changes." See [`ToolContent.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/ToolContent.tsx), [`SidebarNav.tsx`](/home/greggtarter/HIhomecentral/src/components/app/SidebarNav.tsx), and [`tool-registry.ts`](/home/greggtarter/HIhomecentral/src/lib/tool-registry.ts).

2. **Renaming "Plan Open Items" to "Open Items" weakens the model**
   Severity: Medium
   Confidence: High
   Why it matters: This sprint explicitly introduced both plan-level and change-level open items. Dropping the "Plan" qualifier inside the plan card makes the distinction less explicit right after the product spent effort clarifying it.
   Recommendation: Keep the label plan-specific in the plan section, especially since change detail already has its own open-items area. See [`CurrentPlanSection.tsx`](/home/greggtarter/HIhomecentral/src/app/app/tools/project-summary/components/CurrentPlanSection.tsx#L459).

## Recommended Next Actions

- Revert the tool-level rename, or broaden it so homeowners still see that changes live here.
- Restore the explicit "Plan Open Items" label in the official-plan section.
- Keep the trust fixes from the earlier audit; those changes should not be rolled back.

## Final Verdict

Mostly, but not fully. The latest implementation is stronger on workflow integrity, yet the new naming direction makes the feature less legible as the place to manage both the official plan and formal changes.
