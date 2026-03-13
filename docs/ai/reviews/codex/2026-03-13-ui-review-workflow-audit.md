# Audit: UI Review Workflow

**Date:** 2026-03-13
**Reviewer:** Codex
**Scope:** Current uncommitted UI-review workflow changes in [AGENTS.md](/home/greggtarter/HIhomecentral/AGENTS.md), [CLAUDE.md](/home/greggtarter/HIhomecentral/CLAUDE.md), [package.json](/home/greggtarter/HIhomecentral/package.json), [docs/ai/ui-reviews/README.md](/home/greggtarter/HIhomecentral/docs/ai/ui-reviews/README.md), [e2e/app-ui-review.spec.ts](/home/greggtarter/HIhomecentral/e2e/app-ui-review.spec.ts), [scripts/run-ui-review.sh](/home/greggtarter/HIhomecentral/scripts/run-ui-review.sh), [scripts/build-ui-review-zip.py](/home/greggtarter/HIhomecentral/scripts/build-ui-review-zip.py), and [.claude/agents/homeowner-ui-reviewer.md](/home/greggtarter/HIhomecentral/.claude/agents/homeowner-ui-reviewer.md). Excluded unrelated untracked [V4_ARCHITECTURE_REVIEW.md](/home/greggtarter/HIhomecentral/V4_ARCHITECTURE_REVIEW.md) and [e2e/app-selection-ui-audit.spec.ts](/home/greggtarter/HIhomecentral/e2e/app-selection-ui-audit.spec.ts).
**Trigger:** User request to review what Claude recently did

## Materials Reviewed

- [AGENTS.md](/home/greggtarter/HIhomecentral/AGENTS.md) — new UI review workflow instructions for Codex
- [CLAUDE.md](/home/greggtarter/HIhomecentral/CLAUDE.md) — new Claude handoff pointers for UI reviews
- [package.json](/home/greggtarter/HIhomecentral/package.json) — added review scripts
- [docs/ai/ui-reviews/README.md](/home/greggtarter/HIhomecentral/docs/ai/ui-reviews/README.md) — workflow, commands, and handoff contract
- [e2e/app-ui-review.spec.ts](/home/greggtarter/HIhomecentral/e2e/app-ui-review.spec.ts) — screenshot harness for homepage and tool flows
- [scripts/run-ui-review.sh](/home/greggtarter/HIhomecentral/scripts/run-ui-review.sh) — wrapper for scope selection, Node guard, and zip packaging
- [scripts/build-ui-review-zip.py](/home/greggtarter/HIhomecentral/scripts/build-ui-review-zip.py) — artifact zipper
- [.claude/agents/homeowner-ui-reviewer.md](/home/greggtarter/HIhomecentral/.claude/agents/homeowner-ui-reviewer.md) — homeowner-first review lens for Claude
- Relevant context docs: [docs/ai/active-sprint.md](/home/greggtarter/HIhomecentral/docs/ai/active-sprint.md), [docs/ai/sprints/homeowner-homepage-design-sprint.md](/home/greggtarter/HIhomecentral/docs/ai/sprints/homeowner-homepage-design-sprint.md), [docs/ai/project-context.md](/home/greggtarter/HIhomecentral/docs/ai/project-context.md), [docs/ai/review-rubrics/hhc-homeowner-ux-review.md](/home/greggtarter/HIhomecentral/docs/ai/review-rubrics/hhc-homeowner-ux-review.md), [docs/ai/review-templates/hhc-review-template.md](/home/greggtarter/HIhomecentral/docs/ai/review-templates/hhc-review-template.md), [docs/ai/reviews/README.md](/home/greggtarter/HIhomecentral/docs/ai/reviews/README.md)
- Validation run: `./scripts/run-ui-review.sh list` works; `python3 -m py_compile scripts/build-ui-review-zip.py` passes; local Node is `v18.20.4`, so local screenshot runs are correctly blocked by the wrapper

## Overall Verdict

The direction is good: Claude added a real, repo-local UI review workflow instead of treating UI review as an informal promise. The problem is that the current harness still does not reliably produce the complete homeowner-facing evidence it claims to produce, especially for dual-device runs and Plan & Changes review depth. As written, this is useful scaffolding, but not yet a dependable screenshot-backed review system.

## What The Feature Appears To Be For

This appears to give Codex and Claude a repeatable way to capture desktop and mobile screenshots, bundle them into a zip, and write homeowner-first UI findings that future sessions can inspect without guessing what was reviewed.

## User Journey Assessment

- The overall workflow is understandable: pick a scope, run one command, get screenshots, a zip, and a findings location.
- The problem is that the actual Plan & Changes journey is under-captured. The harness reaches the landing page, a collection top state, a mid-scroll state, and maybe one change detail, but it does not deliberately review the homeowner path through plan approval, changes as a log, artifacts, comments, or open items.
- For the feature most likely to need architectural and copy review, the evidence set is too thin. A reviewer can still form opinions, but the workflow does not reliably surface the exact screens where homeowner confusion is most likely.

## Mobile UX Assessment

- The workflow correctly intends to run both authenticated desktop and authenticated mobile projects.
- The artifact contract is currently unreliable for dual-device runs, so a reviewer may think they are looking at both device classes when the generated manifest/gallery only reflects one of them.
- The screenshot strategy also favors a few viewport captures over copy-heavy section coverage, which is especially weak on mobile where important context is often lower on the page.

## Desktop UX Assessment

- The wrapper and gallery output are straightforward and should be easy to use on desktop.
- Desktop review is still shallow for long, information-dense screens because the harness mostly takes top and mid-scroll screenshots rather than structured section captures.
- For homepage review this is acceptable. For Plan & Changes, it is not enough to support strong judgments about hierarchy, clarity, and information ownership.

## Copy / Labeling Assessment

- The workflow docs and agent instructions correctly emphasize homeowner language, calmness, trust, and anti-enterprise-PM drift.
- The harness itself does not yet capture copy-rich states in a deliberate way. For Plan & Changes, it misses the exact surfaces where copy matters most: approval language, open items framing, artifacts/comments ownership, and status explanation.
- That means the system is philosophically copy-aware, but operationally still screenshot-light on the parts of the app where copy drives comprehension.

## Trust / Record-Keeping Assessment

- The strongest trust problem is in the artifact generation itself: the workflow promises a single screenshot bundle and gallery for desktop and mobile, but the manifest/index generation is process-local and can be overwritten.
- If a reviewer or Claude opens the gallery later, they may believe they are seeing the whole review set when one device's screenshots are missing from the manifest.
- For a review system meant to be durable and inspectable later, that is a real record-keeping flaw.

## Top Issues

1. **Dual-device runs can overwrite the gallery and manifest**
   Severity: High
   Confidence: High
   Why it matters: The README and wrapper promise one artifact bundle containing desktop and mobile review evidence, but [e2e/app-ui-review.spec.ts](/home/greggtarter/HIhomecentral/e2e/app-ui-review.spec.ts#L34) stores entries in a process-local array and writes [manifest.json](/home/greggtarter/HIhomecentral/e2e/app-ui-review.spec.ts#L193) and `index.html` in `test.afterAll()`. With [scripts/run-ui-review.sh](/home/greggtarter/HIhomecentral/scripts/run-ui-review.sh#L17) running both Playwright projects together, whichever project finishes last can overwrite the manifest/gallery with only its own entries. That makes the review record incomplete and misleading.
   Recommendation: Write per-project manifests and merge them after Playwright exits, or move gallery generation into the shell/Python wrapper so it reads the final artifact directory once both projects are done.

2. **Plan & Changes coverage is too shallow for the homeowner-first review goal**
   Severity: High
   Confidence: High
   Why it matters: The current `plan-summary` flow in [e2e/app-ui-review.spec.ts](/home/greggtarter/HIhomecentral/e2e/app-ui-review.spec.ts#L88) captures only the landing page, collection top, one mid-scroll state, and an optional change detail. It does not intentionally capture the plan state, approval/lock language, artifacts, comments, open items, or the relationship between plan and change log. For the app’s most structurally sensitive tool, this leaves the reviewer without the screens most likely to feel too complex to a homeowner.
   Recommendation: Expand `plan-summary` into an explicit journey: homepage entry point, collection overview, plan section, changes log, change detail, artifacts/comments surfaces, and open-items framing. Use seeded data or deterministic selectors so those states are actually present in the artifacts.

3. **The harness is not yet copy-focused enough to support the promised review lens**
   Severity: Medium
   Confidence: High
   Why it matters: The docs emphasize copy, empty states, and first-run comprehension, but most captures in [e2e/app-ui-review.spec.ts](/home/greggtarter/HIhomecentral/e2e/app-ui-review.spec.ts#L80) are top-of-page or fixed-offset screenshots. On long screens, especially Plan & Changes, that misses helper text, section headings, quiet states, and lower-page explanatory copy. The workflow therefore risks producing UI reviews that still over-index on visible layout instead of homeowner comprehension.
   Recommendation: Capture full-page screenshots for long-form screens or add targeted section-level snapshots with labels such as `plan-status`, `open-items`, `artifacts-comments`, and `empty-state`.

## Recommended Next Actions

- Fix manifest/index generation first so dual-device runs produce a trustworthy artifact record.
- Deepen the `plan-summary` scope into a real homeowner journey instead of a shallow page walk.
- Add section-specific or full-page captures for copy-heavy screens so the artifact set actually supports the homeowner-first rubric.

## Final Verdict

Mostly no. The review lens is well chosen, but the current screenshot workflow is not yet reliable or deep enough to consistently tell Claude whether the app feels like a simple, trustworthy homeowner renovation tool.
