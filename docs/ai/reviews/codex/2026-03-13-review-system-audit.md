# Audit: HHC Review System

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Uncommitted review-system changes in `AGENTS.md`, `docs/ai/review-rubrics/hhc-homeowner-ux-review.md`, and `docs/ai/review-templates/hhc-review-template.md`. I did not audit unrelated untracked files (`V4_ARCHITECTURE_REVIEW.md`, `e2e/app-selection-ui-audit.spec.ts`) because they are outside the clearly scoped active-sprint review-workflow changes.
**Trigger:** User request

## Materials Reviewed

- `AGENTS.md` — review instructions were rewritten to require a homeowner-first lens and the new template/rubric
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — new HHC-specific rubric for journey, copy, mobile, desktop, simplicity, empty states, and trust
- `docs/ai/review-templates/hhc-review-template.md` — new standard audit structure
- `docs/ai/reviews/README.md` — existing ledger instructions, reviewed because it still governs review workflow and format
- Relevant context docs: `docs/ai/active-sprint.md`, `docs/ai/project-context.md`, `docs/ai/issues/P0.md`, `docs/ai/issues/P1.md`, `docs/ai/issues/P2.md`

## Overall Verdict

This is a meaningful improvement over the old generic review workflow. The new rubric is grounded in Hawaii Home Central’s actual users and pushes reviews toward journey clarity, simplicity, and trust instead of generic frontend commentary. The main problem is that the review system is now split across conflicting instructions, so future reviews can still drift unless the remaining old format guidance is brought into alignment.

## What The Feature Appears To Be For

This appears to formalize how Codex reviews HHC so future audits consistently judge whether the product feels calm, simple, and trustworthy for homeowners rather than merely “correct” from an engineering or SaaS UI perspective.

## User Journey Assessment

- The reviewer journey is much clearer than before: read the context, apply the homeowner rubric, and write the audit in a consistent format.
- The rubric does a good job of translating HHC’s user model into concrete review questions instead of abstract taste.
- The flow becomes confusing where the new review instructions meet the old ledger README, because a reviewer can still find two different audit formats in the repo.
- A first-time reviewer is likely to assume the README remains authoritative, which weakens the durability of this system.

## Mobile UX Assessment

- Not directly applicable to these meta-review docs.
- The useful part is that the rubric now forces future reviews to consider mobile as a real homeowner usage mode instead of an afterthought.
- The current instruction set should be careful not to force invented mobile commentary on non-user-facing changes.

## Desktop UX Assessment

- Not directly applicable to these meta-review docs.
- The rubric correctly frames desktop as a catch-up and comprehension surface for homeowners and collaborators, which is a better lens than generic “uses space well.”
- As with mobile, the system should allow “not applicable” cleanly when a change is not user-facing.

## Copy / Labeling Assessment

- The new rubric copy is strong: it is specific to renovation stress, spouse catch-up, contractor visibility, and enterprise-software creep.
- `AGENTS.md` is concise enough to be followed in practice.
- The wording in `AGENTS.md` is too absolute on required sections for every review, which can lead to filler instead of sharper audits on infrastructure or backend changes.

## Trust / Record-Keeping Assessment

- The new rubric improves trust in the review process because it explicitly asks whether HHC features behave like a durable homeowner record.
- The current documentation split hurts process trust: two competing review formats make it less clear what the canonical audit structure actually is.
- For a review system, instruction consistency is the equivalent of record-keeping accuracy. Right now that consistency is not complete.

## Top Issues

1. **Review format is now defined in two conflicting places**
   Severity: High
   Confidence: High
   Why it matters: A durable review system needs one authoritative format. Right now `AGENTS.md` requires the new HHC template, while `docs/ai/reviews/README.md` still documents the old `Files Reviewed / What Looks Solid / What Is Wrong` structure. That creates reviewer hesitation and makes future audits inconsistent.
   Recommendation: Update or replace the ledger README’s Codex audit format so it matches the new template exactly, or explicitly defer all format authority to `AGENTS.md` and say so in one sentence.

2. **The new instructions are too rigid for non-user-facing reviews**
   Severity: Medium
   Confidence: High
   Why it matters: `AGENTS.md` says every review must assess mobile UX, desktop UX, copy, empty states, and trust, even though many future reviews will be backend, infra, migration, or process work. That will push reviewers toward boilerplate “not really applicable” sections instead of high-signal findings.
   Recommendation: Keep the homeowner-first lens as the default for user-facing work, but explicitly allow abbreviated or N/A treatment for non-UI changes while still asking reviewers to call out any user-trust implications.

## Recommended Next Actions

- Align `docs/ai/reviews/README.md` with the new HHC template so there is one canonical audit format.
- Relax the absolute “every review must assess” wording in `AGENTS.md` so non-user-facing reviews stay sharp instead of ceremonial.
- Keep the rubric itself largely as-is; it is the strongest part of this change.

## Final Verdict

Mostly. This is much closer to a simple, trustworthy HHC review system, but it still needs one source of truth for audit format and a cleaner escape hatch for non-user-facing reviews.
