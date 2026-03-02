/**
 * Seed a "Demo" project for the real user Gregg.tarter@gmail.com
 * with rich mood_boards and finish_decisions data.
 *
 * Usage:  npx tsx scripts/seed-demo-project.ts
 * Safe to run repeatedly (idempotent).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const USER_EMAIL = 'gregg.tarter@gmail.com'
const PROJECT_NAME = 'Demo'
const DEMO_PROJECT_ID = 'demo-project-gregg' // stable ID for idempotency


async function main() {
  // 1. Find user
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } })
  if (!user) {
    console.error(`User ${USER_EMAIL} not found. Aborting.`)
    process.exit(1)
  }
  console.log(`Found user: ${user.name} (${user.id})`)

  // 2. Upsert project
  const project = await prisma.project.upsert({
    where: { id: DEMO_PROJECT_ID },
    create: {
      id: DEMO_PROJECT_ID,
      userId: user.id,
      name: PROJECT_NAME,
      status: 'ACTIVE',
      currentStage: 'decide-order',
      activeToolKeys: ['mood_boards', 'finish_decisions'],
    },
    update: {
      name: PROJECT_NAME,
      status: 'ACTIVE',
    },
  })
  console.log(`Project "${project.name}" ready (${project.id})`)

  // 2b. Merge activeToolKeys (don't wipe existing)
  const needed = ['mood_boards', 'finish_decisions']
  const current = project.activeToolKeys || []
  const merged = [...new Set([...current, ...needed])]
  if (merged.length !== current.length) {
    await prisma.project.update({
      where: { id: project.id },
      data: { activeToolKeys: merged },
    })
    console.log(`activeToolKeys updated: ${merged.join(', ')}`)
  }

  // 3. Ensure ProjectMember OWNER
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
    create: { projectId: project.id, userId: user.id, role: 'OWNER' },
    update: {},
  })
  console.log('ProjectMember OWNER ensured')

  // 4. Set as current project
  await prisma.user.update({
    where: { id: user.id },
    data: { currentProjectId: project.id },
  })
  console.log('Set as current project')

  // 5. Seed tool payloads
  const now = new Date().toISOString()

  await upsertTool(project.id, 'mood_boards', buildMoodBoardsPayload(now))
  console.log('mood_boards payload seeded')

  await upsertTool(project.id, 'finish_decisions', buildFinishDecisionsPayload(now))
  console.log('finish_decisions payload seeded')

  console.log('\nDone! Log in and switch to the "Demo" project to see the data.')
}

async function upsertTool(projectId: string, toolKey: string, payload: object) {
  await prisma.toolInstance.upsert({
    where: { projectId_toolKey: { projectId, toolKey } },
    create: { projectId, toolKey, payload: payload as any },
    update: { payload: payload as any },
  })
}

// ============================================================================
// MOOD BOARDS PAYLOAD
// ============================================================================

function buildMoodBoardsPayload(now: string) {
  return {
    version: 1,
    boards: [
      // Board 1: Saved Ideas (default)
      {
        id: 'board_saved_ideas',
        name: 'Saved Ideas',
        isDefault: true,
        createdBy: USER_EMAIL,
        visibility: 'everyone',
        createdAt: now,
        updatedAt: now,
        ideas: [
          {
            id: 'idea-saved-1',
            name: 'Quartz with soft veining (countertop direction)',
            notes: 'Light + calm. Easy to keep timeless in Hawaii.',
            images: [
              {
                id: 'img-saved-1',
                url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop',
                label: 'Light quartz countertop detail',
                sourceUrl: 'https://unsplash.com/photos/modern-kitchen-detail-1600585154526-990dced4db0d',
              },
            ],
            heroImageId: 'img-saved-1',
            sourceUrl: 'https://www.caesarstoneus.com/countertops/5131-calacatta-nuvo/',
            sourceTitle: 'Caesarstone 5131 Calacatta Nuvo',
            tags: ['kitchen', 'countertop', 'quartz'],
            reactions: [
              { userId: USER_EMAIL, userName: 'Gregg', reaction: 'love' },
            ],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-saved-2',
            name: 'Outdoor pergola dining vibe',
            notes: 'Target feel for lanai: shaded, warm wood, easy hosting.',
            images: [
              {
                id: 'img-saved-2',
                url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop',
                label: 'Pergola outdoor dining',
                sourceUrl: 'https://unsplash.com/photos/wooden-pergola-with-dining-table-and-chairs-outdoors-ACA92yjUKpg',
              },
            ],
            heroImageId: 'img-saved-2',
            sourceUrl: 'https://unsplash.com/photos/wooden-pergola-with-dining-table-and-chairs-outdoors-ACA92yjUKpg',
            sourceTitle: 'Unsplash — pergola inspiration',
            tags: ['lanai', 'outdoor', 'pergola'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-saved-3',
            name: 'Spa bathroom: glass + stone + black accents',
            notes: 'Simple palette. Clean lines. Feels premium but not fussy.',
            images: [
              {
                id: 'img-saved-3',
                url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop',
                label: 'Shower + vanity composition',
                sourceUrl: 'https://unsplash.com/photos/a-bathroom-with-a-walk-in-shower-next-to-a-sink-NcqKlCLnmFA',
              },
            ],
            heroImageId: 'img-saved-3',
            sourceUrl: 'https://unsplash.com/photos/a-bathroom-with-a-walk-in-shower-next-to-a-sink-NcqKlCLnmFA',
            sourceTitle: 'Unsplash — bathroom inspiration',
            tags: ['bathroom', 'shower', 'modern'],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [
          {
            id: 'mbc-saved-1',
            text: 'Use this as the "north star" palette: light stone + warm accents.',
            authorName: 'Gregg',
            authorEmail: USER_EMAIL,
            createdAt: now,
            refIdeaId: 'idea-saved-1',
            refIdeaLabel: 'Quartz with soft veining (countertop direction)',
          },
        ],
      },

      // Board 2: Kitchen — Coastal Modern
      {
        id: 'board-kitchen-coastal-modern',
        name: 'Kitchen — Coastal Modern',
        createdBy: USER_EMAIL,
        visibility: 'everyone',
        createdAt: now,
        updatedAt: now,
        ideas: [
          {
            id: 'idea-kit-1',
            name: 'Bright modern kitchen composition',
            notes: 'Crisp white base, warm accents, feels airy.',
            images: [
              {
                id: 'img-kit-1a',
                url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&auto=format&fit=crop',
                label: 'Modern white kitchen',
              },
            ],
            heroImageId: 'img-kit-1a',
            sourceUrl: 'https://unsplash.com/s/photos/modern-white-kitchen',
            sourceTitle: 'Unsplash — modern white kitchen',
            tags: ['kitchen', 'layout'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-kit-2',
            name: 'Brass hardware direction (warm metal)',
            notes: 'Warm brass reads premium; pairs with white + oak tones.',
            images: [
              {
                id: 'img-kit-2a',
                url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&auto=format&fit=crop',
                label: 'Hardware close-up',
                sourceUrl: 'https://unsplash.com/photos/a-close-up-of-a-door-handle-on-a-wooden-door-4eipLlKdgcM',
              },
            ],
            heroImageId: 'img-kit-2a',
            sourceUrl: 'https://www.signaturehardware.com/6-in-avignon-solid-brass-cabinet-pull-with-backplate--antique-brass/465166.html',
            sourceTitle: 'Signature Hardware — brass pull reference',
            tags: ['kitchen', 'hardware', 'brass'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-kit-3',
            name: 'Blue accent tile idea (Hawaii-friendly coastal note)',
            notes: 'Use sparingly: niche / bar / backsplash band.',
            images: [
              {
                id: 'img-kit-3a',
                url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop',
                label: 'Tile close-up',
              },
            ],
            heroImageId: 'img-kit-3a',
            sourceUrl: 'https://unsplash.com/s/photos/blue-tile',
            sourceTitle: 'Unsplash — blue tile',
            tags: ['kitchen', 'tile', 'accent'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-kit-4',
            name: 'Open shelving moment (one wall only)',
            notes: 'Avoid clutter: use for 2–3 "display" zones only.',
            images: [
              {
                id: 'img-kit-4a',
                url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop',
                label: 'Open shelving kitchen',
              },
            ],
            heroImageId: 'img-kit-4a',
            sourceUrl: 'https://unsplash.com/s/photos/open-shelving-kitchen',
            sourceTitle: 'Unsplash — open shelving kitchen',
            tags: ['kitchen', 'shelving'],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [],
      },

      // Board 3: Bathroom — Spa Minimal
      {
        id: 'board-bathroom-spa-minimal',
        name: 'Bathroom — Spa Minimal',
        createdBy: USER_EMAIL,
        visibility: 'everyone',
        createdAt: now,
        updatedAt: now,
        ideas: [
          {
            id: 'idea-bath-1',
            name: 'Walk-in shower + glass',
            notes: 'Frameless glass, simple lines.',
            images: [
              {
                id: 'img-bath-1a',
                url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop',
                label: 'Shower + vanity composition',
              },
            ],
            heroImageId: 'img-bath-1a',
            sourceUrl: 'https://unsplash.com/photos/a-bathroom-with-a-walk-in-shower-next-to-a-sink-NcqKlCLnmFA',
            sourceTitle: 'Unsplash — bathroom composition',
            tags: ['bathroom', 'shower'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-bath-2',
            name: 'Terrazzo texture idea (floor direction)',
            notes: 'Fun without being loud. Works with white walls.',
            images: [
              {
                id: 'img-bath-2a',
                url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop',
                label: 'Terrazzo-ish pattern / modern bathroom vibe',
                sourceUrl: 'https://unsplash.com/photos/a-table-set-up-for-a-meal-under-a-pergolated-roof-z9MAxYlXv3s',
              },
            ],
            heroImageId: 'img-bath-2a',
            sourceUrl: 'https://unsplash.com/s/photos/terrazzo',
            sourceTitle: 'Unsplash — terrazzo references',
            tags: ['bathroom', 'flooring', 'tile'],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [],
      },

      // Board 4: Lanai — Outdoor Living
      {
        id: 'board-lanai-outdoor-living',
        name: 'Lanai — Outdoor Living',
        createdBy: USER_EMAIL,
        visibility: 'everyone',
        createdAt: now,
        updatedAt: now,
        ideas: [
          {
            id: 'idea-out-1',
            name: 'Pergola dining layout',
            notes: 'Core "hosting" setup.',
            images: [
              {
                id: 'img-out-1a',
                url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop',
                label: 'Pergola outdoor dining',
              },
            ],
            heroImageId: 'img-out-1a',
            sourceUrl: 'https://unsplash.com/photos/wooden-pergola-with-dining-table-and-chairs-outdoors-ACA92yjUKpg',
            sourceTitle: 'Unsplash — pergola dining',
            tags: ['lanai', 'pergola', 'dining'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-out-2',
            name: 'Surf culture accent (subtle)',
            notes: 'A small nod: art, photo, or board storage moment.',
            images: [
              {
                id: 'img-out-2a',
                url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&auto=format&fit=crop',
                label: 'Surfboards',
                sourceUrl: 'https://unsplash.com/photos/a-bunch-of-surfboards-are-lined-up-against-a-wall-QUV1AbcLtlA',
              },
            ],
            heroImageId: 'img-out-2a',
            sourceUrl: 'https://unsplash.com/photos/a-bunch-of-surfboards-are-lined-up-against-a-wall-QUV1AbcLtlA',
            sourceTitle: 'Unsplash — Waikiki surfboards',
            tags: ['lanai', 'art', 'hawaii'],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [],
      },
    ],
  }
}

// ============================================================================
// FINISH DECISIONS PAYLOAD
// ============================================================================

function buildFinishDecisionsPayload(now: string) {
  return {
    version: 3,
    rooms: [
      // ---- Room 1: Kitchen ----
      {
        id: 'room-demo-kitchen',
        type: 'kitchen',
        name: 'Kitchen',
        createdAt: now,
        updatedAt: now,
        decisions: [
          // Decision 1: Countertop
          {
            id: 'dec-demo-kitchen-countertop',
            title: 'Countertop',
            status: 'selected',
            notes: 'Going with quartz for low maintenance in humid climate.',
            options: [
              {
                id: 'opt-demo-kitchen-countertop-a',
                name: 'Caesarstone Calacatta Nuvo',
                notes: 'Soft marble-look veining on white base.',
                specs: 'Quartz, 3cm, polished, eased edge',
                price: '$4,800 installed (est.)',
                prosText: 'Bright, timeless; low maintenance; pairs with brass',
                consText: "Can feel 'too white' without warmth elsewhere",
                isSelected: true,
                urls: [
                  { id: 'lnk-opt-demo-k-ct-a-1', url: 'https://www.caesarstoneus.com/countertops/5131-calacatta-nuvo/', linkTitle: 'Caesarstone 5131 Calacatta Nuvo' },
                ],
                images: [
                  { id: 'img-opt-demo-k-ct-a-1', url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop', label: 'Quartz countertop detail' },
                ],
                heroImageId: 'img-opt-demo-k-ct-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-kitchen-countertop-b',
                name: 'Granite — Bianco Romano',
                notes: 'Natural stone with grey flecks.',
                specs: 'Granite, 3cm, polished, bullnose edge',
                price: '$3,600 installed (est.)',
                prosText: 'Natural variation; durable; lower cost than quartz',
                consText: 'Requires annual sealing; porous surface',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-ct-b-1', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&auto=format&fit=crop', label: 'Kitchen counter reference' },
                ],
                heroImageId: 'img-opt-demo-k-ct-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-kitchen-countertop-c',
                name: 'Butcher Block — White Oak',
                notes: 'Warm, natural feel for island only.',
                specs: 'White oak, 1.75in, edge-grain, mineral oil finish',
                price: '$2,200 for island (est.)',
                prosText: 'Warm tone; easy to sand/refinish; pairs with coastal vibe',
                consText: 'High maintenance; not heat resistant; scratches',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-ct-c-1', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop', label: 'Wood countertop kitchen' },
                ],
                heroImageId: 'img-opt-demo-k-ct-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [
              {
                id: 'cmt-demo-k-ct-1',
                text: 'Leaning Caesarstone — the veining reads softer in person.',
                authorName: 'Gregg',
                authorEmail: USER_EMAIL,
                createdAt: now,
                refOptionId: 'opt-demo-kitchen-countertop-a',
                refOptionLabel: 'Caesarstone Calacatta Nuvo',
              },
            ],
            createdAt: now,
            updatedAt: now,
          },

          // Decision 2: Cabinet Hardware
          {
            id: 'dec-demo-kitchen-hardware',
            title: 'Cabinet Hardware',
            status: 'deciding',
            notes: 'Need to pick between brass and black.',
            options: [
              {
                id: 'opt-demo-kitchen-hw-a',
                name: 'Brass Pulls — Avignon',
                notes: 'Warm, antique brass finish.',
                specs: '6-inch center-to-center, solid brass, unlacquered',
                price: '$18 each (~$540 for 30 pulls)',
                prosText: 'Warm tone; develops patina over time; premium feel',
                consText: 'Unlacquered brass tarnishes; needs polishing',
                urls: [
                  { id: 'lnk-opt-demo-k-hw-a-1', url: 'https://www.signaturehardware.com/6-in-avignon-solid-brass-cabinet-pull-with-backplate--antique-brass/465166.html', linkTitle: 'Signature Hardware Avignon' },
                ],
                images: [
                  { id: 'img-opt-demo-k-hw-a-1', url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&auto=format&fit=crop', label: 'Brass hardware close-up' },
                ],
                heroImageId: 'img-opt-demo-k-hw-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-kitchen-hw-b',
                name: 'Matte Black Bar Pulls',
                notes: 'Clean, modern contrast on white cabinets.',
                specs: '6.3-inch, stainless steel, matte black powder coat',
                price: '$8 each (~$240 for 30 pulls)',
                prosText: 'Budget friendly; crisp modern look; no maintenance',
                consText: 'Shows fingerprints; very common/less unique',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-hw-b-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop', label: 'Kitchen hardware reference' },
                ],
                heroImageId: 'img-opt-demo-k-hw-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-kitchen-hw-c',
                name: 'Brushed Nickel Knobs',
                notes: 'Safe, neutral option.',
                specs: '1.25-inch round knob, zinc alloy, brushed nickel',
                price: '$5 each (~$150 for 30 knobs)',
                prosText: 'Inexpensive; neutral; matches any style',
                consText: 'Reads builder-grade; less personality',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-hw-c-1', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&auto=format&fit=crop', label: 'Kitchen detail' },
                ],
                heroImageId: 'img-opt-demo-k-hw-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [],
            createdAt: now,
            updatedAt: now,
          },

          // Decision 3: Backsplash
          {
            id: 'dec-demo-kitchen-backsplash',
            title: 'Backsplash',
            status: 'deciding',
            notes: 'Want something that ties the countertop and hardware together.',
            options: [
              {
                id: 'opt-demo-kitchen-bs-a',
                name: 'White Subway Tile (3x6)',
                notes: 'Classic, clean, timeless.',
                specs: 'Ceramic, 3x6, glossy white, 1/16 grout line',
                price: '$1,200 installed (est.)',
                prosText: 'Timeless; inexpensive; easy to source',
                consText: 'Very common; can feel flat without contrast',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-bs-a-1', url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop', label: 'White kitchen tile' },
                ],
                heroImageId: 'img-opt-demo-k-bs-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-kitchen-bs-b',
                name: 'Blue Zellige Tile',
                notes: 'Coastal accent — handmade Moroccan tile.',
                specs: '4x4 zellige, hand-cut, glossy ocean blue',
                price: '$2,800 installed (est.)',
                prosText: 'Unique handmade character; bold coastal vibe; conversation piece',
                consText: 'Expensive; uneven surface can be hard to clean; bold commitment',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-bs-b-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop', label: 'Tile reference' },
                ],
                heroImageId: 'img-opt-demo-k-bs-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-kitchen-bs-c',
                name: 'Quartz Slab (full height)',
                notes: 'Seamless look — same material as countertop.',
                specs: 'Quartz slab, polished, matching countertop material',
                price: '$3,400 installed (est.)',
                prosText: 'Seamless modern look; easy to clean; no grout lines',
                consText: 'Higher cost; can look sterile without texture contrast',
                urls: [],
                images: [
                  { id: 'img-opt-demo-k-bs-c-1', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop', label: 'Seamless kitchen' },
                ],
                heroImageId: 'img-opt-demo-k-bs-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [
              {
                id: 'cmt-demo-k-bs-1',
                text: 'The zellige is beautiful but might be too bold for resale.',
                authorName: 'Gregg',
                authorEmail: USER_EMAIL,
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },

      // ---- Room 2: Primary Bath ----
      {
        id: 'room-demo-bath',
        type: 'bathroom',
        name: 'Primary Bath',
        createdAt: now,
        updatedAt: now,
        decisions: [
          // Decision 1: Floor Tile
          {
            id: 'dec-demo-bath-floor',
            title: 'Floor Tile',
            status: 'ordered',
            notes: 'Went with large format for fewer grout lines.',
            options: [
              {
                id: 'opt-demo-bath-floor-a',
                name: 'Large Format Porcelain (24x24)',
                notes: 'Clean, spa-like feel.',
                specs: 'Porcelain, 24x24, matte, rectified edge',
                price: '$2,100 installed (est.)',
                prosText: 'Minimal grout lines; easy to clean; spa feel',
                consText: 'Slippery when wet without texture; heavy tiles harder to install',
                isSelected: true,
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-fl-a-1', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop', label: 'Bathroom floor reference' },
                ],
                heroImageId: 'img-opt-demo-b-fl-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-bath-floor-b',
                name: 'Terrazzo Look Tile',
                notes: 'Fun pattern without being too loud.',
                specs: 'Porcelain, 12x12, matte, terrazzo pattern',
                price: '$2,400 installed (est.)',
                prosText: 'Playful yet sophisticated; hides dirt well; unique',
                consText: 'Pattern may date; harder to match if repairs needed',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-fl-b-1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop', label: 'Terrazzo pattern' },
                ],
                heroImageId: 'img-opt-demo-b-fl-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-bath-floor-c',
                name: 'Penny Round Mosaic (white)',
                notes: 'Classic bathroom tile.',
                specs: 'Porcelain, 3/4-inch rounds, matte white, mesh-backed',
                price: '$1,800 installed (est.)',
                prosText: 'Classic look; good traction; traditional spa feel',
                consText: 'Lots of grout to maintain; can feel busy',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-fl-c-1', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&auto=format&fit=crop', label: 'Bathroom tile detail' },
                ],
                heroImageId: 'img-opt-demo-b-fl-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [
              {
                id: 'cmt-demo-b-fl-1',
                text: 'Ordered the 24x24 — arrives in 3 weeks.',
                authorName: 'Gregg',
                authorEmail: USER_EMAIL,
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          },

          // Decision 2: Vanity
          {
            id: 'dec-demo-bath-vanity',
            title: 'Vanity',
            status: 'deciding',
            notes: 'Double vanity, 60-inch minimum.',
            options: [
              {
                id: 'opt-demo-bath-vanity-a',
                name: 'Floating Double Vanity — White Oak',
                notes: 'Warm wood, wall-mounted for airy feel.',
                specs: '60-inch, white oak veneer, soft-close, quartz top included',
                price: '$3,200 (vanity + top)',
                prosText: 'Floating design opens floor visually; warm tone; modern',
                consText: 'Requires wall blocking for mounting; less storage underneath',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-van-a-1', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop', label: 'Vanity reference' },
                ],
                heroImageId: 'img-opt-demo-b-van-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-bath-vanity-b',
                name: 'Freestanding — Dark Walnut',
                notes: 'Traditional with modern hardware.',
                specs: '60-inch, solid walnut, undermount sinks, marble top',
                price: '$4,100 (vanity + top)',
                prosText: 'Rich look; lots of drawer storage; feels substantial',
                consText: 'Harder to clean under; may feel heavy in small bath',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-van-b-1', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&auto=format&fit=crop', label: 'Dark vanity reference' },
                ],
                heroImageId: 'img-opt-demo-b-van-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-bath-vanity-c',
                name: 'Custom Built-In — Painted White',
                notes: 'Custom-fit to space, painted to match trim.',
                specs: 'Custom carpentry, painted MDF, quartz top, 66-inch',
                price: '$5,500 (est. custom build)',
                prosText: 'Perfect fit; maximizes storage; seamless look',
                consText: 'Longest lead time; most expensive; paint can chip',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-van-c-1', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop', label: 'Custom vanity' },
                ],
                heroImageId: 'img-opt-demo-b-van-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [],
            createdAt: now,
            updatedAt: now,
          },

          // Decision 3: Shower Fixtures
          {
            id: 'dec-demo-bath-fixtures',
            title: 'Shower Fixtures',
            status: 'selected',
            notes: 'Kohler Purist line for consistency.',
            options: [
              {
                id: 'opt-demo-bath-fix-a',
                name: 'Kohler Purist — Brushed Nickel',
                notes: 'Clean lines, matches vanity hardware.',
                specs: 'Thermostatic valve, rain head 10-inch, hand shower, brushed nickel',
                price: '$1,850 (fixture set)',
                prosText: 'Coordinated look; reliable brand; easy parts availability',
                consText: 'Premium price; brushed nickel shows water spots',
                isSelected: true,
                urls: [
                  { id: 'lnk-opt-demo-b-fix-a-1', url: 'https://www.kohler.com/en/products/kitchen-faucets/shop-purist-kitchen-faucets', linkTitle: 'Kohler Purist Collection' },
                ],
                images: [
                  { id: 'img-opt-demo-b-fix-a-1', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop', label: 'Shower fixture reference' },
                ],
                heroImageId: 'img-opt-demo-b-fix-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-bath-fix-b',
                name: 'Delta Trinsic — Matte Black',
                notes: 'Bold contrast on white tile.',
                specs: 'Pressure balance, rain head 8-inch, hand shower, matte black',
                price: '$980 (fixture set)',
                prosText: 'Budget friendly; bold look; matte hides water spots',
                consText: 'May clash with brass elsewhere; black can show soap residue',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-fix-b-1', url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&auto=format&fit=crop', label: 'Black fixture reference' },
                ],
                heroImageId: 'img-opt-demo-b-fix-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-bath-fix-c',
                name: 'Grohe Rainshower — Chrome',
                notes: 'European brand, high flow rate.',
                specs: 'Thermostat, 12-inch rain head, body jets x2, chrome',
                price: '$2,400 (fixture set)',
                prosText: 'Luxury shower experience; excellent water pressure; chrome is classic',
                consText: 'Most expensive; body jets add plumbing complexity',
                urls: [],
                images: [
                  { id: 'img-opt-demo-b-fix-c-1', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&auto=format&fit=crop', label: 'Luxury shower' },
                ],
                heroImageId: 'img-opt-demo-b-fix-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [
              {
                id: 'cmt-demo-b-fix-1',
                text: 'Kohler Purist confirmed — matches the brushed nickel theme throughout.',
                authorName: 'Gregg',
                authorEmail: USER_EMAIL,
                createdAt: now,
                refOptionId: 'opt-demo-bath-fix-a',
                refOptionLabel: 'Kohler Purist — Brushed Nickel',
              },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },

      // ---- Room 3: Lanai / Outdoor ----
      {
        id: 'room-demo-lanai',
        type: 'other',
        name: 'Lanai / Outdoor',
        createdAt: now,
        updatedAt: now,
        decisions: [
          // Decision 1: Decking
          {
            id: 'dec-demo-lanai-decking',
            title: 'Decking',
            status: 'selected',
            notes: 'Composite for zero maintenance in salt air.',
            options: [
              {
                id: 'opt-demo-lanai-deck-a',
                name: 'Trex Transcend — Havana Gold',
                notes: 'Tropical hardwood look, composite.',
                specs: '1x6 grooved, composite, 25yr structural warranty',
                price: '$14,500 installed (480 sq ft est.)',
                prosText: 'Zero maintenance; fade/stain/scratch resistant; tropical look',
                consText: 'Gets hot in direct sun; higher upfront cost than wood',
                isSelected: true,
                urls: [
                  { id: 'lnk-opt-demo-l-dk-a-1', url: 'https://www.trex.com/products/decking/transcend/', linkTitle: 'Trex Transcend Decking' },
                ],
                images: [
                  { id: 'img-opt-demo-l-dk-a-1', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop', label: 'Outdoor deck reference' },
                ],
                heroImageId: 'img-opt-demo-l-dk-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-lanai-deck-b',
                name: 'Ipe Hardwood',
                notes: 'Natural tropical hardwood, extremely durable.',
                specs: '1x6 tongue-and-groove, ipe, oil finish',
                price: '$18,200 installed (480 sq ft est.)',
                prosText: 'Beautiful natural grain; extremely hard; 40+ year lifespan',
                consText: 'Needs annual oiling; expensive; splinters if not maintained',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-dk-b-1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop', label: 'Wood deck reference' },
                ],
                heroImageId: 'img-opt-demo-l-dk-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-lanai-deck-c',
                name: 'Pressure-Treated Pine',
                notes: 'Budget option, needs regular staining.',
                specs: '2x6, pressure-treated #2 pine, semi-transparent stain',
                price: '$7,800 installed (480 sq ft est.)',
                prosText: 'Most affordable; readily available; easy to replace boards',
                consText: 'Requires staining every 2 years; warps in humidity; shorter lifespan',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-dk-c-1', url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&auto=format&fit=crop', label: 'Outdoor space' },
                ],
                heroImageId: 'img-opt-demo-l-dk-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [
              {
                id: 'cmt-demo-l-dk-1',
                text: 'Trex wins for salt air — zero maintenance is the priority here.',
                authorName: 'Gregg',
                authorEmail: USER_EMAIL,
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          },

          // Decision 2: Ceiling Fan + Light
          {
            id: 'dec-demo-lanai-fan',
            title: 'Ceiling Fan + Light',
            status: 'deciding',
            notes: 'Need damp-rated for covered lanai.',
            options: [
              {
                id: 'opt-demo-lanai-fan-a',
                name: 'Hunter Aerodyne 52" Smart Fan',
                notes: 'Smart home compatible, LED, modern look.',
                specs: '52-inch, 3-blade, LED dimmable, damp-rated, Wi-Fi + BT',
                price: '$350',
                prosText: 'Smart controls; whisper quiet; modern blade design; damp rated',
                consText: 'Plastic blades; requires Wi-Fi for smart features',
                urls: [
                  { id: 'lnk-opt-demo-l-fn-a-1', url: 'https://www.hunterfan.com/products/ceiling-fans-aerodyne-indoor-smart-fan-with-led-light-52-inch-with-remote-1001161', linkTitle: 'Hunter Aerodyne Smart Fan' },
                ],
                images: [
                  { id: 'img-opt-demo-l-fn-a-1', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop', label: 'Outdoor fan reference' },
                ],
                heroImageId: 'img-opt-demo-l-fn-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-lanai-fan-b',
                name: 'Big Ass Fans — Haiku L 52"',
                notes: 'Premium, ultra-quiet, bamboo blades.',
                specs: '52-inch, bamboo blades, LED, SenseME smart, damp-rated',
                price: '$1,295',
                prosText: 'Whisper quiet; beautiful bamboo blades; auto speed with SenseME',
                consText: 'Very expensive; limited finish options',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-fn-b-1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop', label: 'Fan reference' },
                ],
                heroImageId: 'img-opt-demo-l-fn-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-lanai-fan-c',
                name: 'Hampton Bay Gazebo II 52"',
                notes: 'Budget damp-rated option.',
                specs: '52-inch, 5-blade, pull chain, damp-rated, no smart',
                price: '$119',
                prosText: 'Very affordable; available at Home Depot; gets the job done',
                consText: 'Pull chain only; louder motor; basic styling',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-fn-c-1', url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&auto=format&fit=crop', label: 'Basic fan reference' },
                ],
                heroImageId: 'img-opt-demo-l-fn-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [],
            createdAt: now,
            updatedAt: now,
          },

          // Decision 3: Outdoor Dining Set
          {
            id: 'dec-demo-lanai-dining',
            title: 'Outdoor Dining Set',
            status: 'deciding',
            notes: 'Seats 6 minimum under the pergola.',
            options: [
              {
                id: 'opt-demo-lanai-dining-a',
                name: 'Teak Expandable Table + 6 Chairs',
                notes: 'Classic outdoor teak, weathers to silver.',
                specs: 'Grade A teak, extends 72-96 inch, stacking chairs',
                price: '$4,200 (set)',
                prosText: 'Timeless material; weathers beautifully; extends for guests',
                consText: 'Heavy; expensive; needs oil if you want to keep golden tone',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-dn-a-1', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop', label: 'Teak dining set' },
                ],
                heroImageId: 'img-opt-demo-l-dn-a-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-lanai-dining-b',
                name: 'Aluminum Frame + All-Weather Wicker',
                notes: 'Lightweight, modern, weather resistant.',
                specs: 'Powder-coated aluminum, synthetic wicker, 72-inch fixed table, 6 armchairs',
                price: '$2,800 (set)',
                prosText: 'Lightweight; rust-proof; cushions included; easy to move',
                consText: 'Wicker can degrade in intense UV; cushions need storage',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-dn-b-1', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop', label: 'Wicker dining' },
                ],
                heroImageId: 'img-opt-demo-l-dn-b-1',
                createdAt: now,
                updatedAt: now,
              },
              {
                id: 'opt-demo-lanai-dining-c',
                name: 'Concrete Table + Metal Chairs',
                notes: 'Industrial-modern look.',
                specs: 'Fiber-reinforced concrete, 84-inch, 6 powder-coated steel chairs',
                price: '$3,600 (set)',
                prosText: 'Extremely durable; unique look; no cushions to manage',
                consText: 'Very heavy; concrete can crack in extreme conditions; hard seats',
                urls: [],
                images: [
                  { id: 'img-opt-demo-l-dn-c-1', url: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&auto=format&fit=crop', label: 'Concrete outdoor' },
                ],
                heroImageId: 'img-opt-demo-l-dn-c-1',
                createdAt: now,
                updatedAt: now,
              },
            ],
            comments: [
              {
                id: 'cmt-demo-l-dn-1',
                text: 'Teak is the dream but the aluminum set is more practical for everyday.',
                authorName: 'Gregg',
                authorEmail: USER_EMAIL,
                createdAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
