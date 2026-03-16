# Audit: Public Positioning Reset Around Fix List

**Date:** 2026-03-16
**Reviewer:** Codex
**Scope:** Latest committed sprint work centered on `f487fd5` in the homepage, tools marketing page, login entry, and touched naming surfaces, reviewed against `docs/ai/sprints/public-positioning-reset-fix-list.md`.
**Trigger:** User request / sprint review

## Materials Reviewed

- `docs/ai/active-sprint.md` — active sprint pointer and handoff
- `docs/ai/sprints/public-positioning-reset-fix-list.md` — issue ledger and acceptance criteria
- `docs/ai/project-context.md` — homeowner audience and product principles
- `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` — homeowner-first review lens
- `docs/ai/review-templates/hhc-review-template.md` — audit structure
- `docs/ai/reviews/README.md` — review workflow
- `src/components/home/HeroSection.tsx`
- `src/components/home/FeatureCards.tsx`
- `src/components/home/WhatYouGetSection.tsx`
- `src/app/tools/page.tsx`
- `src/app/tools/ToolPreviewCards.tsx`
- `src/app/login/LoginContent.tsx`
- `src/lib/tool-registry.ts`
- `src/lib/activityHelpers.ts`
- `src/components/app/SidebarNav.tsx`
- `src/components/dashboard/DashboardCardPlanAndChanges.tsx`
- touched `project-summary` page/header/back-link files for naming consistency

## Overall Verdict

This mostly moves the public positioning in the right direction. The hero, tools page, and auth copy all feel more practical and homeowner-specific. One supporting-section line still pulls the homepage back toward the old guides/stories/directory framing.

## What The Feature Appears To Be For

This sprint appears to reset HHC’s public promise around one concrete wedge: helping homeowners keep track of what still needs fixing, while making the rest of the tools read as supporting systems for selections and plan changes.

## User Journey Assessment

- The homepage hero now tells a real homeowner story instead of making a broad renovation-platform claim.
- The tools page hierarchy is clearer: Fix List leads, Selections and Plan & Changes support the build, and the planning tools are visibly secondary.
- The auth entry now feels like entering a specific renovation workflow rather than a generic tool bundle.
- The weak point is the FeatureCards footer line, which still tells the user this is also about stories and a pros directory.

## Mobile UX Assessment

- The shorter, concrete homepage and login copy should hold up better on mobile than the previous broader messaging.
- The tools page hierarchy is simple enough to scan vertically on a phone.

## Desktop UX Assessment

- Desktop benefits from the stronger information hierarchy and clearer tool ordering.
- The leftover footer line under FeatureCards stands out more on desktop because it reads like a different product pitch from the cards above it.

## Copy / Labeling Assessment

- `Keep track of what still needs fixing` is a stronger, more ownable lead message.
- `Fix List`, `Selections`, and `Plan & Changes` are consistent across the touched surfaces I reviewed.
- The remaining `real homeowner stories` / `trusted pros directory` line is out of step with the sprint’s stated positioning reset.

## Trust / Record-Keeping Assessment

- This sprint improves trust by making the promise narrower and more believable.
- The leftover stories/directory footer weakens that trust a bit because it suggests the product is still trying to be a broader renovation hub.

## Top Issues

1. **Homepage supporting copy still reintroduces the old stories/directory positioning**
   Severity: Medium
   Confidence: High
   Why it matters: The sprint explicitly says the supporting sections should not read like generic guides/community/directory marketing. But after the stronger Fix List/Selections/Plan & Changes cards, the footer line in [FeatureCards.tsx](/home/greggtarter/HIhomecentral/src/components/home/FeatureCards.tsx#L55) still says `real homeowner stories` and `trusted pros directory`. That pulls the page back toward the vaguer public positioning this sprint was trying to retire.
   Recommendation: Replace that line with a calmer supporting statement that reinforces the practical-tool wedge, or remove it entirely.

## Recommended Next Actions

- Fix or remove the leftover stories/directory line in the homepage support section.
- After that, this sprint should be close to a clean pass.

## Final Verdict

Almost. The new positioning is materially better, but the homepage support section still contains one visible line from the old public story.
