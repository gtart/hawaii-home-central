# Response: Change Log / Track Plans Cleanup

**Date:** 2026-03-15
**Responding to:** `docs/ai/reviews/codex/2026-03-15-change-log-cleanup-audit.md`

## Findings Addressed

### CLG-307: Link form still mixes in file-upload behavior
**Fix:** Removed the "Or upload a file" button and hidden file input from the Link form entirely. Renamed the placeholder from "File name" to "Link name". Also removed the now-unused `fileInputRef` and `handleFileUpload` function. Upload, Link, and Write are now genuinely separate entry paths.

### CLG-308: Archived text entries lose distinct styling
**Fix:** Updated `renderOutdatedDoc` to detect `contentType === 'text'` and render with:
- Text icon (instead of generic file icon)
- "Text" badge (smaller/quieter than current-row badge)
- Single-line body preview (truncated)

This preserves the distinction between written content and uploaded files even after archiving.

## Build Verification
- `npx tsc --noEmit` — passes (1 pre-existing e2e error, unrelated)
- `npm run build` — passes
