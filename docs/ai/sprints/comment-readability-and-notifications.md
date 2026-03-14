# Sprint: Comment Readability + Email Notifications (Phases 1–3)

**Date:** 2026-03-13
**Scope:** Comment font size/contrast fixes, notification schema, @user mention system

---

## Issue Tracker

| ID | Title | Status | Claude Verified | Codex Verified |
|----|-------|--------|-----------------|----------------|
| CN-001 | Bump comment font sizes on option tiles (IdeasBoard) | done | yes | pending |
| CN-002 | Bump CommentCard font sizes/contrast (CommentThread) | done | yes | pending |
| CN-003 | Add CommentMention + EmailNotification Prisma models | done | yes | pending |
| CN-004 | Add User notification preference fields | done | yes | pending |
| CN-005 | Add /api/user/notification-preferences endpoint | done | yes | pending |
| CN-006 | Add notification toggles to Settings page | done | yes | pending |
| CN-007 | Add /api/collections/[id]/members endpoint | done | yes | pending |
| CN-008 | Build MentionPicker component + useCollectionMembers hook | done | yes | pending |
| CN-009 | Integrate mention picker into CommentThread textarea | done | yes | pending |
| CN-010 | Add mention chip rendering in CommentCard | done | yes | pending |
| CN-011 | Update POST comment handler to parse mentions + create rows | done | yes | pending |

---

## Acceptance Criteria

### CN-001: IdeasBoard comment readability
- Comment preview: `text-xs text-cream/55` (was `text-[10px] text-cream/45`)
- Author name: `text-cream/70` (was `text-cream/55`)
- Badge: `text-[11px]` (was `text-[10px]`)
- Inline textarea: `text-sm` (was `text-xs`)
- Buttons: `text-[11px]` or `text-xs` (was `text-[10px]`)
- File: `src/app/app/tools/finish-decisions/components/IdeasBoard.tsx`

### CN-002: CommentThread CommentCard readability
- Body: `text-sm text-cream/90 pl-8` no line-clamp (was `text-cream/80 line-clamp-5 pl-7`)
- Author: `text-xs text-cream/85` (was `text-cream/75`)
- Timestamp: `text-[11px] text-cream/40` (was `text-[10px] text-cream/35`)
- Avatar: `w-6 h-6 text-[11px]` (was `w-5 h-5 text-[10px]`)
- File: `src/components/app/CommentThread.tsx`

### CN-003: CommentMention model
- `CommentMention { id, commentId, userId, createdAt }` with `@@unique([commentId, userId])`
- `EmailNotification { id, userId, type, commentId?, sentAt }` with `NotificationType` enum
- Migration runs successfully on Neon

### CN-004: User notification fields
- `notifyOnMention Boolean @default(true)`
- `notifyDailyDigest Boolean @default(true)`
- `notificationUnsubToken String? @unique @default(cuid())`

### CN-005: Notification preferences API
- `GET /api/user/notification-preferences` returns `{ notifyOnMention, notifyDailyDigest }`
- `PUT /api/user/notification-preferences` updates both fields
- Auth required

### CN-006: Settings UI
- Notification toggles appear in Settings page under "Notifications" section
- Toggle states sync with API

### CN-007: Members endpoint
- `GET /api/collections/[id]/members` returns `[{ id, name, image }]`
- Includes project owner + ToolCollectionMember users
- Requires at least VIEWER access

### CN-008: MentionPicker component
- Floating popover triggered by `@` in textarea
- Filters members as user types after `@`
- On selection: inserts `@[Name](userId)` into text
- Desktop: popover; Mobile: same popover (positioned above textarea)

### CN-009: CommentThread integration
- New `collectionId` prop on CommentThread and CollapsibleCommentSidebar
- `@` detection in textarea triggers MentionPicker
- Selection inserts mention text and closes picker
- All callers pass collectionId: DecisionDetail, OptionDetail, Punchlist, ProjectSummary, ChangeDetail, MoodBoards

### CN-010: Mention rendering
- `@[Name](userId)` in comment text renders as sandstone-colored chip (`text-sandstone bg-sandstone/10`)
- Non-clickable (no user profile pages yet)
- Uses `renderTextWithMentions()` helper with regex parsing

### CN-011: POST comment handler
- Parse `@[Name](userId)` from text
- Create `CommentMention` rows (fire-and-forget, skip duplicates)
- Self-mentions excluded
- (Email sending deferred to Phase 4)

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/app/tools/finish-decisions/components/IdeasBoard.tsx` | CN-001: Bumped font sizes/contrast |
| `src/components/app/CommentThread.tsx` | CN-002, CN-009, CN-010: Readability + mention picker integration + mention rendering |
| `prisma/schema.prisma` | CN-003, CN-004: CommentMention, EmailNotification, User fields |
| `src/app/api/user/notification-preferences/route.ts` | CN-005: GET/PUT notification prefs |
| `src/app/app/settings/SettingsContent.tsx` | CN-006: Notification toggles UI |
| `src/app/api/collections/[id]/members/route.ts` | CN-007: Members endpoint |
| `src/hooks/useCollectionMembers.ts` | CN-008: Collection members hook |
| `src/components/app/MentionPicker.tsx` | CN-008: Mention picker component |
| `src/components/app/CollapsibleCommentSidebar.tsx` | CN-009: Pass through collectionId |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailContent.tsx` | CN-009: Wire collectionId |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/option/[optionId]/OptionDetailContent.tsx` | CN-009: Wire collectionId |
| `src/app/app/tools/punchlist/ToolContent.tsx` | CN-009: Wire collectionId |
| `src/app/app/tools/project-summary/ToolContent.tsx` | CN-009: Wire collectionId |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | CN-009: Wire collectionId |
| `src/app/app/tools/mood-boards/components/BoardDetailView.tsx` | CN-009: Wire collectionId |
| `src/app/api/collections/[id]/comments/route.ts` | CN-011: Parse mentions, create CommentMention rows |

---

## Build Verification

- [x] `npx tsc --noEmit` passes (pre-existing e2e error only)
- [x] `npm run build` passes
