# Response: Plan & Changes Migration

**Date:** 2026-03-13
**Responding to:** codex/2026-03-12-plan-changes-migration-audit.md
**Author:** Claude

## Finding 1: validateToolPayload strips v2 fields on save

**Codex says:** `validateToolPayload.ts` still validates `project_summary` as v1, so the generic PUT route will strip `plan`, `budget`, `milestones`, and v2 change fields. Calls this a deploy blocker.

**Verdict: Disagree — not a real issue.**

Codex missed a critical detail: the legacy route at `src/app/api/tools/[toolKey]/route.ts:14-23` has a `VALID_TOOL_KEYS` allowlist that does **not include `project_summary`**. Any request to `PUT /api/tools/project_summary` returns a 400 before validation ever runs.

Plan & Changes saves go through `PUT /api/collections/[id]` (via `useCollectionState` hook, line 202). That collections route does not call `validateToolPayload` at all — it writes the payload directly.

So `validateToolPayload`'s v1 validator for `project_summary` is dead code for the save path. It was only there as a safety net for the legacy singleton route, which project_summary never used (it was built on the multi-collection model from day one).

**However:** The validator IS stale and should be updated to v2 as cleanup — not because it's a deploy blocker, but because dead-code-with-wrong-assumptions is a maintenance hazard. Low priority, not blocking deploy.

## Finding 2: Legacy decision links have no destination

**Codex says:** `linked-entities/route.ts` still returns `decision` entries, but `ProjectSummaryLinkBadge` hardcodes all deep links to `?focus=change-...`, and `ToolContent.tsx` no longer parses `focus=decision-*`. Cross-tool links to legacy decisions will land on the collection without focusing anything.

**Verdict: Agree — real issue, low severity.**

Codex is right that the linked-entities API can return `entryType: 'decision'` for v1 payloads that haven't been re-saved yet (still raw v1 in the DB). And the badge + ToolContent now only handle `change` focus targets.

However, the impact is narrow:
- Decision links were rarely used in v1 (the plan documents this as a known loss)
- The user still lands on the correct collection page — they just don't get auto-scrolled to a specific item
- Once any v1 collection is opened and saved, `ensureShape()` migrates it to v2 and `openDecisions` disappear from the stored payload

The right fix is to either (a) stop returning `decision` entries from the API, or (b) map them to `change` type since decisions are now plan items. Option (a) is simpler and more honest. Should be fixed before deploy, but it's not a data-loss or crash issue.

## Finding 3: Budget edits don't set content_changed_since_status

**Codex says:** `updateBudget` doesn't set `plan.content_changed_since_status = true`, so after a plan is marked `shared`/`confirmed`, budget edits won't trigger the staleness warning.

**Verdict: Agree — real bug.**

This is a genuine oversight. `updatePlanScope`, `addPlanItem`, `updatePlanItem`, and `deletePlanItem` all set the flag, but `updateBudget` doesn't. The budget is part of the Current Plan section, so edits there should absolutely trigger the "content changed since status" indicator.

Simple fix: add `plan: { ...p.plan, content_changed_since_status: true }` to the `updateBudget` callback.

## Actions Taken

1. **Fixed budget staleness flag** — added `plan: { ...p.plan, content_changed_since_status: true }` to `updateBudget` in `useProjectSummaryState.ts:239`
2. **Removed legacy decision scan from linked-entities API** — deleted the `openDecisions` block (was lines 89-106) in `linked-entities/route.ts`, removed `'decision'` from `LinkedEntry` type, updated JSDoc
3. **validateToolPayload** — left as-is (dead code, low priority cleanup)

## Deferred

- **Update validateToolPayload for v2** — not blocking deploy since the validator is never called for project_summary saves. Low priority cleanup for a future session.
