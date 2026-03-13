# HHC UI Review Workflow

Use this workflow when you want a screenshot-backed UI review from a homeowner-first perspective.

## What This Produces

- Desktop and/or mobile screenshots in `e2e/artifacts/ui-review-<run-id>-<scope>/`
- `manifest.json` and `index.html` inside that artifact folder
- A zip archive beside it: `e2e/artifacts/ui-review-<run-id>-<scope>.zip`
- Written findings in `docs/ai/ui-reviews/findings/YYYY-MM-DD-<scope>-codex.md`

## Supported Scopes

- `everything`
- `homepage`
- `plan-summary`
- `selections`
- `fix-list`
- `mood-boards`
- `contract-checklist`

## Commands

Local runs need Node.js `>= 20.9.0` if Playwright is starting the app itself. If you are on an older Node version, point Playwright at an already running local/prod URL with `PLAYWRIGHT_BASE_URL`.

List available scopes:

```bash
./scripts/run-ui-review.sh list
```

Capture desktop + mobile for the whole app review:

```bash
./scripts/run-ui-review.sh everything both
```

Capture only Plan & Changes:

```bash
./scripts/run-ui-review.sh plan-summary both
```

Capture desktop only:

```bash
./scripts/run-ui-review.sh homepage desktop
```

Use a deployed site instead of local dev:

```bash
PLAYWRIGHT_BASE_URL="https://www.hawaiihomecentral.com" ./scripts/run-ui-review.sh everything both
```

## Review Lens

When reviewing screenshots, focus on:

- homeowner journey clarity
- mobile ergonomics
- desktop hierarchy
- copy, labels, helper text, and empty states
- whether the UI feels calm and simple instead of like enterprise PM software
- trust / record-keeping signals

Use `docs/ai/review-rubrics/hhc-homeowner-ux-review.md` as the primary rubric.

## Findings File Convention

Write findings into:

- `docs/ai/ui-reviews/findings/YYYY-MM-DD-everything-codex.md`
- `docs/ai/ui-reviews/findings/YYYY-MM-DD-plan-summary-codex.md`

Recommended sections:

- Scope
- Artifacts Reviewed
- Overall Verdict
- Journey
- Mobile
- Desktop
- Copy
- Empty States
- Trust / Record-Keeping
- Top Issues
- Recommended Next Actions

## Claude Handoff

Claude should treat `docs/ai/ui-reviews/findings/` as the authoritative folder for screenshot-backed UI review findings.

When asked to respond to a UI review:

1. Read the latest matching file in `docs/ai/ui-reviews/findings/`
2. Open the referenced `e2e/artifacts/ui-review-.../index.html` or `manifest.json`
3. Address the issues in code or respond in writing
