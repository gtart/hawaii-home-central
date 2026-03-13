# AI Review Ledger

Cross-AI review system for Hawaii Home Central. Codex writes structured review files; Claude reads and responds to them.

## Directory Structure

```
docs/ai/reviews/
  codex/       # Audit reviews written by Codex
  claude/      # Responses written by Claude
```

## Filename Convention

- Codex audits: `codex/YYYY-MM-DD-topic-audit.md`
- Claude responses: `claude/YYYY-MM-DD-topic-response.md`

Examples:
- `codex/2026-03-13-plan-changes-migration-audit.md`
- `claude/2026-03-13-plan-changes-migration-response.md`

## Codex Audit Format

```markdown
# Audit: {topic}

**Date:** YYYY-MM-DD
**Reviewer:** Codex
**Scope:** {what was reviewed — be specific about files and changes}
**Trigger:** {user request / post-deploy / sprint close}

## Files Reviewed
{list of files with line counts or change summary}

## What Looks Solid
{brief, specific}

## What Is Questionable
{concerns that merit discussion}

## What Is Wrong
{bugs, logic errors, security issues, regressions}

## Recommendations
{prioritized, actionable}

## Safe for Next Phase?
{yes/no + reasoning}
```

## Claude Response Format

```markdown
# Response: {topic}

**Date:** YYYY-MM-DD
**Responding to:** codex/YYYY-MM-DD-topic-audit.md
**Author:** Claude

## Actions Taken
{what was fixed, changed, or investigated based on the review}

## Disagreements
{anything Claude disagrees with, and why}

## Deferred
{recommendations acknowledged but deferred, and why}
```

## Workflow

1. **User prompts Codex:** "Review the latest that Claude did for this repo."
2. **Codex reads** `AGENTS.md`, sprint docs, and touched files — writes an audit into `codex/`
3. **User prompts Claude:** "Go check out what Codex said about the app."
4. **Claude reads** the Codex audit from `codex/` — acts on findings and/or writes a response into `claude/`
5. **Reviews persist** in the repo for future sessions

## Instructions

- **Codex:** See `AGENTS.md` at repo root for full review instructions
- **Claude:** When asked to respond to a Codex review, read the latest file in `docs/ai/reviews/codex/`, act on findings, and write a response to `docs/ai/reviews/claude/`
