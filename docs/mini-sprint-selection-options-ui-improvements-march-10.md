# Mini Sprint — Selection-Options UI Improvements — March 10

---

## 1. Sprint Summary

| Field | Value |
|-------|-------|
| **Sprint name** | Selection-Options UI Cleanup |
| **Date** | 2026-03-10 |
| **Scope** | Selections list, Selection detail, Option detail |
| **Working mode** | Plan Mode first → Implementation → Verification |
| **Goal** | Simplify Selections/Options UX — cleaner decision workspace, better mobile comments, clearer final decision, less clutter, more premium feel |

---

## 2. Spec Index

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| SEL-UI-001 | Mobile comments become a bottom-sheet experience | P0 | DONE — floating bottom bar removed, trigger in page header, opens bottom sheet |
| SEL-UI-002 | Show unread/new comment state | P0 | DONE — `hasUnread` prop on sidebar uses real lastVisited hook; desktop tab + mobile trigger show count; list page uses `useSelectionLastVisited.hasUnread()`. Caveat: per-device localStorage only, not cross-device |
| SEL-UI-003 | Redesign desktop Option detail layout | P0 | DONE |
| SEL-UI-004 | Fix mobile Option detail safe-area and bottom-nav intrusion | P0 | DONE — floating bar removed, pb-24 clears bottom nav, bottom sheet has safe-area inset |
| SEL-UI-005 | Reduce dead/loading feel on Selection detail | P1 | DONE — animate-pulse skeleton with title, pills, card placeholders |
| SEL-UI-006 | Re-center Selection detail around decision-making | P0 | DONE |
| SEL-UI-007 | Rework Selection detail header / top information architecture | P0 | DONE — Desktop: title + comment count + share (Row 1), status/priority/due (Row 2). Mobile: title (Row 1), status/priority + comment trigger (Row 2). Option detail: comment trigger in sticky breadcrumb header |
| SEL-UI-008 | Clarify Add Option affordance | P1 | DONE — ghost "Add option" card in both desktop and mobile grids |
| SEL-UI-009 | Make Final Decision a strong, explicit interaction | P0 | DONE |
| SEL-UI-010 | Remove redundant option-count microcopy | P2 | DONE |
| SEL-UI-011 | Reassess "Labels" naming and purpose | P2 | DONE |
| SEL-UI-012 | Reduce Selections list control clutter | P1 | DONE |
| SEL-UI-013 | Reconsider Group on Selections list | P1 | DONE |
| SEL-UI-014 | Move Add Selection closer to the table/content | P2 | DONE |
| SEL-UI-015 | Normalize search/control row heights | P3 | DONE |
| SEL-UI-016 | Simplify mobile Selection header density | P1 | DONE — mobile header: title + status/priority + inline comment trigger. No floating bar. Reaches options faster |
| SEL-UI-017 | Improve mobile Selection list scanability | P2 | DONE — removed standalone location, tags row from mobile cards |
| SEL-UI-018 | Improve list-to-detail continuity | P2 | DONE |
| SEL-UI-019 | Premium polish pass on spacing, contrast, and weights | P3 | DONE — non-placeholder text-cream/25 bumped to /35–/40 across IdeasBoard + OptionDetailContent |

---

## 3. Audit Map

### Routes

| Route | Page Component | Loader |
|-------|---------------|--------|
| `/app/tools/finish-decisions` | `page.tsx` → `SelectionsWorkspaceLoader` → `ToolContent` → `DecisionTrackerPage` | `SelectionsWorkspaceLoader` resolves workspace anchor |
| `/app/tools/finish-decisions/decision/[decisionId]` | `page.tsx` → `DecisionDetailLoader` → `DecisionDetailContent` | `DecisionDetailLoader` resolves workspace via localStorage cache + API |
| `/app/tools/finish-decisions/decision/[decisionId]/option/[optionId]` | `page.tsx` → `OptionDetailLoader` → `OptionDetailContent` | `OptionDetailLoader` resolves workspace via localStorage cache + API |

### Key Component Files

#### Selections List
| File | Purpose |
|------|---------|
| `src/app/app/tools/finish-decisions/page.tsx` | Server component entry — fetches kits + emoji map |
| `src/app/app/tools/finish-decisions/SelectionsWorkspaceLoader.tsx` | Resolves workspace anchor, shows loading/error, renders ToolContent |
| `src/app/app/tools/finish-decisions/ToolContent.tsx` | Orchestrator — data migration, access resolution, renders DecisionTrackerPage |
| `src/app/app/tools/finish-decisions/components/DecisionTrackerPage.tsx` | Main list view — toolbar, search, filter, sort, group, table (desktop) / cards (mobile) |

#### Selection Detail
| File | Purpose |
|------|---------|
| `src/app/app/tools/finish-decisions/decision/[decisionId]/page.tsx` | Server component entry |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailLoader.tsx` | Workspace resolver with localStorage cache |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/DecisionDetailContent.tsx` | Full detail page (~2100 lines) — header, metadata form, final decision, options board, comments sidebar, files |

#### Option Detail
| File | Purpose |
|------|---------|
| `src/app/app/tools/finish-decisions/decision/[decisionId]/option/[optionId]/page.tsx` | Server component entry |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/option/[optionId]/OptionDetailLoader.tsx` | Workspace resolver with localStorage cache |
| `src/app/app/tools/finish-decisions/decision/[decisionId]/option/[optionId]/OptionDetailContent.tsx` | Full option detail page (~1800 lines) — header, photos, price, specs, links, files, comments |

#### Shared Components (in `components/`)
| File | Purpose |
|------|---------|
| `IdeasBoard.tsx` | Options grid — desktop (3-col masonry, `hidden md:block`) + mobile (1-col, `md:hidden`). Contains `IdeaCardTile`, `AddIdeaMenu`, compare mode |
| `IdeaCardModal.tsx` | Legacy full-screen option modal (NO LONGER IMPORTED — can be deleted) |
| `ExpandableSpecs.tsx` | Auto-growing textarea with fullscreen overlay |
| `MoveIdeaSheet.tsx` | Bottom sheet to move/copy option between selections |
| `SelectionsBoardView.tsx` | Grid card view of selections (with `data-testid="selection-card"`) |
| `DecisionTrackerPage.tsx` | List/table view of selections with toolbar |
| `CompareModal.tsx` | Side-by-side option comparison |
| `SaveFromWebCTA.tsx` / `SaveFromWebDialog.tsx` | Web import CTA + URL scraper dialog |
| `IdeasPackModal.tsx` | Browse & apply curated selection packs |
| `TagInput.tsx` | Autocomplete multi-tag input |
| `SelectionShareSheet.tsx` | Share selection bottom sheet |
| `OnboardingView.tsx` | Empty state for new users |

### Data & State

| Hook / Module | Purpose |
|---------------|---------|
| `useCollectionState` | Primary state hook — fetches collection payload from API, polls every 20s, debounced saves to localStorage + API |
| `useToolState` | Legacy local-only state (non-authenticated / no workspace) |
| `useComments` | Fetches comments for target (selection/option), polls 20s, add/delete/edit methods |
| `useSelectionLastVisited` | Tracks last visit timestamp per selection (localStorage-based) |
| `useUnseenActivityCount` | Counts unseen activity events for Activity badge |
| `FinishDecisionsPayloadV4` | Top-level data type: `{ version: 4, selections: SelectionV4[] }` |
| `SelectionV4` | Selection with options, comments, files, status, priority, tags, location, etc. |
| `OptionV3` | Option with images, votes, price, specs, links, documents |

### Comments Architecture
- Selection-level + option-level comments in same DB table
- `targetType: 'selection' | 'option'`, `targetId: UUID`
- `refEntityType/refEntityId`: cross-reference to option within selection
- API: `GET/POST/DELETE/PATCH /api/collections/{collectionId}/comments`
- Polling: 20s intervals via `useComments`
- System comments auto-generated on status changes

### Desktop vs Mobile Patterns
- Desktop-only: `hidden md:flex`, `hidden md:block`, `hidden md:table-row`
- Mobile-only: `md:hidden`
- Comments: `CollapsibleCommentSidebar` — desktop sticky sidebar, mobile inline/collapsed
- Options grid: Desktop 3-col masonry (`hidden md:block`), mobile 1-col (`md:hidden`)
- Toolbar filters: Desktop inline chips, mobile bottom sheet
- Selection list: Desktop `<table>`, mobile card stack

### Loading States
- Workspace resolution: "Loading..." text
- Collection fetch: "Loading..." text
- No structured skeletons currently
- Sync indicator: Fixed bottom-right "Saving..." badge

---

## 4. Spec-by-Spec Working Log

### `SEL-UI-001` — Mobile comments become a bottom-sheet experience
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** `CollapsibleCommentSidebar` in `DecisionDetailContent.tsx` — on desktop, renders as sticky right sidebar; on mobile, renders inline as a collapsible section with accordion-style expand. On Option detail (`OptionDetailContent.tsx`), comments are in the right column (desktop) or stacked below content (mobile) with no sheet treatment.
- **Problem observed:** CONFIRMED. Mobile comments are inline — they compete with the page layout and push content around. On the option detail page, comments stack below all content on mobile with no sheet/overlay pattern. The bottom nav bar can overlap comment input.
- **Planned change:** Create a `MobileCommentSheet` bottom-sheet component. On mobile (`md:hidden`), replace inline comments with a floating comment button/trigger that opens the sheet. Sheet shows comment list + input. Desktop stays as-is.
- **Files involved:** `DecisionDetailContent.tsx`, `OptionDetailContent.tsx`, new `components/MobileCommentSheet.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-002` — Show unread/new comment state
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** `useSelectionLastVisited()` hook tracks last visit per selection in localStorage. `useUnseenActivityCount()` drives the Activity button badge. No per-entity "last viewed comments" tracking on the comment triggers themselves.
- **Problem observed:** CONFIRMED. While there's activity-level unseen tracking, the comment button/trigger on selection cards and detail pages does not show a "new comments" indicator. Users can't tell at a glance if comments changed.
- **Planned change:** Add unread dot/badge to comment triggers. Use `commentLatestAt` (already tracked) vs `lastVisited` timestamp. Show unread indicator on: (1) selection list cards, (2) selection detail comment button, (3) option detail comment button.
- **Files involved:** `DecisionTrackerPage.tsx`, `DecisionDetailContent.tsx`, `OptionDetailContent.tsx`, `useSelectionLastVisited` hook
- **Verification notes:**
- **Follow-up / caveats:** localStorage-based — per-device only, not cross-device. Acceptable for now.

### `SEL-UI-003` — Redesign desktop Option detail layout
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** `OptionDetailContent.tsx` uses `md:grid md:grid-cols-[1fr_360px]` — left column has all content (photos, name, price, specs, links, files), right column has comments (360px). Content area stretches full width of left column.
- **Problem observed:** PARTIALLY CONFIRMED. The 2-column layout already exists (just built in the previous sprint). However, the left column is a single tall stack with no internal structure — specs, links, files all run as one long column. Could benefit from tighter grouping. The 360px comments rail is already an improvement over the old 280px modal.
- **Planned change:** Restructure the left column into logical zones: (1) hero image + title/actions at top, (2) meta section (price, specs) in a more compact layout, (3) links + files grouped. Add `max-w-6xl mx-auto` container to prevent ultra-wide drift.
- **Files involved:** `OptionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-004` — Fix mobile Option detail safe-area and bottom-nav intrusion
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** Option detail on mobile has content that extends to bottom of page. Comment input textarea sits at bottom of stacked content. Bottom nav bar overlaps.
- **Problem observed:** CONFIRMED. The comment input and "Delete option" / "Done" buttons at the bottom of the mobile option detail page sit too close to or behind the bottom nav bar. No `pb-safe` or bottom padding to account for the persistent bottom nav.
- **Planned change:** Add `pb-24` (or `pb-[env(safe-area-inset-bottom)]` + nav height) to the option detail page container on mobile. Ensure comment input is above the bottom nav.
- **Files involved:** `OptionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-005` — Reduce dead/loading feel on Selection detail
- **Priority:** P1
- **Status:** DONE
- **Current implementation:** `DecisionDetailLoader.tsx` shows a simple "Loading..." text while resolving workspace. `DecisionDetailContent` shows nothing while `isLoaded` is false. No skeleton/placeholder structure.
- **Problem observed:** CONFIRMED. Entering a selection shows blank/dead screen with "Loading..." text. No visual structure preserved during load.
- **Planned change:** Replace "Loading..." with structured skeleton: title bar skeleton, status/priority skeleton pills, options grid skeleton cards. Keep it lightweight — 3-4 placeholder elements.
- **Files involved:** `DecisionDetailLoader.tsx` or `DecisionDetailContent.tsx` (early return before data loaded)
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-006` — Re-center Selection detail around decision-making
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** `DecisionDetailContent.tsx` layout order: back link → title → status/priority dropdowns → location input → labels input → tip count → final decision section → Options heading → options board → comments sidebar. Location and labels are full-width form inputs taking significant vertical space before options.
- **Problem observed:** CONFIRMED. Users must scroll past metadata (location, labels, tips) before reaching the options grid. The page feels like a form rather than a decision workspace.
- **Planned change:** Reorganize: (1) compress location/labels into a compact row or secondary section, (2) move final decision + options up so they appear immediately below the title/status row, (3) push metadata like labels, tips, notes into a collapsible "Details" section below options.
- **Files involved:** `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-007` — Rework Selection detail header / top information architecture
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** Desktop top section: back link, title (editable), status dropdown, priority dropdown, toggle, location input, labels input, tip count, share. These are spread across multiple rows with inconsistent spacing.
- **Problem observed:** CONFIRMED. Header feels scattered and form-heavy. Status/priority are dropdowns that look like form fields rather than compact controls. Location and labels are full-width inputs.
- **Planned change:** Restructure into clean rows: Row 1: `← Back to list` | `Title` | `Comments (count)` | `Share`. Row 2: `Status pill` | `Priority pill` | `Due date` | `Location` (compact, inline). Labels move to a subtle tag row or collapsible section.
- **Files involved:** `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-008` — Clarify Add Option affordance
- **Priority:** P1
- **Status:** DONE
- **Current implementation:** `AddIdeaMenu` renders a small "+" button next to the "Options" heading. On click, shows dropdown with Photo/Note/Web/URL options. The "+" is a 28px circle icon.
- **Problem observed:** CONFIRMED. The small "+" is easy to miss. New users may not realize they can add options.
- **Planned change:** Add an "Add Option" ghost card at the end of the options grid (dashed border, centered "+" icon + "Add option" text). Keep the existing AddIdeaMenu for the dropdown, but trigger it from the card click too. The card provides visual affordance; the menu provides the specific input method.
- **Files involved:** `IdeasBoard.tsx`, possibly `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-009` — Make Final Decision a strong, explicit interaction
- **Priority:** P0
- **Status:** DONE
- **Current implementation:** Final decision section in `DecisionDetailContent.tsx` shows: if no final pick → "No final decision yet — pick from options below, or add one and mark it final." If final pick exists → shows option name, who selected it, and when. On option cards, "Mark as Final" appears in the action row (small text button).
- **Problem observed:** PARTIALLY CONFIRMED. The empty state text is adequate but not visually prominent. The "Mark as Final" CTA on option cards is a small text button that blends with other actions. The final-chosen state is visible but could be more prominent with a stronger visual treatment.
- **Planned change:** (1) Empty state: add a subtle dashed-border card with icon + "No final decision yet" + instruction. (2) Option cards: make "Mark as Final" a more visible button/badge. (3) Final-chosen state: add a prominent banner/card with checkmark icon, option thumbnail, and clear "Final Decision" label.
- **Files involved:** `DecisionDetailContent.tsx`, `IdeasBoard.tsx` (IdeaCardTile)
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-010` — Remove redundant option-count microcopy
- **Priority:** P2
- **Status:** DONE
- **Current implementation:** "Options" heading shows count pill (`options.length`) to its right. Separately, the page shows "X options" text in the summary/final-decision section area (e.g., "1 option").
- **Problem observed:** CONFIRMED. The count appears in two places near the same section.
- **Planned change:** Keep only the count pill next to "Options" heading. Remove the standalone "X options" text from the summary/final section.
- **Files involved:** `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-011` — Reassess "Labels" naming and purpose
- **Priority:** P2
- **Status:** DONE
- **Current implementation:** "LABELS" heading with a `TagInput` component that manages `tags[]` on the selection. Tags are used for: (1) filtering on the selections list, (2) grouping on the selections list, (3) visual display on selection cards. Tags are freeform text with suggestions from `TAG_SUGGESTIONS` (Kitchen, Bathroom, Bedroom, etc.).
- **Problem observed:** NEEDS PARTIAL TWEAK. "Labels" is a reasonable name but it's unclear whether they're meant for filtering, categorization, or description. They overlap somewhat with "Location" (e.g., "Kitchen" could be a label or a location). Reducing prominence is the main fix.
- **Planned change:** Keep "Labels" naming. Reduce visual prominence by moving labels into the compact metadata row (SEL-UI-007) or a collapsible details section. They should not occupy a full-width form row at the top of the page.
- **Files involved:** `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:** Renaming to "Filter Labels" adds confusion; keeping "Labels" is simpler.

### `SEL-UI-012` — Reduce Selections list control clutter
- **Priority:** P1
- **Status:** DONE
- **Current implementation:** `DecisionTrackerPage.tsx` toolbar includes: search input, sort dropdown, group dropdown, "Add an Idea Pack" button, "Add Selection" button. Below toolbar: status filter chips row, tag filter chips row, location filter chips row. Summary stats strip below filters.
- **Problem observed:** CONFIRMED. The toolbar area takes 3-4 rows of controls before the actual selections list begins. Filter chips for tags and locations can wrap to multiple lines. The overall impression is a control panel rather than a content-first page.
- **Planned change:** (1) Consolidate sort + group into a single "View" dropdown or move to secondary row. (2) Hide tag/location filter chips by default — show them only when a filter is active or via a "Filters" toggle. (3) Keep search prominent. (4) Move summary stats into a more subtle treatment.
- **Files involved:** `DecisionTrackerPage.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-013` — Reconsider Group on Selections list
- **Priority:** P1
- **Status:** DONE
- **Current implementation:** Group dropdown in `DecisionTrackerPage.tsx` offers: None, By Location, By Label, By Status, By Priority. When active, selections are grouped into collapsible sections with headers.
- **Problem observed:** CONFIRMED. Grouping adds cognitive overhead. Most users probably use the flat list. Group is a power-user feature taking primary toolbar space.
- **Planned change:** Move Group into a secondary "View options" popover/menu alongside Sort. Remove it from the primary toolbar row. If currently set to a non-default group, show a small indicator.
- **Files involved:** `DecisionTrackerPage.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-014` — Move Add Selection closer to the table/content
- **Priority:** P2
- **Status:** DONE
- **Current implementation:** "Add Selection" button is in the toolbar row at the top, grouped with search/sort/group controls. On mobile, there's an inline text input below the toolbar.
- **Problem observed:** CONFIRMED. "Add Selection" feels like a toolbar action rather than a content-creation action. It's distant from the list content it affects.
- **Planned change:** Add a persistent "Add Selection" row/card at the bottom of the selections list (or top of list area, below filters). Keep the toolbar button as a secondary shortcut or remove it.
- **Files involved:** `DecisionTrackerPage.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-015` — Normalize search/control row heights
- **Priority:** P3
- **Status:** DONE
- **Current implementation:** Search input and adjacent controls (sort dropdown, group dropdown, buttons) have varying heights and padding.
- **Problem observed:** NEEDS AUDIT. Will confirm during implementation.
- **Planned change:** Normalize all toolbar controls to consistent `h-9` or `h-10` with matching padding and border-radius.
- **Files involved:** `DecisionTrackerPage.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-016` — Simplify mobile Selection header density
- **Priority:** P1
- **Status:** DONE
- **Current implementation:** Mobile Selection detail header shows: back link, title, status dropdown, priority dropdown, location input, labels input, option count + tip count. All stacked vertically.
- **Problem observed:** CONFIRMED. Too many controls before reaching options. Mobile users must scroll past form fields.
- **Planned change:** On mobile: Row 1: back + title. Row 2: compact status + priority pills. Everything else (location, labels, due date) moves to a collapsible "Details" section or bottom of page. Options appear immediately after row 2.
- **Files involved:** `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:** Addressed jointly with SEL-UI-006 and SEL-UI-007.

### `SEL-UI-017` — Improve mobile Selection list scanability
- **Priority:** P2
- **Status:** DONE
- **Current implementation:** Mobile selection cards in `DecisionTrackerPage.tsx` show: title, status badge, option count, comment count, priority, location, due date, last updated. Dense card layout.
- **Problem observed:** NEEDS AUDIT. Will confirm density during implementation.
- **Planned change:** Tighten mobile cards: title + status badge on row 1, option count + comment indicator on row 2. Move secondary metadata (location, due, updated) to a subtle third line or hide.
- **Files involved:** `DecisionTrackerPage.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-018` — Improve list-to-detail continuity
- **Priority:** P2
- **Status:** DONE
- **Current implementation:** Clicking a selection in the list navigates to the detail page via `router.push`. The detail page loads independently — no shared context or visual continuity with the list item.
- **Problem observed:** CONFIRMED. The transition feels like entering a different mode. Title appearance, status treatment, and overall visual language differ between list and detail.
- **Planned change:** (1) Match title styling between list and detail. (2) Show status badge in same position/style. (3) Ensure back link clearly references the list. (4) Consider preserving the selection card's visual identity (thumbnail, title) in the detail header.
- **Files involved:** `DecisionTrackerPage.tsx`, `DecisionDetailContent.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

### `SEL-UI-019` — Premium polish pass on spacing, contrast, and weights
- **Priority:** P3
- **Status:** DONE
- **Current implementation:** Various spacing, font weights, and contrast levels across all three pages.
- **Problem observed:** NEEDS AUDIT during implementation.
- **Planned change:** Systematic pass: normalize section spacing (consistent `mb-` / `gap-` values), improve contrast for key text (titles, statuses), reduce visual weight of secondary text, tighten card padding.
- **Files involved:** `DecisionTrackerPage.tsx`, `DecisionDetailContent.tsx`, `OptionDetailContent.tsx`, `IdeasBoard.tsx`
- **Verification notes:**
- **Follow-up / caveats:**

---

## 5. Proposed Implementation Phases

### Phase 1 — Structural P0 fixes (SEL-UI-001, 003, 004, 006, 007, 009)
The core layout and UX changes that reshape the three main pages.

| ID | Summary |
|----|---------|
| SEL-UI-001 | Mobile comments → bottom sheet on Selection detail + Option detail |
| SEL-UI-003 | Desktop Option detail → tighter 2-column layout with grouped zones |
| SEL-UI-004 | Mobile Option detail → safe-area padding for bottom nav |
| SEL-UI-006 | Selection detail → options up, metadata compressed |
| SEL-UI-007 | Selection detail header → clean row-based layout |
| SEL-UI-009 | Final decision → strong empty state, prominent CTA, banner when chosen |

### Phase 2 — List, actions, and clarity fixes (SEL-UI-002, 005, 008, 010, 012, 013, 014, 016)
Improving the selections list, add-option affordance, loading states, and mobile header.

| ID | Summary |
|----|---------|
| SEL-UI-002 | Unread/new comment indicator on triggers |
| SEL-UI-005 | Skeleton loading for Selection detail |
| SEL-UI-008 | Add Option ghost card in grid |
| SEL-UI-010 | Remove redundant option count text |
| SEL-UI-012 | Selections list toolbar declutter |
| SEL-UI-013 | Group → secondary control |
| SEL-UI-014 | Add Selection closer to content |
| SEL-UI-016 | Mobile Selection header simplification (joint with 006/007) |

### Phase 3 — Polish and residual fixes (SEL-UI-011, 015, 017, 018, 019)
Visual refinement, naming, continuity, and polish.

| ID | Summary |
|----|---------|
| SEL-UI-011 | Labels → reduce prominence, keep naming |
| SEL-UI-015 | Normalize toolbar control heights |
| SEL-UI-017 | Tighten mobile selection cards |
| SEL-UI-018 | List-to-detail visual continuity |
| SEL-UI-019 | Spacing, contrast, and weight polish pass |

---

## 6. Final Verification Table

| ID | Title | Final Status | Evidence | Files | Notes |
|----|-------|-------------|----------|-------|-------|
| SEL-UI-001 | Mobile comments bottom-sheet | | | | |
| SEL-UI-002 | Unread/new comment state | | | | |
| SEL-UI-003 | Desktop Option detail layout | | | | |
| SEL-UI-004 | Mobile Option detail safe-area | | | | |
| SEL-UI-005 | Selection detail loading/skeleton | | | | |
| SEL-UI-006 | Selection detail re-centered | | | | |
| SEL-UI-007 | Selection detail header rework | | | | |
| SEL-UI-008 | Add Option affordance | | | | |
| SEL-UI-009 | Final Decision treatment | | | | |
| SEL-UI-010 | Redundant option-count removal | | | | |
| SEL-UI-011 | Labels naming/prominence | | | | |
| SEL-UI-012 | Selections list control clutter | | | | |
| SEL-UI-013 | Group behavior | | | | |
| SEL-UI-014 | Add Selection placement | | | | |
| SEL-UI-015 | Search/control row heights | | | | |
| SEL-UI-016 | Mobile Selection header density | | | | |
| SEL-UI-017 | Mobile Selection list scanability | | | | |
| SEL-UI-018 | List-to-detail continuity | | | | |
| SEL-UI-019 | Premium polish pass | | | | |

---

## 7. Manual QA Checklist

- [ ] Selections list desktop — toolbar, search, filters, table, add selection
- [ ] Selections list mobile — cards, filter sheet, add selection
- [ ] Selection detail desktop — header, metadata, final decision, options, comments sidebar
- [ ] Selection detail mobile — compact header, options, bottom-sheet comments
- [ ] Option detail desktop — 2-column layout, all editing, comments panel
- [ ] Option detail mobile — single column, safe-area clearance, bottom-sheet comments
- [ ] Comments open/close behavior on mobile — sheet opens/closes, input works
- [ ] Unread/new comment indicator behavior — shows on list cards, detail triggers
- [ ] Final decision empty state — clear "no decision yet" treatment
- [ ] Final decision chosen state — prominent banner with option info
- [ ] Add option affordance clarity — ghost card visible in grid
- [ ] Toolbar/search/add-selection layout on desktop — clean, aligned
- [ ] Group behavior retained/hidden/removed — moved to secondary control
- [ ] Loading/skeleton behavior — structured skeleton on detail page load
