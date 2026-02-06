# Resources Hub — Internal Plan

## IA Changes
- Replaced separate "Guides" and "Tools" nav items with single "Resources" link
- `/guides` and `/tools` have 301 redirects to `/resources` in `next.config.ts`
- Fallback pages kept at both routes with "moved" notices
- Home page FeatureCards updated to point to `/resources`

## Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/resources` | Live | Hub page — Playbooks + Tools sections |
| `/resources/playbooks/fair-bid-checklist` | Live | Interactive checklist with email gate |
| `/guides` | 301 → `/resources` | Redirect |
| `/tools` | 301 → `/resources` | Redirect |

## Email Gate
- **Storage key**: `hhc_resources_unlocked_v1`
- **Behavior**: Shows preview + email form on first visit to any playbook; stores email in localStorage on submit; all playbooks unlock permanently
- **No backend**: Purely client-side via localStorage

## Share Feature
- Web Share API when supported; fallback share links
- Order: Copy link, Email, SMS, Facebook, Reddit, X
- Appears near playbook title

## localStorage Keys
| Key | Value | Purpose |
|-----|-------|---------|
| `hhc_resources_unlocked_v1` | email string | Email gate unlock |
| `hhc_checklist_state` | JSON `{ [id]: boolean }` | Checkbox persistence |

## SEO
- Metadata on `/resources` and `/resources/playbooks/fair-bid-checklist`
- Clean heading hierarchy: h1 > h2 > h3
- Natural Hawaiʻi keywords in titles and descriptions
- 301 redirects preserve link equity from old routes

## Upcoming Playbooks (Coming Soon)
- Pre-Contract Decision Checklist
- Specs That Must Be Complete Before Ordering
- Hidden Costs & Contingencies (Hawaiʻi Reality Check)
- Responsibility Matrix: Homeowner vs Contractor

## Upcoming Tools (Coming Soon)
- Project Binder
- Budget Tracker
- Project Reminders

## Open Questions / Backlog
- Email collection: consider adding a backend endpoint later to actually store emails
- Print/export: consider adding PDF export for checklists in a future iteration
- Analytics: track which checklist sections get most engagement
- Mobile: test expand/collapse UX on small screens
