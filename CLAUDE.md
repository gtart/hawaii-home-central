## Hawaii Home Central

Premium Hawai'i renovation guide and homeowner toolkit.
Homeowners plan renovations, track selections, manage fix lists, and document project changes.

### Stack
- Next.js 16 App Router + TypeScript + Tailwind CSS 4
- NextAuth v5 (beta.30) — Google OAuth
- Neon Postgres via Prisma
- Vercel (hosting + Blob storage)
- Dark theme: basalt (#1a1a1a) bg, cream (#f5f0e8) text, sandstone (#c9a87c) accent

### Architecture
- Public marketing site: root pages + `/resources`, `/stories`, `/directory`
- Authenticated app: `/src/app/app/` — requires login
- Tools live at `/src/app/app/tools/{tool-slug}/` — each tool is a ToolCollection with JSON payload
- Data model: User -> Project -> ToolCollection (payload: JSON) -> Comments
- Multi-collection pattern: users create multiple instances of each tool per project
- Payload-in-JSON: tool data stored as JSON in ToolCollection.payload, validated via coerce functions in `src/data/`

### Tools
| toolKey | Route | User-Facing Name |
|---------|-------|-----------------|
| `mood_boards` | `/app/tools/mood-boards` | Mood Boards |
| `before_you_sign` | `/app/tools/before-you-sign` | Contract Checklist |
| `finish_decisions` | `/app/tools/finish-decisions` | Choose Selections |
| `punchlist` | `/app/tools/punchlist` | Fix Issues |
| `project_summary` | `/app/tools/project-summary` | Track Plans |
| `project_alignment` | hidden, redirects to project_summary | — |

### Build Rules
1. Desktop + mobile for every UI change. Breakpoint: `md:` (768px). Mobile uses bottom sheets, not modals.
2. Dark theme only — never use native `<select>` elements. Use custom div-based dropdowns (bg-[#1a1a1a]).
3. `prisma generate` runs before `next build` (already in build script).
4. Payload validation: every tool has a coerce/ensureShape function in `src/data/`. Never trust raw JSON.
5. Cross-tool links are one-directional. Project Summary stores links; other tools don't store back-references.
6. Comments are in the Comment DB table, not embedded in JSON payloads. Use `useComments` hook.
7. Deploy: `npx vercel --prod` from repo root. All env vars must be in `.env` file (not just Vercel dashboard).
8. Auth uses cookie-existence check in middleware (not getToken — fails on Vercel Edge).
9. Never modify Fix List or Selections files when changing Project Summary code.
10. Activity events go through ActivityEvent model. Use TOOL_LABEL and TOOL_BASE from `src/lib/activityHelpers.ts`.

### Commands
- `npm run dev` — dev server with Turbopack
- `npm run build` — production build (includes prisma generate)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type check
- `npx vercel --prod` — deploy to production

### Analytics (PostHog)
- Both HHC and NewsFlash share the same PostHog project.
- PostHog key: `phc_4uGAOTNvdXFYi8Kzhtw0YvcnOfbmSwHz6EyCs4ld2xP`
- **Super property `app_name: "hhc"`** is registered at init to distinguish events from NewsFlash.
- To filter in PostHog: `app_name = "hhc"` (this app) or `app_name = "newsflash"` (NewsFlash).
- Integration: raw `<Script>` snippet in `src/app/layout.tsx` (not the posthog-js SDK).
- Google Analytics also active: `G-G64TMLBFEC`.

### Key Registries
- Tool metadata: `src/lib/tool-registry.ts`
- Activity labels: `src/lib/activityHelpers.ts`
- Payload validators: `src/lib/tools/validateToolPayload.ts`
- Sidebar nav: `src/components/app/SidebarNav.tsx`

### Issue Tracking & Source of Truth
- **During an active sprint**, the sprint doc in `docs/ai/sprints/` is the live source of truth for in-scope work. Track issue-by-issue progress there, not in GitHub Issues.
- **GitHub Issues** is the source of truth for backlog, out-of-sprint discoveries, deferred work, and cross-sprint issues. Use `gh issue list`, `gh issue create`, `gh issue close`.
- Labels: `P0: broken`, `P1: degraded`, `P2: cosmetic`, `P3: polish` for priority
- Labels: `bug`, `feature`, `cleanup`, `review-finding` for category
- Labels: `investigating`, `in-progress`, `blocked`, `deferred` for status
- When fixing a bug or completing a feature outside a sprint, close the issue with `gh issue close <number> -c "reason"`
- When finding new issues during sprint work, classify them (see Mid-Sprint Issue Rule below)
- **`BACKLOG_IDEAS.md`** holds deep specs for features too detailed for a GitHub Issue body. Don't use it for status tracking.

### Current Work
- **Always read `docs/ai/active-sprint.md` first** — it is the pointer to the active sprint and its handoff state
- Sprint docs live in `docs/ai/sprints/` — each contains the issue ledger, acceptance criteria, and files changed
- See `docs/ai/workflows/sprint-ledger-workflow.md` for the full sprint lifecycle
- See `docs/ai/migrations/project-summary-to-plan-and-changes.md` for migration plan

### AI Review & Logging System
- **Codex instructions**: `AGENTS.md` at repo root — defines Codex's review-only role (with sprint ledger update exception), "latest" definition, and audit format
- **Review ledger**: `docs/ai/reviews/` — Codex writes audits into `codex/`, Claude writes responses into `claude/`
- **When asked to respond to a Codex review**: read the latest file in `docs/ai/reviews/codex/`, act on findings, write response to `docs/ai/reviews/claude/`
- **UI review workflow**: `docs/ai/ui-reviews/README.md` — screenshot capture, zip packaging, and findings handoff
- **UI review findings**: `docs/ai/ui-reviews/findings/` — screenshot-backed UI audits written by Codex
- **Subagent logs**: `docs/ai/agent-logs/subagents.jsonl` — auto-logged via Claude hooks on SubagentStart/SubagentStop
- **Hook config**: `.claude/settings.json` — project-level hooks for subagent logging
- See `docs/ai/reviews/README.md` for review/response format and workflow
- See `docs/ai/agent-logs/README.md` for log format and inspection commands

### Workflow Discipline
- After implementation: run issue-validator and qa-regression-checker agents
- Before declaring "done": verify both desktop and mobile
- When touching Plan & Changes files: check migration doc first
- Use specialized agents (`/.claude/agents/`) for focused review tasks
- Out-of-sprint discoveries: create GitHub Issues (`gh issue create`)

### Sprint-First Rule

Unless a request is a tiny isolated fix (single file, no review needed), treat it as sprint-based work.

**A sprint is required when the request:**
- includes multiple issues or changes
- affects UI/UX, workflows, information architecture, or architecture
- spans multiple files or implementation steps
- should be reviewed by Codex
- should be tracked to completion

**Do not begin substantial implementation** until you have either:
1. created a new sprint doc and updated `docs/ai/active-sprint.md`, or
2. updated the existing active sprint ledger with the new work

### Sprint Lifecycle

See `docs/ai/workflows/sprint-ledger-workflow.md` for full details. Summary:

#### 1. Starting a sprint
A sprint is officially started only when ALL of these are true:
- A sprint doc exists in `docs/ai/sprints/` using the standard template (`docs/ai/sprints/_template.md`)
- The sprint has a clear name and goal
- The issue ledger is populated with IDs, priorities, statuses, and acceptance criteria
- `docs/ai/active-sprint.md` points to that sprint with status `implementation`

#### 2. Issue-by-issue implementation
- Read `docs/ai/active-sprint.md` → open the active sprint doc
- Work issues in priority order
- Update the ledger as work progresses (Status, Files)
- Mark `Claude Verified: pass` only after self-checking acceptance criteria
- Keep acceptance criteria specific: exact files, CSS classes, copy strings, behavior

#### 3. Handoff to Codex
- Run `npx tsc --noEmit` and `npm run build` — record results in Build Verification
- Set all `Codex Verified` to `pending`
- Update `docs/ai/active-sprint.md`: status → `ready_for_codex`, add commit hash
- Codex reads the sprint doc, validates each issue, updates `Codex Verified` + `Codex Notes` + `Follow-up`
- Codex writes a narrative audit to `docs/ai/reviews/codex/`

#### 4. Claude follow-up
- Read Codex audit and sprint ledger notes
- Fix issues marked `Follow-up: claude_fix`
- Update ledger: re-verify, update `Claude Verified`
- Write response to `docs/ai/reviews/claude/`
- Update `docs/ai/active-sprint.md`: status → `followup_in_progress` then `ready_for_codex` again if needed

#### 5. Sprint closure
A sprint is closed only when:
- Every in-scope issue is `done` or explicitly moved out of sprint
- Every completed issue has `Claude Verified: pass` and `Codex Verified: pass`
- Every issue's `Follow-up` state is explicit
- Build/typecheck results are recorded
- Latest Codex audit and Claude response are linked in the sprint doc
- `docs/ai/active-sprint.md` status is set to `complete`

### Mid-Sprint Issue Rule

If a new issue surfaces during a sprint, classify it immediately:
1. **In-scope** → add to the current sprint ledger with full fields
2. **Out-of-scope** → log as `Follow-up: new_issue` or create a GitHub Issue
3. **Too large** → requires a separate sprint

Log the classification in the sprint doc's Scope Change Log. Never let issues drift untracked in chat.

### Sprint Ledger Fields

Every issue in the sprint ledger must use these fields:

| Field | Values |
|-------|--------|
| ID | Sprint-prefixed (e.g., PLAN-001) |
| Title | Short description |
| Priority | P0, P1, P2, P3 |
| Status | `todo`, `in_progress`, `blocked`, `done`, `needs_followup` |
| Claude Verified | `pending`, `pass`, `fail` |
| Codex Verified | `pending`, `pass`, `concern`, `fail` |
| Codex Notes | Short review note (Codex fills this) |
| Follow-up | `none`, `claude_fix`, `new_issue`, `deferred` |
| Files | Key files touched |
