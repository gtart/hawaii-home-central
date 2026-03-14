# AI Review Ledger

Cross-AI review system for Hawaii Home Central. Codex validates issues in the sprint ledger and writes narrative audit files; Claude reads findings and responds.

## How Reviews Fit the Sprint Workflow

Reviews are part of the sprint lifecycle, not a standalone process:

1. **Sprint ledger** = the live checklist (Codex updates `Codex Verified`, `Codex Notes`, `Follow-up` per issue)
2. **Codex audit file** = narrative review artifact with reasoning, journey assessment, and recommendations
3. **Claude response file** = what Claude did about Codex's findings

The sprint ledger is the source of truth for issue-by-issue pass/fail. The audit file adds context.

See `docs/ai/workflows/sprint-ledger-workflow.md` for the full lifecycle.

## Directory Structure

```
docs/ai/reviews/
  codex/       # Narrative audit reviews written by Codex
  claude/      # Responses written by Claude
```

## Filename Convention

- Codex audits: `codex/YYYY-MM-DD-topic-audit.md`
- Claude responses: `claude/YYYY-MM-DD-topic-response.md`

## Codex Audit Format

Audit files follow `docs/ai/review-templates/hhc-review-template.md` for structure and `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` for lens.

See `AGENTS.md` for the full required format.

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

1. **Claude finishes implementation** → updates sprint ledger, sets `active-sprint.md` status to `ready_for_codex`
2. **User prompts Codex** → Codex reads `active-sprint.md` → sprint doc → validates each issue → updates sprint ledger fields → writes audit to `codex/`
3. **User prompts Claude** → Claude reads Codex audit + sprint ledger notes → fixes `claude_fix` items → writes response to `claude/`
4. **Reviews persist** in the repo for future sessions

## Instructions

- **Codex:** See `AGENTS.md` for full review instructions. Update the sprint ledger first, then write the narrative audit.
- **Claude:** When asked to respond to a Codex review, read `active-sprint.md` → sprint doc ledger → latest Codex audit → act on findings → write response.
