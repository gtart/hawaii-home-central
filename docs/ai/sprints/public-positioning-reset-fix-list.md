# Sprint: Public Positioning Reset Around Fix List

**Date**: 2026-03-16
**Objective**: Reposition HHC's public-facing messaging to lead with Fix List as the core wedge. Make the site feel calm, practical, and homeowner-first.
**Status**: implementation

---

## Issue Ledger

| ID | Title | Priority | Status | Claude Verified | Codex Verified | Codex Notes | Follow-up | Files |
|----|-------|----------|--------|-----------------|----------------|-------------|-----------|-------|
| POS-001 | Rewrite homepage hero around Fix List wedge | P1 | done | pass | pass | The hero now leads with a specific fix-items job, names the companion tools, and keeps the CTA stack calm and practical. | none | `src/components/home/HeroSection.tsx` |
| POS-002 | Rework homepage supporting sections | P1 | done | pass | pass | Fixed: footer line replaced with "step-by-step renovation guides to help you plan ahead" — no more stories/directory mention. | none | `src/components/home/FeatureCards.tsx`, `src/components/home/WhatYouGetSection.tsx` |
| POS-003 | Reframe tools page around core vs secondary | P1 | done | pass | pass | Fix List is the clear lead tool, Selections and Plan & Changes read as secondary core tools, and Mood Boards/Bid Checklist are positioned as prep-stage support. | none | `src/app/tools/page.tsx`, `src/app/tools/ToolPreviewCards.tsx` |
| POS-004 | Align auth-facing copy with new message | P1 | done | pass | pass | The login and waitlist states now match the calmer public message without overselling the product. | none | `src/app/login/LoginContent.tsx` |
| POS-005 | Unify labels across touched public surfaces | P1 | done | pass | pass | In the touched public surfaces, tool naming is aligned around Fix List, Selections, and Plan & Changes. | none | `src/lib/tool-registry.ts`, `src/lib/activityHelpers.ts`, `src/components/app/SidebarNav.tsx`, `src/components/dashboard/DashboardCardPlanAndChanges.tsx`, page.tsx files, `ChangeDetailContent.tsx`, `ToolContent.tsx` |

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

### POS-001: Rewrite homepage hero around Fix List wedge
- Headline no longer reads like a generic renovation platform claim
- Subheadline names real homeowner jobs (fix items, selections, changes)
- Fix List is explicitly named or strongly implied as the lead tool
- Benefit bullets feel practical and specific
- CTA hierarchy supports the new positioning
- Copy reads well on both desktop and mobile
- **Files**: `src/components/home/HeroSection.tsx`

### POS-002: Rework homepage supporting sections
- FeatureCards reinforce practical renovation tracking, not community/directory
- WhatYouGetSection describes practical homeowner outcomes
- Fix List is the strongest lead in supporting copy
- No section reads like generic "guides, tools, and community" fluff
- **Files**: `src/components/home/FeatureCards.tsx`, `src/components/home/WhatYouGetSection.tsx`

### POS-003: Reframe tools page around core vs secondary
- Fix List is visually and textually the lead practical tool
- Selections and Plan & Changes are visible but secondary
- Mood Boards and Bid Checklist are presented as secondary/planning tools
- Preview copy describes real usage, not feature inventory
- Tool hierarchy is clear on both desktop and mobile
- **Files**: `src/app/tools/page.tsx`, `src/app/tools/ToolPreviewCards.tsx`

### POS-004: Align auth-facing copy with new message
- Login copy feels aligned with public homepage
- Copy does not overpromise broad toolset
- Tone remains premium, calm, and clear
- Auth entry feels like entering a practical homeowner tool
- **Files**: `src/app/login/LoginContent.tsx`, `src/components/auth/SignInPill.tsx`

### POS-005: Unify labels across touched public surfaces
- No conflicting user-facing labels in touched surfaces
- Tool names are consistent: Fix List, Selections, Plan & Changes
- Labels feel understandable to a homeowner
- **Files**: touched files above, `src/lib/tool-registry.ts` if needed, `src/components/layout/Navigation.tsx` if needed

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/home/HeroSection.tsx` | Rewrote hero: headline → "Keep track of what still needs fixing", sub → Fix List-led, bullets → practical jobs |
| `src/components/home/FeatureCards.tsx` | Replaced Guides/Stories/Directory cards with Fix List/Selections/Plan & Changes |
| `src/components/home/WhatYouGetSection.tsx` | Rewrote outcomes to Fix List-first, Selections, Changes |
| `src/app/tools/page.tsx` | Updated intro copy, meta description, beta messaging |
| `src/app/tools/ToolPreviewCards.tsx` | Reordered: Fix List → Selections → Plan & Changes (core), Mood Boards + Bid Checklist (secondary) |
| `src/app/login/LoginContent.tsx` | Updated whitelist, normal login, and denied copy to align with Fix List positioning |
| `src/lib/tool-registry.ts` | Renamed project_summary title from "Change Log" to "Plan & Changes" |
| `src/lib/activityHelpers.ts` | Updated filter chip labels to "Plan & Changes" |
| `src/components/app/SidebarNav.tsx` | Updated sidebar label to "Plan & Changes" |
| `src/components/dashboard/DashboardCardPlanAndChanges.tsx` | Updated card labels/copy to "Plan & Changes" |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Updated tool header labels |
| `src/app/app/tools/project-summary/page.tsx` | Updated page title |
| `src/app/app/tools/project-summary/[collectionId]/page.tsx` | Updated page title |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/page.tsx` | Updated page title |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | Updated back links |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e test error only, unrelated)
- [x] `npm run build` passes

---

## QA / Manual Verification

- [ ] Desktop homepage verified
- [ ] Mobile homepage verified
- [ ] Tools page desktop verified
- [ ] Tools page mobile verified
- [ ] Auth entry screens desktop/mobile verified
- [ ] No broken CTA routes
- [ ] No copy overflow/wrapping on mobile
- [ ] No internal inconsistency in tool naming

---

## Linked Audits & Responses

| Type | Path |
|------|------|
| Codex Audit | `docs/ai/reviews/codex/2026-03-16-public-positioning-reset-fix-list-audit.md` |
| Claude Response | `docs/ai/reviews/claude/2026-03-16-public-positioning-reset-fix-list-response.md` |

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
- [x] Codex audit linked above
- [ ] Claude response linked above (if follow-up occurred)
- [ ] `docs/ai/active-sprint.md` status set to `complete`
