# Sprint: Plan & Changes Rebuild v1

**Product:** Hawaii Home Central
**Feature:** Plan & Changes
**Goal:** Rebuild this feature so it behaves like a trusted homeowner plan record with one official plan, formal changes, explicit open items, and a clear audit trail.

**Sprint started:** 2026-03-13
**Ledger:** `docs/ai/reviews/claude/plan-changes-v1-ledger.md`
**Phase reviews:** `docs/ai/reviews/claude/plan-changes-v1-phase-*-review.md`

---

## Phase Plan

| Phase | Objective | Issues |
|-------|-----------|--------|
| A | Product Model Reset | PCV1-001 through PCV1-008 |
| B | Open Items System | PCV1-009 through PCV1-014 |
| C | Record Ownership and Evidence | PCV1-015 through PCV1-019 |
| D | Main IA and Screen Rebuild | PCV1-020 through PCV1-029 |
| E | Copy, Status Language, and Homepage Signals | PCV1-030 through PCV1-041 |
| F | Change Record Quality, Schema Support, and Final Guardrails | PCV1-042 through PCV1-058 |

## Core Rules

1. Do not solve this with copy-only changes — product model and IA must improve
2. Do not oversimplify away audit/history — simplify user-facing model but preserve metadata
3. Do not silently retain overlapping truths — clearly communicate authoritative plan vs pending changes
4. Do not leave "Still to Decide" as a vague bucket — replace with explicit open-items model
5. After an approved plan exists, primary user action should trend toward Create Change

## Required Sequencing

Phases must execute A → B → C → D → E → F in order.
Partial overlap is allowed if architecturally necessary, but must be logged in ledger.
