# Claude Response: Project Change Log Sprint

**Date:** 2026-03-14
**In response to:** `docs/ai/reviews/codex/2026-03-14-project-change-log-audit.md`

## Findings Addressed

### 1. PCL-006 (fail → pass): Change log not summary-first on mobile; add form missing status

**Actions taken:**
- Added `StatusDropdown` to the add form so users can set status when logging a change (defaults to "Noted")
- Replaced `hidden md:inline` pattern on category/room with a visible-on-all-sizes second line below the title, using `text-[10px] text-cream/45` styling with a dot separator between category and room
- Mobile rows now show: title (first line), category · room (second line), status badge — all visible at every breakpoint

### 2. PCL-008 (concern → pass): Cross-tool prefill path loses durable linkage

**Actions taken:**
- Removed the entire prefill path from ToolContent: deleted `PrefillDraft` interface, `SummaryLinkType` import, sessionStorage read `useEffect`, and `handleDraftConsumed` callback
- Removed `prefillDraft` and `onDraftConsumed` props from ChangesSection
- Removed prefill `useEffect` and `onDraftConsumed` calls from ChangesSection
- `CreateProjectSummaryEntryButton` still exists in Selections and Fix List — it writes to sessionStorage but nothing reads it now, so it's a harmless no-op. Removing the button from those tools is out of scope for this sprint.
- Cleaned up unused `useEffect` import from ToolContent

### 3. PCL-005 (concern → pass): doc_scope still 'plan' for new uploads

**Actions taken:**
- Changed all 3 occurrences of `doc_scope: 'plan'` in DocumentsSection.tsx to `doc_scope: 'reference'`
- `'reference'` is a valid `DocScope` value (already defined in `src/data/project-summary.ts`)
- Existing documents with `doc_scope: 'plan'` are unaffected — only new uploads use the new value

### 4. PCL-010 (concern → pass): Sprint doc status mismatch

**Actions taken:**
- Updated sprint doc status from `implementation` to `ready_for_codex`
- All Codex findings addressed in this follow-up commit

## Build Verification

- `npm run build` passes after all changes
