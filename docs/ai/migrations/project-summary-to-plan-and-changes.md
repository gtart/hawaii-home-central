# Migration: Project Summary -> Plan & Changes

## Purpose
Restructure the "Project Summary" tool into "Plan & Changes" — a data model evolution (v1→v2) with new UI sections, 6-status change workflow, plan lifecycle, milestone logging, and user-facing rename. The internal toolKey (`project_summary`), route paths, and file names remain unchanged.

## Scope
- **Data model**: v1→v2 payload migration (silent, in ensureShape)
- **UI restructure**: SummarySection + OpenDecisionsSection → CurrentPlanSection; Changes v2 with 6 statuses
- **User-facing copy**: all "Project Summary" strings → "Plan & Changes"
- **Internal names stay**: toolKey, route paths, file names, type names, API endpoints

---

## v1→v2 Data Model Migration

### Payload Structure Change
```
v1: { version: 1, summary, documents, changes, openDecisions }
v2: { version: 2, plan, budget, documents, changes, milestones }
```

### Field Mapping
| v1 Field | v2 Field | Notes |
|----------|----------|-------|
| `summary.text` | `plan.scope` | Direct move |
| `summary.baseline_amount` | `budget.baseline_amount` | Direct move |
| `summary.budget_note` | `budget.budget_note` | Direct move |
| `summary.approved_changes_total` | (dropped) | Auto-computed in v2 |
| `summary.current_total` | (dropped) | Auto-computed in v2 |
| `summary.updated_at` | `plan.updated_at` + `budget.updated_at` | Split across objects |
| `openDecisions[]` | `plan.still_to_decide[]` | See decision migration below |
| `changes[]` | `changes[]` (v2 shape) | See change migration below |
| `documents[]` | `documents[]` | Unchanged |
| (new) | `plan.included[]` | Empty on migration |
| (new) | `plan.not_included[]` | Empty on migration |
| (new) | `plan.status` | `'draft'` on migration |
| (new) | `milestones[]` | Empty on migration |

### Change Status Mapping

| v1 Status | v2 Status | Rationale |
|-----------|-----------|-----------|
| `proposed` | `requested` | Direct semantic equivalent — "someone asked for this" |
| `approved` | `approved_by_homeowner` | **Assumption:** In v1 "approved" meant homeowner sign-off. No contractor acceptance concept existed. May need manual correction for edge cases. |
| `not_approved` | `closed` | **Assumption:** Terminal state. User can reopen by changing status if needed. |

### Decision → PlanItem Migration
- `title` → `text` (with description/resolution appended if present)
- `description` → appended to text as "— {description}"
- `resolution` → appended to text if present
- `status` → if non-open, suffix added: "(was: Approved)" etc.
- `links` → **DROPPED** — PlanItem has no links field. Rarely used on decisions.
- New fields: `category: 'still_to_decide'`, `created_by: undefined`, `updated_by: undefined`

### New Fields on v2 Changes
- `contractor_response?: string` — contractor's response to the change request
- `incorporated: boolean` — true after "incorporate into plan" action
- `incorporated_at?: string` — when incorporation happened
- `incorporated_by?: string` — who incorporated it
- `changed_since_accepted?: boolean` — true if edited after contractor acceptance

### Known Data Losses

| v1 Field | What Happens | Mitigation |
|----------|-------------|------------|
| `openDecisions[].links` | **Dropped.** PlanItem has no links field. | Links on decisions were rarely used. Follow-up P2 issue if needed. |
| `openDecisions[].status` | **Partially preserved.** Non-open status appended to text as context. | Informational, not functional. |
| `summary.approved_changes_total` | **Dropped.** Auto-computed in v2. | No functionality loss. |
| `summary.current_total` | **Dropped.** Auto-computed in v2. | No functionality loss. |

---

## File-by-File Inventory

### Must Change

| File | Change |
|------|--------|
| `src/data/project-summary.ts` | Add v2 types, update ensureShape with v1→v2 migration |
| `src/app/app/tools/project-summary/constants.ts` | v2 status configs, plan status config |
| `src/app/app/tools/project-summary/useProjectSummaryState.ts` | v2 state mutations |
| `src/app/app/tools/project-summary/ToolContent.tsx` | Replace sections, update header strings |
| `src/app/app/tools/project-summary/components/ChangesSection.tsx` | v2 statuses, contractor_response, incorporate action |
| `src/app/app/tools/project-summary/components/StatusBadge.tsx` | v2 status types |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/ChangeDetailContent.tsx` | v2 fields, breadcrumb text |
| `src/app/app/tools/project-summary/[collectionId]/change/[changeId]/page.tsx` | Metadata title |
| `src/lib/tool-registry.ts` | title + description |
| `src/lib/activityHelpers.ts` | TOOL_LABEL + FILTER_CHIPS |
| `src/components/app/SidebarNav.tsx` | Sidebar label |
| `src/components/app/CreateProjectSummaryEntryButton.tsx` | User-facing text |
| `src/components/app/ProjectSummaryLinkBadge.tsx` | Badge label |
| `src/app/app/tools/project-summary/CollectionPickerWrapper.tsx` | Visible text |

### New Files

| File | Purpose |
|------|---------|
| `src/app/app/tools/project-summary/components/CurrentPlanSection.tsx` | Replaces SummarySection + OpenDecisionsSection |
| `src/app/app/tools/project-summary/components/PlanItemList.tsx` | Reusable list for included/not_included/still_to_decide |
| `src/app/app/tools/project-summary/components/MilestoneTimeline.tsx` | Milestone timeline display |

### Delete

| File | Reason |
|------|--------|
| `src/app/app/tools/project-summary/components/SummarySection.tsx` | Replaced by CurrentPlanSection |
| `src/app/app/tools/project-summary/components/OpenDecisionsSection.tsx` | Decisions migrated to plan.still_to_decide |

### Do NOT Change (internal)

| File | Why it stays |
|------|-------------|
| `src/data/project-summary.ts` (type names) | `ProjectSummaryPayload` etc. — internal names |
| API routes (`/api/tools/project-summary/...`) | URLs not user-visible |
| Hook names, upload helpers | Internal |
| Route directory `src/app/app/tools/project-summary/` | Changing breaks bookmarks/shares |
| `toolKey: 'project_summary'` in DB | Never rename |

---

## Backward Compatibility Checklist

- [ ] `project_alignment` hidden entry in tool-registry still works (redirects to PS route)
- [ ] Activity events with toolKey='project_summary' show 'Plan & Changes' label
- [ ] Activity events with toolKey='project_alignment' still redirect correctly
- [ ] Legacy 'decided' status still maps to 'closed' in ensureShape
- [ ] Existing share tokens with project_summary toolKey still resolve
- [ ] Existing v1 payloads load correctly (migrated to v2 in memory by ensureShape)
- [ ] Bookmarked URLs to /app/tools/project-summary/ still work
- [ ] ProjectSummaryLinkBadge in Selections/Fix List still fetches and displays correctly
- [ ] CreateProjectSummaryEntryButton still navigates to correct route
- [ ] Comment threads on changes still load (targetType='change' unchanged)
- [ ] v1 change status values coerce to valid v2 statuses

---

## Open Questions (Resolved)

- [x] "Open Decisions" → migrated to `plan.still_to_decide` structured list
- [x] Documents → stays as own section (unchanged)
- [x] Tool description → full rewrite to match Plan & Changes framing
- [x] Collection picker itemNoun → keep "project"
