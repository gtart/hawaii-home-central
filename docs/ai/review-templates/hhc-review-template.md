# HHC Review Template

Use this template for future Codex reviews in `docs/ai/reviews/codex/YYYY-MM-DD-topic-audit.md`.

```markdown
# Audit: {topic}

**Date:** YYYY-MM-DD
**Reviewer:** Codex
**Scope:** {specific files / diffs / journey reviewed}
**Trigger:** {user request / post-deploy / sprint close}

## Materials Reviewed

- `path/to/file` — {what changed or why it matters}
- `path/to/file` — {what changed or why it matters}
- Relevant context docs: {active sprint, feature doc, migration doc, QA checklist if used}

## Overall Verdict

{2-4 sentences. Is this direction solid? Is it safe? Does it feel calm and understandable for a homeowner?}

## What The Feature Appears To Be For

{State the user-facing job in plain language. Example: “This appears to help a homeowner keep a clean record of scope and project changes so they can align with a contractor and spouse.”}

## User Journey Assessment

- {What is clear}
- {Where the flow becomes confusing}
- {What a first-time homeowner is likely to assume}
- {Whether the next action is obvious}

## Mobile UX Assessment

- {What works on phone-sized usage}
- {What is cramped, buried, or too fiddly}
- {Bottom sheets / dropdown / editing / scrolling concerns}

## Desktop UX Assessment

- {How well the layout uses space}
- {Whether the hierarchy helps catch-up and scanning}
- {Whether the UI feels homeowner-first or drifts into admin/PM tooling}

## Copy / Labeling Assessment

- {headings, labels, status names, helper text, buttons, warnings, empty states}
- {what is plain-language and what is not}
- {where the copy over-assumes user context}

## Trust / Record-Keeping Assessment

- {status traceability, timestamps, confirmation, shared/private clarity, authoritative record concerns}
- {whether this would help in a later homeowner/contractor disagreement}

## Top Issues

1. **{Title}**
   Severity: {Critical | High | Medium | Low}
   Confidence: {High | Medium | Low}
   Why it matters: {homeowner-centered explanation}
   Recommendation: {specific fix or next step}

2. **{Title}**
   Severity: {Critical | High | Medium | Low}
   Confidence: {High | Medium | Low}
   Why it matters: {homeowner-centered explanation}
   Recommendation: {specific fix or next step}

## Recommended Next Actions

- {highest-value next step}
- {second step}
- {validation or follow-up check}

## Final Verdict

{Yes/No/Mostly on whether this feels like a simple, trustworthy homeowner renovation tool, plus one short reason.}
```

## Notes

- Keep the tone direct.
- Use homeowner language, not generic SaaS critique.
- If the implementation is technically good but the journey or copy is weak, say that plainly.
- If the work is not user-facing, adapt the template but still call out any user-trust implications.
