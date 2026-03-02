/**
 * Migrate ToolInstance data → ToolCollection rows.
 *
 * Strategy per tool:
 *   finish_decisions  → 1:1 (one collection per ToolInstance)
 *   punchlist          → 1:1
 *   before_you_sign    → 1:1
 *   mood_boards        → 1:N (each Board becomes its own collection)
 *
 * Also migrates:
 *   ProjectToolAccess  → ToolCollectionMember
 *   ToolShareToken     → ToolCollectionShareToken
 *   ProjectInvite      → ToolCollectionInvite (PENDING only)
 *
 * Usage:  npx tsx scripts/migrate-to-collections.ts
 * Safe to run repeatedly (idempotent — skips already-migrated data).
 */

import { PrismaClient, type CollectionRole } from '@prisma/client'

const prisma = new PrismaClient()

// Default titles for 1:1 tools
const DEFAULT_TITLES: Record<string, string> = {
  finish_decisions: 'Main Decision List',
  punchlist: 'Main Fix List',
  before_you_sign: 'Main Contract Comparison',
}

interface MoodBoard {
  id: string
  name: string
  isDefault?: boolean
  visibility?: string
  access?: Array<{ email: string; level: string }>
  ideas?: unknown[]
  comments?: unknown[]
  [key: string]: unknown
}

interface MoodBoardPayload {
  version?: number
  boards?: MoodBoard[]
}

async function main() {
  console.log('=== Migrate ToolInstances → ToolCollections ===\n')

  // 1. Load all ToolInstances
  const instances = await prisma.toolInstance.findMany({
    include: { project: { include: { members: true } } },
  })
  console.log(`Found ${instances.length} ToolInstances to process.`)

  // Track created collections for access/token migration
  const collectionMap = new Map<string, string>() // "projectId:toolKey" → first collectionId
  const boardCollectionMap = new Map<string, string>() // "projectId:boardId" → collectionId

  let created = 0
  let skipped = 0

  for (const inst of instances) {
    // Find the project owner
    const owner = inst.project.members.find((m) => m.role === 'OWNER')
    const creatorId = owner?.userId ?? inst.project.userId

    if (inst.toolKey === 'mood_boards') {
      // 1:N — each board becomes its own collection
      const payload = inst.payload as MoodBoardPayload
      const boards = payload?.boards ?? []

      if (boards.length === 0) {
        // Empty mood board — create one empty collection
        const existing = await prisma.toolCollection.findFirst({
          where: { projectId: inst.projectId, toolKey: inst.toolKey },
        })
        if (existing) {
          skipped++
          collectionMap.set(`${inst.projectId}:${inst.toolKey}`, existing.id)
          continue
        }
        const coll = await prisma.toolCollection.create({
          data: {
            projectId: inst.projectId,
            toolKey: inst.toolKey,
            title: 'Saved Ideas',
            payload: { version: 2, ideas: [], comments: [] },
            createdByUserId: creatorId,
          },
        })
        collectionMap.set(`${inst.projectId}:${inst.toolKey}`, coll.id)
        created++
        continue
      }

      for (const board of boards) {
        // Check if already migrated (by looking for matching title + toolKey + projectId)
        const existing = await prisma.toolCollection.findFirst({
          where: {
            projectId: inst.projectId,
            toolKey: inst.toolKey,
            payload: {
              path: ['legacyBoardId'],
              equals: board.id,
            },
          },
        })
        if (existing) {
          skipped++
          boardCollectionMap.set(`${inst.projectId}:${board.id}`, existing.id)
          if (!collectionMap.has(`${inst.projectId}:${inst.toolKey}`)) {
            collectionMap.set(`${inst.projectId}:${inst.toolKey}`, existing.id)
          }
          continue
        }

        // Restructure: board → flat collection payload
        const collPayload = {
          version: 2,
          legacyBoardId: board.id,
          ideas: board.ideas ?? [],
          comments: board.comments ?? [],
        }

        const coll = await prisma.toolCollection.create({
          data: {
            projectId: inst.projectId,
            toolKey: inst.toolKey,
            title: board.name || (board.isDefault ? 'Saved Ideas' : 'Untitled Board'),
            payload: collPayload,
            createdByUserId: creatorId,
          },
        })

        boardCollectionMap.set(`${inst.projectId}:${board.id}`, coll.id)
        if (!collectionMap.has(`${inst.projectId}:${inst.toolKey}`)) {
          collectionMap.set(`${inst.projectId}:${inst.toolKey}`, coll.id)
        }
        created++

        // Migrate board-level ACL into ToolCollectionMembers
        if (board.access && board.access.length > 0) {
          for (const acc of board.access) {
            const user = await prisma.user.findUnique({ where: { email: acc.email } })
            if (!user) continue
            const role: CollectionRole = acc.level === 'EDIT' ? 'EDITOR' : 'VIEWER'
            await prisma.toolCollectionMember.upsert({
              where: { collectionId_userId: { collectionId: coll.id, userId: user.id } },
              create: { collectionId: coll.id, userId: user.id, role },
              update: { role },
            })
          }
        }
      }
    } else {
      // 1:1 — entire payload moves to one collection
      const mapKey = `${inst.projectId}:${inst.toolKey}`
      const existing = await prisma.toolCollection.findFirst({
        where: { projectId: inst.projectId, toolKey: inst.toolKey },
      })
      if (existing) {
        skipped++
        collectionMap.set(mapKey, existing.id)
        continue
      }

      const coll = await prisma.toolCollection.create({
        data: {
          projectId: inst.projectId,
          toolKey: inst.toolKey,
          title: DEFAULT_TITLES[inst.toolKey] ?? 'Untitled',
          payload: inst.payload ?? {},
          createdByUserId: creatorId,
        },
      })
      collectionMap.set(mapKey, coll.id)
      created++
    }
  }

  console.log(`  Collections: ${created} created, ${skipped} skipped (already exist).\n`)

  // 2. Migrate ProjectToolAccess → ToolCollectionMember
  console.log('Migrating ProjectToolAccess → ToolCollectionMember...')
  const accessRows = await prisma.projectToolAccess.findMany()
  let accessMigrated = 0
  let accessSkipped = 0

  for (const acc of accessRows) {
    const mapKey = `${acc.projectId}:${acc.toolKey}`
    // For mood boards, apply to all collections; for others, apply to the single collection
    const collections = await prisma.toolCollection.findMany({
      where: { projectId: acc.projectId, toolKey: acc.toolKey },
    })

    for (const coll of collections) {
      const role: CollectionRole = acc.level === 'EDIT' ? 'EDITOR' : 'VIEWER'
      try {
        await prisma.toolCollectionMember.upsert({
          where: { collectionId_userId: { collectionId: coll.id, userId: acc.userId } },
          create: { collectionId: coll.id, userId: acc.userId, role },
          update: {}, // Don't overwrite if already exists (board-level ACL may be more specific)
        })
        accessMigrated++
      } catch {
        accessSkipped++
      }
    }
  }
  console.log(`  Members: ${accessMigrated} created, ${accessSkipped} skipped.\n`)

  // 3. Migrate ToolShareToken → ToolCollectionShareToken
  console.log('Migrating ToolShareToken → ToolCollectionShareToken...')
  const shareTokens = await prisma.toolShareToken.findMany()
  let tokensMigrated = 0
  let tokensSkipped = 0

  for (const st of shareTokens) {
    // Check if already migrated (by token string)
    const existing = await prisma.toolCollectionShareToken.findUnique({
      where: { token: st.token },
    })
    if (existing) {
      tokensSkipped++
      continue
    }

    let collectionId: string | undefined

    // For mood boards with boardId in settings, map to specific collection
    const settings = st.settings as Record<string, unknown> | null
    if (st.toolKey === 'mood_boards' && settings?.boardId) {
      collectionId = boardCollectionMap.get(`${st.projectId}:${settings.boardId}`)
    }

    // Fall back to first collection for (projectId, toolKey)
    if (!collectionId) {
      collectionId = collectionMap.get(`${st.projectId}:${st.toolKey}`)
    }

    if (!collectionId) {
      // No collection found — find one in the DB
      const coll = await prisma.toolCollection.findFirst({
        where: { projectId: st.projectId, toolKey: st.toolKey },
      })
      collectionId = coll?.id
    }

    if (!collectionId) {
      console.warn(`  WARN: No collection for share token ${st.id} (${st.projectId}:${st.toolKey}). Skipping.`)
      tokensSkipped++
      continue
    }

    await prisma.toolCollectionShareToken.create({
      data: {
        token: st.token,
        collectionId,
        permissions: st.permissions,
        settings: st.settings ?? {},
        createdBy: st.createdBy,
        revokedAt: st.revokedAt,
        expiresAt: st.expiresAt,
      },
    })
    tokensMigrated++
  }
  console.log(`  Share tokens: ${tokensMigrated} migrated, ${tokensSkipped} skipped.\n`)

  // 4. Migrate PENDING ProjectInvite → ToolCollectionInvite
  console.log('Migrating PENDING ProjectInvite → ToolCollectionInvite...')
  const pendingInvites = await prisma.projectInvite.findMany({
    where: { status: 'PENDING' },
  })
  let invitesMigrated = 0
  let invitesSkipped = 0

  for (const inv of pendingInvites) {
    // Check if already migrated
    const existing = await prisma.toolCollectionInvite.findFirst({
      where: { token: inv.token },
    })
    if (existing) {
      invitesSkipped++
      continue
    }

    const collectionId = collectionMap.get(`${inv.projectId}:${inv.toolKey}`)
    if (!collectionId) {
      const coll = await prisma.toolCollection.findFirst({
        where: { projectId: inv.projectId, toolKey: inv.toolKey },
      })
      if (!coll) {
        console.warn(`  WARN: No collection for invite ${inv.id} (${inv.projectId}:${inv.toolKey}). Skipping.`)
        invitesSkipped++
        continue
      }
    }

    const targetCollectionId = collectionId ?? (await prisma.toolCollection.findFirst({
      where: { projectId: inv.projectId, toolKey: inv.toolKey },
    }))?.id

    if (!targetCollectionId) {
      invitesSkipped++
      continue
    }

    const role: CollectionRole = inv.level === 'EDIT' ? 'EDITOR' : 'VIEWER'

    await prisma.toolCollectionInvite.create({
      data: {
        collectionId: targetCollectionId,
        email: inv.email,
        role,
        token: inv.token,
        status: inv.status,
        invitedBy: inv.invitedBy,
        expiresAt: inv.expiresAt,
      },
    })
    invitesMigrated++
  }
  console.log(`  Invites: ${invitesMigrated} migrated, ${invitesSkipped} skipped.\n`)

  // 5. Verification
  console.log('=== Verification ===')
  const collCount = await prisma.toolCollection.count()
  const instCount = await prisma.toolInstance.count()
  const memberCount = await prisma.toolCollectionMember.count()
  const ptaCount = await prisma.projectToolAccess.count()
  const newTokenCount = await prisma.toolCollectionShareToken.count()
  const oldTokenCount = await prisma.toolShareToken.count()

  console.log(`  ToolCollections: ${collCount} (should be >= ToolInstances: ${instCount})`)
  console.log(`  ToolCollectionMembers: ${memberCount} (should be >= ProjectToolAccess: ${ptaCount})`)
  console.log(`  ToolCollectionShareTokens: ${newTokenCount} (should be = ToolShareTokens: ${oldTokenCount})`)

  if (collCount < instCount) {
    console.warn('  WARNING: Fewer collections than instances!')
  }
  if (newTokenCount < oldTokenCount) {
    console.warn('  WARNING: Some share tokens were not migrated!')
  }

  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
