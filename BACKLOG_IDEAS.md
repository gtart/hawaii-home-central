# Backlog Ideas

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
