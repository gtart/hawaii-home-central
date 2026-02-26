/**
 * Seed E2E test personas into the database.
 *
 * Idempotent: uses upserts throughout, safe to run repeatedly.
 * Run via: npx tsx scripts/seed-e2e-personas.ts
 *
 * IMPORTANT: The userId values here MUST match e2e/personas.ts exactly.
 * If you change a userId in either file, update the other.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// Persona definitions (duplicated from e2e/personas.ts -- scripts/ cannot
// import from e2e/ because scripts/ is excluded from tsconfig)
// ============================================================================

const PERSONA_USERS = [
  {
    userId: 'e2e-persona-new-user',
    name: 'New User',
    email: 'e2e-new-user@test.hhc.local',
  },
  {
    userId: 'e2e-persona-fixlist',
    name: 'Fix List User',
    email: 'e2e-fixlist@test.hhc.local',
  },
  {
    userId: 'e2e-persona-two-projects',
    name: 'Two Projects User',
    email: 'e2e-two-projects@test.hhc.local',
  },
  {
    userId: 'e2e-persona-full-setup',
    name: 'Full Setup User',
    email: 'e2e-full-setup@test.hhc.local',
  },
]

// ============================================================================
// Helpers
// ============================================================================

async function ensureProject(
  userId: string,
  projectId: string,
  projectName: string
) {
  await prisma.project.upsert({
    where: { id: projectId },
    create: { id: projectId, userId, name: projectName, status: 'ACTIVE' },
    update: { name: projectName, status: 'ACTIVE' },
  })

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, role: 'OWNER' },
    update: {},
  })
}

async function setCurrentProject(userId: string, projectId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { currentProjectId: projectId },
  })
}

async function upsertTool(projectId: string, toolKey: string, payload: object) {
  await prisma.toolInstance.upsert({
    where: { projectId_toolKey: { projectId, toolKey } },
    create: { projectId, toolKey, payload: payload as any },
    update: { payload: payload as any },
  })
}

// ============================================================================
// Punchlist payload builder
// ============================================================================

function buildPunchlistPayload(
  count: number,
  personaName: string,
  personaEmail: string
) {
  const locations = ['Kitchen', 'Master Bath', 'Living Room']
  const assignees = ['General Contractor', 'Plumber', 'Electrician']
  const statuses = ['OPEN', 'ACCEPTED', 'DONE'] as const
  const priorities = ['LOW', 'MED', 'HIGH'] as const

  const titles = [
    'Cracked tile near doorway',
    'Leaky faucet handle',
    'Drywall patch needed',
    'Paint touch-up above trim',
    'Loose cabinet handle',
    'Cabinet door alignment off',
    'Grout repair in shower',
    'Light switch plate crooked',
    'Door sticks when closing',
    'Trim gap at baseboard joint',
    'Outlet cover missing',
    'Caulk cracking at tub edge',
    'Window seal peeling',
    'Baseboard nick from moving',
    'Vent cover rattles',
    'Drawer slide catching',
    'Threshold strip lifting',
    'Towel bar loose in drywall',
  ]

  const now = new Date().toISOString()

  const items = Array.from({ length: count }, (_, i) => {
    const num = i + 1
    const status = statuses[i % 3]

    return {
      id: `pli-${personaName.toLowerCase().replace(/\s+/g, '-')}-${num}`,
      itemNumber: num,
      title: titles[i % titles.length],
      location: locations[i % 3],
      status,
      assigneeLabel: assignees[i % 3],
      priority: priorities[i % 3],
      notes:
        i % 2 === 0
          ? `Needs attention before final walkthrough. Spotted during ${locations[i % 3]} inspection.`
          : '',
      comments:
        i % 4 === 0
          ? [
              {
                id: `plc-${num}-1`,
                text: 'Contractor acknowledged this item on site visit.',
                authorName: personaName,
                authorEmail: personaEmail,
                createdAt: now,
              },
            ]
          : [],
      photos: [],
      createdByName: personaName,
      createdByEmail: personaEmail,
      createdAt: now,
      updatedAt: now,
      ...(status === 'DONE' ? { completedAt: now } : {}),
    }
  })

  return {
    version: 3,
    nextItemNumber: count + 1,
    items,
  }
}

// ============================================================================
// Finish Decisions (Selections List) payload builder
// ============================================================================

function buildFinishDecisionsPayload(personaName: string, personaEmail: string) {
  const now = new Date().toISOString()
  const decisionStatuses = ['deciding', 'selected', 'ordered', 'done'] as const

  const roomDefs = [
    {
      id: 'room-kitchen',
      type: 'kitchen',
      name: 'Kitchen',
      decisions: [
        'Countertop',
        'Cabinetry',
        'Appliances - Range',
        'Sink & Faucet',
        'Backsplash',
      ],
    },
    {
      id: 'room-bathroom',
      type: 'bathroom',
      name: 'Bathroom',
      decisions: ['Vanity', 'Countertop', 'Toilet', 'Floor Tile', 'Wall Tile'],
    },
    {
      id: 'room-living',
      type: 'living_room',
      name: 'Living Room',
      decisions: ['Flooring', 'Paint', 'Lighting', 'Window Treatments'],
    },
  ]

  const rooms = roomDefs.map((room, ri) => ({
    id: room.id,
    type: room.type,
    name: room.name,
    createdAt: now,
    updatedAt: now,
    decisions: room.decisions.map((title, di) => {
      const status = decisionStatuses[(ri + di) % 4]

      // Alternate: even index = 1 option (single choice), odd = 2-4 options
      const optionCount = di % 2 === 0 ? 1 : 2 + (di % 3)

      const options = Array.from({ length: optionCount }, (_, oi) => ({
        id: `opt-${room.id}-${di}-${oi}`,
        name: `${title} Option ${String.fromCharCode(65 + oi)}`,
        notes: `Specs for ${title} option ${String.fromCharCode(65 + oi)}: sample material, color, dimensions.`,
        urls: [] as any[],
        isSelected: oi === 0 && status !== 'deciding',
        kind: 'text' as const,
        createdAt: now,
        updatedAt: now,
      }))

      const comments =
        di === 0
          ? [
              {
                id: `sc-${room.id}-${di}`,
                text: `Leaning toward ${title} Option A based on samples.`,
                authorName: personaName,
                authorEmail: personaEmail,
                createdAt: now,
              },
            ]
          : []

      return {
        id: `dec-${room.id}-${di}`,
        title,
        status,
        notes: `Notes: researching ${title.toLowerCase()} options for ${room.name}.`,
        options,
        dueDate: null,
        comments,
        createdAt: now,
        updatedAt: now,
      }
    }),
  }))

  return { version: 3, rooms }
}

// ============================================================================
// Before You Sign (Contract Checklist) payload builder
// ============================================================================

function buildBYSPayload() {
  const contractors = [
    {
      id: 'gc-alpha',
      name: 'Alpha Builders',
      notes: 'Local GC with 15 years experience. Licensed, insured, good references.',
      totalValue: '285000',
      laborEstimate: '120000',
      materialsEstimate: '145000',
      allowances: '20000',
      contractType: 'fixed' as const,
    },
    {
      id: 'gc-beta',
      name: 'Beta Construction',
      notes: 'Recommended by neighbor. Specializes in coastal properties.',
      totalValue: '310000',
      laborEstimate: '140000',
      materialsEstimate: '150000',
      allowances: '20000',
      contractType: 'cost_plus' as const,
    },
    {
      id: 'gc-gamma',
      name: 'Gamma Renovations',
      notes: 'Newer company with competitive pricing. Strong online reviews.',
      totalValue: '265000',
      laborEstimate: '110000',
      materialsEstimate: '135000',
      allowances: '20000',
      contractType: 'time_materials' as const,
    },
  ]

  const quotesItemIds = [
    'scope-written-description',
    'scope-plans-referenced',
    'scope-specs-included',
    'scope-demo-included',
    'labor-trades-listed',
    'labor-rates-transparent',
    'materials-brand-model',
    'materials-grade-quality',
    'allowances-identified',
    'allowances-realistic',
    'permits-included',
    'permits-who-pulls',
    'timeline-start-date',
    'timeline-milestones',
    'change-process',
    'change-markup',
    'payment-schedule',
    'payment-deposit',
    'warranty-workmanship',
    'warranty-materials',
  ]

  const handoffsItemIds = [
    'permits-inspections',
    'allowances-selections',
    'buying-long-lead',
    'delivery-scheduling',
    'storage-protection',
    'plumbing-rough-in',
    'electrical-fixture-locations',
    'backing-blocking',
    'tile-layout-grout',
    'waterproofing-warranty',
  ]

  const agreeItemIds = [
    'change_orders',
    'payment_timing',
    'allowances',
    'communication',
  ]

  const triStatuses = ['yes', 'no', 'unknown'] as const

  const answers: Record<string, Record<string, Record<string, { status: string; notes: string }>>> = {
    quotes: {},
    handoffs: {},
    agree: {},
  }

  for (let ci = 0; ci < contractors.length; ci++) {
    const gc = contractors[ci]

    // Quotes answers
    answers.quotes[gc.id] = {}
    for (let i = 0; i < quotesItemIds.length; i++) {
      const statusIdx = (i + ci) % 3
      answers.quotes[gc.id][quotesItemIds[i]] = {
        status: triStatuses[statusIdx],
        notes: statusIdx === 1 ? `${gc.name}: missing info on ${quotesItemIds[i]}` : '',
      }
    }

    // Handoffs answers
    answers.handoffs[gc.id] = {}
    for (let i = 0; i < handoffsItemIds.length; i++) {
      const statusIdx = (i + ci + 1) % 3
      answers.handoffs[gc.id][handoffsItemIds[i]] = {
        status: triStatuses[statusIdx],
        notes: i % 3 === 0 ? `${gc.name}: discussed during walkthrough` : '',
      }
    }

    // Agree answers
    answers.agree[gc.id] = {}
    for (let i = 0; i < agreeItemIds.length; i++) {
      const statusIdx = (i + ci) % 3
      answers.agree[gc.id][agreeItemIds[i]] = {
        status: triStatuses[statusIdx],
        notes: `${gc.name}: ${agreeItemIds[i].replace(/_/g, ' ')} discussed`,
      }
    }
  }

  return {
    version: 1,
    contractors,
    selectedContractorIds: [contractors[0].id, contractors[1].id],
    answers,
    customAgreeItems: [],
  }
}

// ============================================================================
// Mood Boards payload builder
// ============================================================================

function buildMoodBoardsPayload(personaName: string, personaEmail: string) {
  const now = new Date().toISOString()

  return {
    version: 1,
    boards: [
      {
        id: 'board_saved_ideas',
        name: 'Saved Ideas',
        isDefault: true,
        ideas: [
          {
            id: 'idea-saved-1',
            name: 'Coastal Blue Backsplash Tile',
            notes: 'Love this shade of blue. Would pair well with white countertops.',
            images: [
              {
                id: 'img-saved-1',
                url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
                label: 'Blue tile close-up',
              },
            ],
            heroImageId: 'img-saved-1',
            sourceUrl: 'https://example.com/products/coastal-tile',
            sourceTitle: 'Coastal Blue Backsplash Tile',
            tags: ['tile', 'kitchen'],
            reactions: [
              { userId: personaEmail, userName: personaName, reaction: 'love' as const },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [
          {
            id: 'mbc-saved-1',
            text: 'This would be perfect for the kitchen!',
            authorName: personaName,
            authorEmail: personaEmail,
            createdAt: now,
            refIdeaId: 'idea-saved-1',
            refIdeaLabel: 'Coastal Blue Backsplash Tile',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'board-kitchen-inspo',
        name: 'Kitchen Inspiration',
        ideas: [
          {
            id: 'idea-kitchen-1',
            name: 'Modern White Kitchen',
            notes: 'Clean lines, lots of natural light. Quartz countertops.',
            images: [
              {
                id: 'img-kitchen-1',
                url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
                label: 'Modern kitchen overview',
              },
              {
                id: 'img-kitchen-2',
                url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400',
                label: 'Kitchen detail',
              },
            ],
            heroImageId: 'img-kitchen-1',
            sourceUrl: 'https://example.com/gallery/modern-kitchen',
            sourceTitle: 'Modern White Kitchen Design',
            tags: ['kitchen', 'modern'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-kitchen-2',
            name: 'Brass Hardware Pulls',
            notes: 'Brushed brass finish, 5 inch center-to-center.',
            images: [],
            heroImageId: null,
            sourceUrl: '',
            sourceTitle: '',
            tags: ['hardware'],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: 'idea-kitchen-3',
            name: 'Open Shelving Concept',
            notes: 'Floating wood shelves instead of upper cabinets on one wall.',
            images: [
              {
                id: 'img-kitchen-3',
                url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
                label: 'Open shelving kitchen',
              },
            ],
            heroImageId: 'img-kitchen-3',
            sourceUrl: 'https://example.com/design/open-shelving',
            sourceTitle: 'Open Shelving Design Ideas',
            tags: ['kitchen', 'shelving'],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'board-bathroom-inspo',
        name: 'Bathroom Ideas',
        ideas: [
          {
            id: 'idea-bath-1',
            name: 'Walk-in Shower with Bench',
            notes: 'Frameless glass, rainfall showerhead, heated bench.',
            images: [
              {
                id: 'img-bath-1',
                url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400',
                label: 'Walk-in shower',
              },
            ],
            heroImageId: 'img-bath-1',
            sourceUrl: 'https://example.com/bath/walk-in-shower',
            sourceTitle: 'Walk-in Shower Designs',
            tags: ['bathroom', 'shower'],
            createdAt: now,
            updatedAt: now,
          },
        ],
        comments: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
  }
}

// ============================================================================
// Persona seeders
// ============================================================================

async function seedPersona1_NewUser() {
  console.log('\n-- Persona 1: New User (no projects) --')
  console.log('  (no projects, no tools -- user will see empty/onboarding state)')
}

async function seedPersona2_Fixlist() {
  console.log('\n-- Persona 2: Fix List Only --')

  const userId = 'e2e-persona-fixlist'
  const projectId = 'e2e-proj-fixlist'

  await ensureProject(userId, projectId, 'My Home')
  await setCurrentProject(userId, projectId)

  const punchlistPayload = buildPunchlistPayload(
    15,
    'Fix List User',
    'e2e-fixlist@test.hhc.local'
  )
  await upsertTool(projectId, 'punchlist', punchlistPayload)

  console.log(`  Project: ${projectId} ("My Home")`)
  console.log(`  Punchlist: ${punchlistPayload.items.length} items`)
  console.log(
    `    Statuses: OPEN=${punchlistPayload.items.filter((i) => i.status === 'OPEN').length}, ` +
      `ACCEPTED=${punchlistPayload.items.filter((i) => i.status === 'ACCEPTED').length}, ` +
      `DONE=${punchlistPayload.items.filter((i) => i.status === 'DONE').length}`
  )
  console.log(
    `    Locations: ${[...new Set(punchlistPayload.items.map((i) => i.location))].join(', ')}`
  )
  console.log(
    `    Assignees: ${[...new Set(punchlistPayload.items.map((i) => i.assigneeLabel))].join(', ')}`
  )
}

async function seedPersona3_TwoProjects() {
  console.log('\n-- Persona 3: Two Projects --')

  const userId = 'e2e-persona-two-projects'
  const projects = [
    { id: 'e2e-proj-beach', name: 'Beach House' },
    { id: 'e2e-proj-condo', name: 'Condo Remodel' },
  ]

  for (const proj of projects) {
    await ensureProject(userId, proj.id, proj.name)

    const payload = buildPunchlistPayload(
      3,
      'Two Projects User',
      'e2e-two-projects@test.hhc.local'
    )
    // Prefix item IDs with project ID to avoid collisions
    payload.items = payload.items.map((item, i) => ({
      ...item,
      id: `pli-${proj.id}-${i + 1}`,
      title: `${proj.name}: ${item.title}`,
    }))

    await upsertTool(proj.id, 'punchlist', payload)
    console.log(`  Project: ${proj.id} ("${proj.name}") -- ${payload.items.length} punchlist items`)
  }

  // Set first project as current
  await setCurrentProject(userId, projects[0].id)
}

async function seedPersona4_FullSetup() {
  console.log('\n-- Persona 4: Full Setup --')

  const userId = 'e2e-persona-full-setup'
  const projectId = 'e2e-proj-full'

  await ensureProject(userId, projectId, 'Our Renovation')
  await setCurrentProject(userId, projectId)

  // 1. Punchlist
  const punchlistPayload = buildPunchlistPayload(
    16,
    'Full Setup User',
    'e2e-full-setup@test.hhc.local'
  )
  await upsertTool(projectId, 'punchlist', punchlistPayload)
  console.log(`  Punchlist: ${punchlistPayload.items.length} items`)

  // 2. Finish Decisions (Selections List)
  const finishPayload = buildFinishDecisionsPayload(
    'Full Setup User',
    'e2e-full-setup@test.hhc.local'
  )
  await upsertTool(projectId, 'finish_decisions', finishPayload)
  console.log(
    `  Selections: ${finishPayload.rooms.length} rooms, ` +
      `${finishPayload.rooms.reduce((s, r) => s + r.decisions.length, 0)} decisions`
  )

  // 3. Before You Sign (Contract Checklist)
  const bysPayload = buildBYSPayload()
  await upsertTool(projectId, 'before_you_sign', bysPayload)
  console.log(
    `  Contracts: ${bysPayload.contractors.length} contractors, ` +
      `${bysPayload.selectedContractorIds.length} selected`
  )

  // 4. Mood Boards
  const moodPayload = buildMoodBoardsPayload(
    'Full Setup User',
    'e2e-full-setup@test.hhc.local'
  )
  await upsertTool(projectId, 'mood_boards', moodPayload)
  console.log(
    `  Mood Boards: ${moodPayload.boards.length} boards, ` +
      `${moodPayload.boards.reduce((s, b) => s + b.ideas.length, 0)} ideas`
  )
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Seeding E2E test personas...')

  // Upsert all 4 users
  for (const p of PERSONA_USERS) {
    await prisma.user.upsert({
      where: { id: p.userId },
      create: {
        id: p.userId,
        name: p.name,
        email: p.email,
        hasBootstrappedProject: true,
      },
      update: {
        name: p.name,
        email: p.email,
        hasBootstrappedProject: true,
      },
    })
    console.log(`  User: ${p.name} (${p.userId})`)
  }

  await seedPersona1_NewUser()
  await seedPersona2_Fixlist()
  await seedPersona3_TwoProjects()
  await seedPersona4_FullSetup()

  console.log('\nAll personas seeded successfully.')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
