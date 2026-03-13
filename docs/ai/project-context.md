# HHC Project Context

## What HHC Is
Hawaii Home Central is a premium web app for Hawai'i homeowners navigating renovation projects. It combines a public content site (guides, stories, contractor directory) with an authenticated toolkit for managing renovations.

## Who It Serves
Hawai'i homeowners doing significant renovation work -- typically $50K-$500K projects involving general contractors, subcontractors, designers, and multiple finish decisions. Users are non-technical homeowners who want clarity and control without project management software complexity.

## User Journey
1. Discover HHC via search/referral -> read guides, browse directory
2. Sign up (Google OAuth) -> create a project (their home renovation)
3. Use tools throughout renovation:
   - **Mood Boards**: collect inspiration images
   - **Contract Checklist**: compare contractor bids
   - **Selections**: track finish choices (tile, countertops, hardware)
   - **Fix List**: track punch items during/after construction
   - **Plan & Changes**: document scope, track changes, and log milestones
4. Share tool collections with contractors/spouses/designers via share links
5. Invite collaborators to edit (ToolCollectionInvite)

## Data Architecture
- All tool data uses the "payload-in-JSON" pattern: a ToolCollection row holds a JSON payload
- Each tool defines its payload types in `src/data/{tool-name}.ts`
- Payload validation via coerce/ensureShape functions -- never trust raw DB data
- Comments are separate (Comment table), not embedded in payloads
- Activity events logged per-action to ActivityEvent table

## Design Language
- Dark editorial aesthetic -- basalt backgrounds, cream text, sandstone accents
- Serif headings (Playfair Display), sans body (Inter)
- Cards with rounded corners, subtle borders (border-cream/[0.06])
- Mobile-first responsive -- bottom sheets, not modals on mobile
- Consistent status colors: amber (pending), emerald (approved), red (rejected), blue (in-progress), gray (closed)

## Tool Architecture Pattern
Each tool follows this pattern:
1. `src/data/{tool}.ts` -- payload types + ensureShape validator
2. `src/app/app/tools/{tool-slug}/page.tsx` -- server component entry (CollectionsPickerView)
3. `src/app/app/tools/{tool-slug}/[collectionId]/page.tsx` -- collection view
4. `src/app/app/tools/{tool-slug}/ToolContent.tsx` -- orchestrator (data loading, state)
5. `src/app/app/tools/{tool-slug}/components/` -- feature components
6. `src/app/api/tools/{tool-slug}/` -- API routes (upload, etc.)
7. Registration in `src/lib/tool-registry.ts` and `src/lib/activityHelpers.ts`

## Product Principles
- **Clarity over features**: every screen should be immediately understandable
- **Homeowner-first**: the tool serves the homeowner, not the contractor (though contractors can be invited)
- **Don't overengineer**: simple is better than flexible. Build what's needed now.
- **Mobile matters**: many interactions happen on job sites on phones
- **Privacy-aware**: homeowners may have private notes/concerns not shared with contractors
