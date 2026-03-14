# Sprint: {Sprint Name}

**Date**: YYYY-MM-DD
**Objective**: {1-2 sentence goal}
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| {PREFIX}-001 | {title} | P1 | todo | pending | pending | — | — | — |
| {PREFIX}-002 | {title} | P1 | todo | pending | pending | — | — | — |

### Status values
- `todo`, `in_progress`, `blocked`, `done`, `needs_followup`

### Claude Verified values
- `pending`, `pass`, `fail`

### Codex Verified values
- `pending`, `pass`, `concern`, `fail`

### Follow-up values
- `none`, `claude_fix`, `new_issue`, `deferred`

---

## Acceptance Criteria

### {PREFIX}-001: {Title}
- {Criterion 1 — specific file, behavior, or copy to verify}
- {Criterion 2}
- **Files**: `{path/to/file.tsx}`

### {PREFIX}-002: {Title}
- {Criterion 1}
- **Files**: `{path/to/file.tsx}`

---

## Files Changed

| File | Change |
|------|--------|
| `{path}` | {what changed} |

---

## Build Verification

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop verified
- [ ] Mobile verified
- {Add specific QA checks as needed}

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/YYYY-MM-DD-topic-audit.md` |
| Claude Response | `docs/ai/reviews/claude/YYYY-MM-DD-topic-response.md` |

---

## Scope Change Log

| Date | Issue | Classification | Reason |
|------|-------|---------------|--------|
| — | — | — | — |

---

## Sprint Closure Checklist

- [ ] Every in-scope issue is `done` or explicitly moved out
- [ ] Every completed issue: `Claude Verified: pass`
- [ ] Every completed issue: `Codex Verified: pass`
- [ ] Every issue's `Follow-up` is explicit
- [ ] Build/typecheck recorded
- [ ] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
