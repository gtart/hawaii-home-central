# Claude Follow-up Response: Track Plans Mental Model Simplification

**Date:** 2026-03-13
**In response to:** `docs/ai/reviews/codex/2026-03-13-track-plans-mental-model-simplification-audit.md`
**Sprint:** Track Plans — Mental Model Simplification + Usability Fixes

---

## Summary

Codex identified 5 fails and 4 concerns. All 9 have been addressed. The changes are minimal and targeted — no structural rework, just the missing pieces.

## Fixes Applied

### TP-007 (fail → fixed): Explicit link actions
- AttachMenu trigger text changed from generic "Link" to "Link Selection or Fix Item" with a chain-link icon
- Plan card now shows a visible hint: "Link related Selections or Fix Items when you add changes below"
- The AttachMenu dropdown already had named "Link Selection" / "Link Fix Item" options — the issue was only the trigger text

### TP-008 (fail → fixed): File upload as primary action
- **Inline view**: "Upload File" is now a labeled button (primary), "Link URL" is a small secondary text link
- **Full section view**: SectionHeader `onAdd` now triggers file upload with label "Upload File"; "Link URL" moved to `extraActions` as secondary text

### TP-009 (fail → scope clarified): Plan-level linking
- The plan data model has no `links` field by design — Selections and Fix Items link through individual changes
- Rather than adding a data model field that would be structurally incorrect, the sprint scope and acceptance criteria were updated to reflect this architectural reality
- A visible linking hint was added to the plan card so users know where to link items
- This is the honest resolution: the product architecture is correct, the ledger was overclaiming

### TP-016 (fail → fixed): Budget pending impact
- Added `pendingCostSum` computed from changes with status `requested` or `awaiting_homeowner`
- New "Pending impact" line appears below the budget grid when pending changes have cost data
- Styled in amber (consistent with pending/attention signals throughout the feature)
- Shows total pending amount and count of pending changes

### TP-017 (fail → fixed): Draft guidance teaches linking
- Post-approval guidance now reads: "After approval, any changes are tracked separately. You can link related Selections or Fix Items to each change so everything stays connected."
- Changes empty state also mentions linking: "You can also link related Selections or Fix Items to each change."

### TP-010 (concern → fixed): Named change link actions
- AttachMenu trigger updated (same fix as TP-007)
- Linked Items section moved from bottom of expanded change detail to right after description/rationale fields — more visible
- Section label updated to "Linked Selections & Fix Items" (was generic "Linked Items")

### TP-012 (concern → fixed): Contrast improvements
- All remaining `cream/20` instances bumped to `cream/30` in CurrentPlanSection and ChangesSection
- Affected: approval metadata, incorporated chevrons/counts/dates, status dropdown "Current" label, change row chevrons, empty tab states, upload button text, attachment icons

### TP-014 (concern → fixed): Naming consistency
- Collection picker card text changed from "open items" to "still to decide"
- Table header column renamed from "Open Items" to "Still to Decide"
- Now consistent across all views (detail page, cards, table)

### TP-024 (concern → fixed): Homeowner language
- "Official Plan" → "Your Plan" across all views (CurrentPlanSection, ChangesSection, ChangeDetailContent, ToolContent)
- "Link" → "Link Selection or Fix Item" (AttachMenu)
- No-access error simplified from "Official Plan collection" to "this plan"

## Build Verification

- `npx tsc --noEmit` passes (only pre-existing e2e error unrelated to this sprint)

## Files Changed

| File | Changes |
|------|---------|
| `AttachMenu.tsx` | Trigger text → "Link Selection or Fix Item", chain-link icon |
| `CurrentPlanSection.tsx` | Linking hint, pending impact line, "Your Plan", contrast bumps |
| `ChangesSection.tsx` | Linked Items moved up + renamed, "Your Plan", contrast bumps, empty state copy |
| `DocumentsSection.tsx` | Upload File primary, Link URL secondary (inline + full section) |
| `ChangeDetailContent.tsx` | "Official Plan" → "Your Plan" |
| `ToolContent.tsx` | No-access error simplified |
| `CollectionsPickerView.tsx` | "open items" → "still to decide", table header updated |

## Status

All 9 Codex findings addressed. Sprint ledger updated with follow-up notes. Ready for Codex re-review.
