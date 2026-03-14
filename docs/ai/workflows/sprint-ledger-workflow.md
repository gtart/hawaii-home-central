# Sprint Ledger Workflow

How Claude and Codex coordinate work through a shared sprint ledger.

## Purpose

Claude and Codex do not talk to each other directly. They coordinate through:
1. `docs/ai/active-sprint.md` — pointer to the active sprint and its handoff state
2. The active sprint doc — the live issue ledger (source of truth during a sprint)
3. Codex audit files — narrative review artifacts in `docs/ai/reviews/codex/`
4. Claude response files — response to Codex findings in `docs/ai/reviews/claude/`

## Source of Truth

| What | Where | When |
|------|-------|------|
| In-sprint execution | Sprint doc issue ledger | During an active sprint |
| Backlog / future work | GitHub Issues | Always |
| Out-of-sprint discoveries | GitHub Issues | During or after sprints |
| Review narrative | Codex audit files | After Codex review |
| Follow-up narrative | Claude response files | After Claude addresses findings |

The sprint doc is **not** a duplicate of GitHub Issues. It is the live execution surface for the current sprint only.

## Ledger Fields

Every issue in the sprint ledger uses these fields:

| Field | Description | Values |
|-------|-------------|--------|
| **ID** | Sprint-prefixed identifier | e.g., `PLAN-001`, `CN-003` |
| **Title** | Short description | Free text |
| **Priority** | Urgency | `P0`, `P1`, `P2`, `P3` |
| **Status** | Implementation state | `todo`, `in_progress`, `blocked`, `done`, `needs_followup` |
| **Claude Verified** | Claude's self-check | `pending`, `pass`, `fail` |
| **Codex Verified** | Codex's independent check | `pending`, `pass`, `concern`, `fail` |
| **Codex Notes** | Short review finding | Free text (1-2 sentences) |
| **Follow-up** | What happens next | `none`, `claude_fix`, `new_issue`, `deferred` |
| **Files** | Key files touched | File paths |

## Sprint Lifecycle

### 1. Sprint Start

**When to create a sprint** — A sprint is required when the request:
- Includes multiple issues or changes
- Affects UI/UX, workflows, or architecture
- Spans multiple files or implementation steps
- Should be reviewed by Codex
- Should be tracked to completion

**Tiny fixes** (single file, no review needed) can skip the sprint process.

**A sprint is officially started when ALL of these are true:**
- A sprint doc exists in `docs/ai/sprints/` (use `docs/ai/sprints/_template.md`)
- The sprint has a clear name and goal
- The issue ledger is populated with IDs, priorities, and acceptance criteria
- `docs/ai/active-sprint.md` points to the sprint with status `implementation`

### 2. Implementation (Claude)

Claude works from the sprint ledger:
1. Read `docs/ai/active-sprint.md` → open the sprint doc
2. Pick the highest-priority `todo` issue
3. Set Status → `in_progress`
4. Implement the change
5. Self-verify against acceptance criteria
6. Set Status → `done`, Claude Verified → `pass` (or `fail` if criteria not met)
7. Update Files column
8. Repeat for next issue

### 3. Handoff to Codex

When all issues are implemented and Claude-verified:
1. Run `npx tsc --noEmit` and `npm run build` — record in Build Verification
2. Set all `Codex Verified` to `pending`
3. Update `docs/ai/active-sprint.md`: status → `ready_for_codex`, add commit hash
4. Commit the sprint doc and active-sprint.md

The user then prompts Codex to review.

### 4. Codex Review

Codex validates each issue against acceptance criteria:
1. Read `docs/ai/active-sprint.md` → open the sprint doc
2. For each issue: read acceptance criteria → read code → verify
3. Update ledger fields: `Codex Verified`, `Codex Notes`, `Follow-up`
4. Write a narrative audit file to `docs/ai/reviews/codex/YYYY-MM-DD-topic-audit.md`

After Codex finishes, `docs/ai/active-sprint.md` status becomes `codex_reviewed`.

### 5. Claude Follow-up

If any issues have `Follow-up: claude_fix`:
1. Read the Codex audit and the sprint ledger notes
2. Fix the flagged issues
3. Re-verify and update `Claude Verified`
4. Update `docs/ai/active-sprint.md`: status → `followup_in_progress`
5. Write a response to `docs/ai/reviews/claude/YYYY-MM-DD-topic-response.md`
6. When fixes are done, set status → `ready_for_codex` for re-review if needed

### 6. Sprint Closure

A sprint is closed only when ALL of these are true:
- [ ] Every in-scope issue has Status `done` or is explicitly moved out of sprint
- [ ] Every completed issue has `Claude Verified: pass`
- [ ] Every completed issue has `Codex Verified: pass`
- [ ] Every issue's `Follow-up` is explicit (not blank)
- [ ] Build/typecheck results are recorded
- [ ] Latest Codex audit path is linked in the sprint doc
- [ ] Latest Claude response path is linked (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status is set to `complete`

### 7. Mid-Sprint Issue Handling

If a new issue surfaces during a sprint, classify it immediately:

| Classification | Action |
|---------------|--------|
| **In-scope** | Add to current sprint ledger with full fields; log in Scope Change Log |
| **Out-of-scope** | Create GitHub Issue or log as `Follow-up: new_issue` on a related issue |
| **Too large** | Requires a separate sprint; log as `Follow-up: deferred` |

Never let issues drift untracked in chat. Log every classification in the sprint doc's Scope Change Log section.

## Sprint Status Flow

```
implementation → ready_for_codex → codex_reviewed → followup_in_progress → ready_for_codex → ... → complete
```

Only the `complete` status means the sprint is closed. All other statuses mean work is ongoing.
