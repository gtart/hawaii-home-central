# Phase E Review — Copy, Status Language, and Homepage Signals

**Sprint:** Plan & Changes Rebuild v1
**Phase:** E (PCV1-030 through PCV1-041)
**Date:** 2026-03-13
**Status:** Complete — all 12 issues pass

---

## Summary

Phase E rewrote user-facing copy from workflow-software language into homeowner-teaching language, simplified change status labels, and rebuilt the index/list card to tell a confidence story (settled vs. needs attention).

## Key Changes

### Copy Renames (PCV1-030 through PCV1-033)
These were already completed in prior phases:
- "Current Plan" → "Official Plan" (Phase A)
- "Still to Decide" → "Plan Open Items" (Phase B)
- "Incorporate into Plan" → "Add to Official Plan" (Phase A)
- Section labels → "Change Log" with "Pending Changes" / "Change History" subheaders (Phase D)

### Status Language (PCV1-034, PCV1-035)
**constants.ts** — Simplified all 6 change status labels:
| Old Label | New Label |
|-----------|-----------|
| Requested | Proposed Change |
| Awaiting Homeowner | Needs Your Review |
| Approved by Homeowner | Approved Change |
| Accepted by Contractor | Accepted by Contractor (kept — meaningful role distinction) |
| Done | Added to Plan |
| Closed | Not Moving Forward |

Plan status labels also simplified: "Working Plan" → "Draft"

Added `shortLabel` field for compact mobile display.

### Helper Text (PCV1-036)
- Approved banner: "Your plan is approved and locked. If something changes, create a change record below so you have a clear paper trail."
- Unlocked banner: "Your plan is unlocked so you can make edits. When you're done, re-approve it to lock things back in place."
- Scope placeholder: "What work is being done? Describe the overall project so everyone's on the same page."

### Empty States (PCV1-037)
- Changes: "No changes yet. When something changes from the original plan — a new material, extra work, or a removed item — add it here so you have a record of what changed and why."
- Index card: "No plan details yet — start by describing your project scope"

### Homepage / Index Cards (PCV1-038 through PCV1-041)
**CollectionsPickerView.tsx** — Rebuilt both card and table views:
- **Card view**: Plan status badge leads (Draft/Approved/Unlocked), then open items count, then scope preview, then pending changes
- **Table view**: Status badge + open items in first row, pending changes below
- **Confidence signals**: Approved = emerald badge (stable), Draft = subtle gray, Unlocked = amber (needs attention), open items = amber, pending changes = amber
- Empty cards say "Not started" instead of "No items yet"

## Files Modified

| File | Changes |
|------|---------|
| `src/app/app/tools/project-summary/constants.ts` | Status labels simplified, shortLabel added, plan descriptions rewritten |
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Banner copy, scope placeholder |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | Section title "Change Log", empty state copy |
| `src/components/app/CollectionsPickerView.tsx` | Card + table views reordered for confidence story |

## Build Verification

- `npx tsc --noEmit` — pass (only pre-existing e2e error)
- `npm run build` — pass
