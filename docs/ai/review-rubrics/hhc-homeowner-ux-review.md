# HHC Homeowner UX Review Rubric

Use this rubric for any user-facing review in Hawaii Home Central. The goal is not “modern SaaS quality.” The goal is a calm, trustworthy renovation tool that helps homeowners make sense of messy real-world projects.

## Target Users

### Stressed homeowner

- Non-technical
- Making expensive decisions with incomplete information
- Often checking the app in short sessions between work, family, and contractor conversations
- Needs fast orientation: what this screen is, what changed, what to do next, what is safe to ignore

### Spouse / collaborator

- Not in the tool every day
- Needs to catch up quickly without reading a long history
- Needs plain language, visible status, and confidence that the record is current

### Contractor viewer

- May be invited to view or comment
- Needs clear, bounded information
- Must not become the primary audience; the tool should still feel homeowner-led

## Core Standard

The interface should feel like:
- a premium homeowner guide
- calm under pressure
- simple to scan on a phone
- reliable enough to use as the project record

It should not feel like:
- enterprise PM software
- a ticket queue
- a CRM
- a dense internal ops dashboard

## Review Questions

### 1. User Journey Clarity

Check:
- Can a first-time homeowner tell what this feature is for within a few seconds?
- Is the next useful action obvious?
- Does the screen explain the difference between reading, editing, sharing, confirming, and closing?
- Does the flow reduce uncertainty, or does it create new decisions the user must decode?
- If this feature spans multiple screens, does the path still make sense after navigation?

Flag when:
- the feature assumes the user already knows the workflow
- state transitions are visible but not explained
- important actions are technically present but not legible as the “next step”

### 2. Copy Clarity

Check:
- Do headings, labels, helper text, and button text use plain homeowner language?
- Are statuses understandable without internal product context?
- Does the copy explain meaning, not just system state?
- Are warnings and empty states specific about what happens next?

Flag when:
- labels sound like admin tooling or workflow software
- buttons are generic (`Save`, `Update`, `Submit`) when the action needs more context
- the wording is technically correct but emotionally unclear
- microcopy leaves ambiguity about whether something is final, shared, private, or visible to others

### 3. Mobile UX

Check against `docs/ai/qa/mobile-checklist.md`, then add product judgment:
- Can the core task be completed comfortably on a phone?
- Are touch targets large enough and grouped sensibly?
- Can the user scan the screen without getting trapped in dense forms?
- Do sheets, dropdowns, and inline edits behave well in short, thumb-driven sessions?
- Are key trust signals and status indicators visible without excessive scrolling?

Flag when:
- the flow technically works on mobile but feels cramped, fiddly, or exhausting
- a homeowner on a job site would need too much precision or too much reading
- important context disappears behind accordions, sheets, or long forms

### 4. Desktop UX

Check against `docs/ai/qa/desktop-checklist.md`, then add product judgment:
- Does desktop use extra space to improve comprehension rather than just stretching content?
- Are primary and secondary information clearly separated?
- Can a spouse/collaborator catch up quickly from a desktop screen?
- Do sidebars, timelines, comments, and metadata support confidence instead of noise?

Flag when:
- wide layouts feel empty, scattered, or admin-heavy
- important facts are buried because the layout treats everything equally
- the page looks like a data console rather than a homeowner tool

### 5. Simplicity / Low Cognitive Load

Check:
- How many concepts must the homeowner hold in their head at once?
- Does the screen simplify renovation reality, or mirror its chaos?
- Are there too many statuses, controls, or competing sections for the value provided?
- Is the feature helping the user decide, remember, or communicate?

Flag when:
- the UI introduces workflow ceremony without homeowner benefit
- too many controls are visible at once
- the design rewards power-user behavior more than clarity

### 6. Empty States and First-Run Comprehension

Check:
- Does an empty screen teach the user what belongs here?
- Is the first action obvious?
- Does the page explain why this tool matters in the renovation process?
- If there is prefilled or migrated data, is it still understandable to a new user?

Flag when:
- empty states are vague, decorative, or dead ends
- the screen assumes prior data exists
- a first-run user would not know what a “good” filled-out version looks like

### 7. Trust / Record-Keeping

Check:
- Can the homeowner trust this as a durable project record later?
- Is it clear what changed, when, and whether it was incorporated or confirmed?
- Are private vs shared contexts clear?
- Does the feature help resolve future disputes or confusion with contractors/spouses?

Flag when:
- timestamps, status history, ownership, or finality are missing where they matter
- the UI suggests certainty that the system does not actually preserve
- edits can happen without a clear sense of what is now authoritative

## Severity

### Critical

- Breaks trust, causes record-keeping failure, or can lead to costly homeowner misunderstanding
- Also use for severe mobile/desktop blockers on a core task

### High

- The feature’s main journey is confusing, misleading, or hard enough that many homeowners will hesitate or make mistakes

### Medium

- Noticeable friction, ambiguity, or cognitive load that weakens comprehension but does not fully break the task

### Low

- Polish issue, awkward wording, weak empty state, or layout issue that should be fixed but is not likely to derail the task

## Confidence

### High confidence

- Directly supported by the changed files, explicit UI copy, or a clear interaction path

### Medium confidence

- Strong inference from the implementation, but some runtime behavior or surrounding context was not fully observed

### Low confidence

- Plausible concern, but depends on assumptions about adjacent screens, unseen styling, or production behavior

## Writing Guidance

- State what job the homeowner thinks they are doing.
- Explain where the experience creates confusion, hesitation, or false confidence.
- Prefer concrete recommendations over abstract design critique.
- If the code is technically solid but the journey is weak, say so clearly.
- “Looks fine” is not a sufficient review outcome for user-facing work.
