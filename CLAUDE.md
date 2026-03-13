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
| `finish_decisions` | `/app/tools/finish-decisions` | Selections |
| `punchlist` | `/app/tools/punchlist` | Fix List |
| `project_summary` | `/app/tools/project-summary` | Plan & Changes |
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

### Key Registries
- Tool metadata: `src/lib/tool-registry.ts`
- Activity labels: `src/lib/activityHelpers.ts`
- Payload validators: `src/lib/tools/validateToolPayload.ts`
- Sidebar nav: `src/components/app/SidebarNav.tsx`

### Issue Tracking
- **GitHub Issues is the single source of truth** for all bugs, tasks, and backlog — use `gh issue list`, `gh issue create`, `gh issue close`
- Labels: `P0: broken`, `P1: degraded`, `P2: cosmetic`, `P3: polish` for priority
- Labels: `bug`, `feature`, `cleanup`, `review-finding` for category
- Labels: `investigating`, `in-progress`, `blocked`, `deferred` for status
- When fixing a bug or completing a feature, close the issue with `gh issue close <number> -c "reason"`
- When finding new issues during work, create them immediately with `gh issue create`
- **`BACKLOG_IDEAS.md`** holds deep specs for features too detailed for a GitHub Issue body (architecture, UX flows, integration plans). Update it when a conversation produces design decisions or implementation details worth preserving for a deferred feature. Don't use it for simple bugs or status tracking.

### Current Work
- **Always read `docs/ai/active-sprint.md` first** — it points to the current sprint doc and lists what's in progress
- Sprint docs live in `docs/ai/sprints/` — each contains issue tracker, acceptance criteria, and files changed
- See `docs/ai/migrations/project-summary-to-plan-and-changes.md` for migration plan

### AI Review & Logging System
- **Codex instructions**: `AGENTS.md` at repo root — defines Codex's review-only role, "latest" definition, and audit format
- **Review ledger**: `docs/ai/reviews/` — Codex writes audits into `codex/`, Claude writes responses into `claude/`
- **When asked to respond to a Codex review**: read the latest file in `docs/ai/reviews/codex/`, act on findings, write response to `docs/ai/reviews/claude/`
- **Subagent logs**: `docs/ai/agent-logs/subagents.jsonl` — auto-logged via Claude hooks on SubagentStart/SubagentStop
- **Hook config**: `.claude/settings.json` — project-level hooks for subagent logging
- See `docs/ai/reviews/README.md` for review/response format and workflow
- See `docs/ai/agent-logs/README.md` for log format and inspection commands

### Workflow Discipline
- After meaningful findings: create or update GitHub Issues (`gh issue create` / `gh issue comment`)
- After implementation: run issue-validator and qa-regression-checker agents
- Before declaring "done": verify both desktop and mobile
- When touching Plan & Changes files: check migration doc first
- Don't declare work complete until validation and issue updates are done
- Use specialized agents (`/.claude/agents/`) for focused review tasks
- After sprint completion: write a review into `docs/ai/reviews/claude/`

### Sprint Handoff Workflow (Claude → Codex)

Every sprint must maintain two handoff docs so Codex can review without guessing what changed.

#### 1. Starting a sprint
- Create a sprint doc in `docs/ai/sprints/{sprint-name}.md` with:
  - Issue tracker table (ID, Title, Status, Claude Verified, Codex Verified)
  - Per-issue **requirements + acceptance criteria** (what to check, which files, expected behavior)
  - Files Changed table
  - Build Verification section
- Update `docs/ai/active-sprint.md` to point to the new sprint doc, list files changed, and set status checkboxes

#### 2. During implementation
- Update the sprint doc's issue tracker as each issue is completed (Status → done)
- Add files to the Files Changed table as they are modified
- Keep acceptance criteria specific: name exact files, line ranges, CSS classes, copy strings

#### 3. Before committing / declaring done
- Mark "Claude Verified: yes" for each issue after self-checking against acceptance criteria
- Run `npx tsc --noEmit` and `npm run build` — record results in Build Verification
- Update `docs/ai/active-sprint.md` with the commit hash and current status
- Ensure all "Codex Verified" cells are set to "pending"

#### 4. Handoff to Codex
- The user says "review" or "hand off to Codex" — no further action needed from Claude
- Codex reads `active-sprint.md` → sprint doc → validates each issue against acceptance criteria
- Codex updates "Codex Verified" column and writes a review to `docs/ai/reviews/codex/`
