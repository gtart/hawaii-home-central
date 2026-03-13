# Regression Checklist

Run after any significant change. Not every item applies every time -- use judgment.

## Core Flows
- [ ] Sign in with Google -> lands on /app dashboard
- [ ] Create new project -> appears in project switcher
- [ ] Switch projects -> tools show correct project's data
- [ ] Each tool: create collection -> add items -> edit -> save -> reload -> data persists

## Cross-Tool Integration
- [ ] Create PS entry from Selections detail page -> PS opens with prefill draft
- [ ] Create PS entry from Fix List -> PS opens with prefill draft
- [ ] PS link badge appears on linked Selections/Fix List items
- [ ] Activity feed shows events from all tools with correct labels
- [ ] Sidebar nav shows all tools with correct names

## Sharing
- [ ] Create share link -> open in incognito -> public view renders
- [ ] Scoped share (specific selections) -> only scoped items visible
- [ ] Invite collaborator -> accept invite -> correct access level (EDIT/VIEW)

## Comments
- [ ] Add comment on selection -> appears in sidebar
- [ ] Add comment on change (PS) -> appears on change detail page
- [ ] Delete comment -> removed from UI and DB
- [ ] System comments appear on status changes

## Project Summary / Plan & Changes
- [ ] Collection picker shows all collections for project
- [ ] InstanceSwitcher allows switching between collections
- [ ] Changes: add, edit, cycle status, delete
- [ ] Change detail page: loads, inline editing works, attachments work
- [ ] Documents: add (URL and file upload), edit, delete
- [ ] Open Decisions: add, cycle through 5 statuses, delete
- [ ] Budget section: baseline amount, approved changes cost auto-calculated, current total derived
- [ ] Cross-tool link pills render and navigate correctly
- [ ] Deep linking via ?focus= query params works

## Build Verification
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] No console errors in browser dev tools on key pages
