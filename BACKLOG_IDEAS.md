# Backlog Ideas

## Guest Mode — Outside Collaborators (DEFERRED)

**Status**: Deferred. Foundation work (Comment table) can be done independently.
**Date discussed**: 2026-03-05

### Feature Summary

Allow outside collaborators (contractors, subs, cabinet shops, vendors, designers, spouses) to view shared content and leave comments **without creating an account**. Owners manage people and access, not piles of raw links.

### Key Decisions Made

1. **Collection-centric grants** (not project-level). A guest gets access to specific collections (a Fix List, a Selection List), not an entire project.
2. **One stable guest link per collaborator** that opens a simple landing page listing all their granted collections. Deep links skip the landing page and go directly to a specific item/comment.
3. **Two URL shapes**:
   - Stable entry: `/guest/<token>` → landing page with all granted collections
   - Deep link: `/guest/<token>/fix-list/<collectionId>/item/<itemId>` → direct to item
4. **View Links and Guest Links are separate systems**. View Links = read-only, anonymous, one link for many people (existing). Guest Links = named collaborator, can comment, one link per person (new).
5. **Comments must migrate to a proper DB table** (currently embedded in JSON blobs). This is a prerequisite — needed for deep links to comments, guest attribution, reply threading, future notifications.
6. **Guest identity via token-in-URL** (no cookie, no account). The `OutsideCollaborator` DB record is created by the owner. Token in URL maps to it. Audit trail logs device info (IP, user-agent).
7. **Stable collaborator ID for attribution** from day 1. Comments store `collaboratorId` + `displayNameAtTime` snapshot. Enables future "upgrade to Google account" without rewriting payloads.
8. **Mobile-first design** for the guest side (contractors on job sites, spouses on phones). Owner management UI can be desktop-first.
9. **No notification system in Phase 1**. Owner manually copies/shares links. "Copy link for [collaborator]" must be prominent in the UI.
10. **Grants do not go below collection level in Phase 1**. Deep links navigate within a granted collection but don't restrict visibility to a single item.

### Recommended Implementation Order

- **Phase 0 (can do now, independently)**: Migrate comments from JSON blobs to a `Comment` DB table. Improves existing app regardless of guest mode.
- **Phase 1**: OutsideCollaborator model, CollaboratorGrant model, guest landing page, deep link routing, owner "Add collaborator" UI, guest commenting.
- **Phase 2**: Item-level grant filtering (guest sees only specific items within a collection), cross-collection activity feed, "waiting on" concepts.
- **Phase 3**: "Continue with Google" upgrade path (identity merge via stable collaborator ID), optional email notifications.

### Architecture Notes (from codebase review)

- Current sharing: `ToolCollectionShareToken` (read-only public links) + `ToolCollectionInvite` (email invites for real users). Guest mode is a third path.
- Access control lives in `src/lib/collection-access.ts` and `src/lib/project-access.ts`. Guest access would need a new resolver (token-based, not session-based).
- Comments currently: `SelectionComment` and `RoomComment` interfaces in `src/data/finish-decisions.ts`, stored as arrays in collection JSON payloads. Mood boards also have embedded comments.
- Collections store all data as a single nested JSON payload — item-level grant filtering would mean API-layer filtering, not DB-level.

### Open Questions for Later

- Should guests be able to add Fix Items or only comment on existing ones?
- How granular should guest permissions be? (view / comment / upload / update status)
- Should there be a "guest has viewed this" read receipt for the owner?
- Rate limiting / abuse prevention for anonymous guest endpoints

## Account Storage Limits & File Manager (DEFERRED)

**Status**: Deferred. Add after current Track Plans redesign sprint.
**Date discussed**: 2026-03-13

### Feature Summary

Give each user a storage quota for files uploaded across all tools (Vercel Blob). Provide a simple file manager so users can see all their uploaded files in one place and easily delete old ones to free up space.

### Key Decisions Made

1. **Per-user storage limit** — each account gets an allotment (e.g., 500MB or 1GB). Limit enforced at upload time across all tools (mood boards, punchlist photos, plan documents, selection files, change order attachments).
2. **Cross-tool file browser** — a settings or account page showing all uploaded files grouped by tool, with file size, upload date, and a delete button. Deleting removes the file from Vercel Blob and updates the tool's JSON payload.
3. **Usage bar** — show current usage vs. quota on the file manager page and in settings. Show a warning when approaching the limit (e.g., 80%).
4. **Upload rejection** — when quota is exceeded, the upload helper returns a clear error message ("Storage limit reached. Delete old files to free up space.") rather than silently failing.
5. **All uploads go through client-side `@vercel/blob/client`** — the token handler (`handleUpload` in each tool's upload route) is the enforcement point. Check current usage before issuing a token.

### Recommended Implementation Order

- **Phase 1**: Add `storageUsedBytes` column to User model. Create a utility that sums blob sizes across all collections for a user. Wire into upload token handlers to reject when over quota.
- **Phase 2**: Build file manager page at `/app/settings/storage` — lists all blobs by tool with sizes, dates, delete buttons. Show usage bar.
- **Phase 3**: Add warning banners to upload UIs when approaching quota. Add quota info to settings page.

### Architecture Notes

- All upload routes now use `handleUpload` from `@vercel/blob/client` (converted March 2026). The `onBeforeGenerateToken` callback is the natural enforcement point.
- Blob URLs are stored in JSON payloads: `SummaryDocument.fileUrl`, `ChangeAttachment.url`, punchlist item photos, mood board images, selection files.
- Deleting a blob requires `del()` from `@vercel/blob` with the blob URL.
- Need to handle orphaned blobs (uploaded but never saved to payload) — consider a cleanup cron.

### Open Questions for Later

- What should the default quota be? (500MB? 1GB? Unlimited during beta?)
- Should there be paid tier upgrades for more storage?
- How to handle existing users who already exceed the quota when it's introduced?
- Should we track per-blob metadata in a DB table (BlobRecord) for faster queries, or scan payloads on demand?

## Google Photos Picker Integration (DEFERRED)

**Status**: Not implementing. Revisit later.
**Reason**: Too many privacy concerns to ship without a thorough compliance plan.

### Feature Summary

Allow desktop users to pick photos from their Google Photos library when adding punchlist items, using the Google Photos Picker API (`photospicker.mediaitems.readonly` scope). Photos would be downloaded and stored in Vercel Blob. Incremental authorization — only prompted when user clicks "Google Photos."

### Before Revisiting — Required Pre-Work

**1. OAuth Verification & Rollout Plan**
- Determine whether `photospicker.mediaitems.readonly` is classified as "sensitive" or "restricted" by Google. If so, the app must undergo Google's OAuth verification review before production use.
- Build a verification submission plan: privacy policy updates, homepage verification, domain verification, scope justification, demo video if required.
- Plan a phased rollout: internal/admin testing first, then limited beta, then general availability.

**2. Separate Photos Refresh Tokens from Login Tokens**
- The current Prisma Account model stores a single set of tokens per provider. If we add the photos scope via incremental auth, the refresh token gets overwritten with one that includes the photos scope.
- We need a separate storage mechanism for Google Photos tokens so that revoking photos access does not break the user's login session, and vice versa.
- Options: a new `GooglePhotosToken` table, or a secondary Account row with a different provider key (e.g., `google-photos`).

**3. Temporary URL Compliance with Picker Rules**
- The Picker API returns `baseUrl` values that are valid for 60 minutes and require a valid OAuth token.
- Our implementation must download photos within that window — no caching or storing of Google's temporary URLs.
- Stored photos must be our own copies in Vercel Blob, never references to Google's baseUrls.
- Verify that downloading and re-hosting user-selected photos complies with Google's Picker API Terms of Service.

**4. User Privacy Safeguards**
- Pre-consent disclosure dialog (our own, before Google's consent screen)
- "Disconnect Google Photos" option in app settings
- Real file deletion from Vercel Blob when photos are removed from punchlist items
- Privacy policy update at /privacy describing Google Photos data handling
- No background token usage — only in direct response to user action
