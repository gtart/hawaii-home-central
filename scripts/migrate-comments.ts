/**
 * Migrate embedded JSON comments -> Comment table.
 *
 * Reads all ToolCollection payloads for finish_decisions, mood_boards, and
 * punchlist, extracts comments from nested structures, and inserts them into
 * the Comment table.
 *
 * Idempotent: skips any comment whose legacyId already exists.
 *
 * Usage:  npx tsx scripts/migrate-comments.ts
 *         npx tsx scripts/migrate-comments.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

interface LegacyComment {
  id: string
  text: string
  authorName: string
  authorEmail: string
  createdAt: string
}

interface SelectionComment extends LegacyComment {
  refOptionId?: string
  refOptionLabel?: string
}

interface RoomComment extends LegacyComment {
  refDecisionId?: string
  refDecisionTitle?: string
}

interface MoodBoardComment extends LegacyComment {
  refIdeaId?: string
  refIdeaLabel?: string
}

interface CommentInsert {
  collectionId: string
  toolKey: string
  targetType: string
  targetId: string
  text: string
  authorUserId: string | null
  authorName: string
  authorEmail: string
  refEntityType: string | null
  refEntityId: string | null
  refEntityLabel: string | null
  legacyId: string
  createdAt: Date
}

async function main() {
  console.log(`=== Migrate Comments to DB${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`)

  // Build email -> userId lookup
  const users = await prisma.user.findMany({ select: { id: true, email: true } })
  const emailToId = new Map<string, string>()
  for (const u of users) {
    if (u.email) emailToId.set(u.email.toLowerCase(), u.id)
  }
  console.log(`Loaded ${emailToId.size} users for email->id mapping`)

  // Check existing legacyIds to skip duplicates
  const existing = await prisma.comment.findMany({
    where: { legacyId: { not: null } },
    select: { legacyId: true },
  })
  const existingIds = new Set(existing.map((c) => c.legacyId))
  console.log(`Found ${existingIds.size} already-migrated comments\n`)

  const inserts: CommentInsert[] = []

  // --- Finish Decisions ---
  const fdCollections = await prisma.toolCollection.findMany({
    where: { toolKey: 'finish_decisions' },
    select: { id: true, payload: true },
  })
  console.log(`Processing ${fdCollections.length} finish_decisions collections...`)

  for (const coll of fdCollections) {
    const payload = coll.payload as { rooms?: Array<{
      id: string
      comments?: RoomComment[]
      decisions?: Array<{
        id: string
        comments?: SelectionComment[]
      }>
    }> }
    if (!payload?.rooms) continue

    for (const room of payload.rooms) {
      // Room-level comments
      for (const c of room.comments || []) {
        if (existingIds.has(c.id)) continue
        inserts.push({
          collectionId: coll.id,
          toolKey: 'finish_decisions',
          targetType: 'room',
          targetId: room.id,
          text: c.text,
          authorUserId: emailToId.get(c.authorEmail?.toLowerCase()) ?? null,
          authorName: c.authorName,
          authorEmail: c.authorEmail || '',
          refEntityType: c.refDecisionId ? 'decision' : null,
          refEntityId: c.refDecisionId ?? null,
          refEntityLabel: c.refDecisionTitle ?? null,
          legacyId: c.id,
          createdAt: new Date(c.createdAt),
        })
      }

      // Decision-level (selection) comments
      for (const decision of room.decisions || []) {
        for (const c of decision.comments || []) {
          if (existingIds.has(c.id)) continue
          // Skip system comments (empty authorEmail)
          if (!c.authorEmail) continue
          inserts.push({
            collectionId: coll.id,
            toolKey: 'finish_decisions',
            targetType: 'decision',
            targetId: decision.id,
            text: c.text,
            authorUserId: emailToId.get(c.authorEmail?.toLowerCase()) ?? null,
            authorName: c.authorName,
            authorEmail: c.authorEmail,
            refEntityType: c.refOptionId ? 'option' : null,
            refEntityId: c.refOptionId ?? null,
            refEntityLabel: c.refOptionLabel ?? null,
            legacyId: c.id,
            createdAt: new Date(c.createdAt),
          })
        }
      }
    }
  }

  // --- Mood Boards ---
  const mbCollections = await prisma.toolCollection.findMany({
    where: { toolKey: 'mood_boards' },
    select: { id: true, payload: true },
  })
  console.log(`Processing ${mbCollections.length} mood_boards collections...`)

  for (const coll of mbCollections) {
    const payload = coll.payload as { boards?: Array<{
      id: string
      comments?: MoodBoardComment[]
    }> }
    // mood_boards collections may have a single board or a boards array
    const boards = payload?.boards || []

    for (const board of boards) {
      for (const c of board.comments || []) {
        if (existingIds.has(c.id)) continue
        inserts.push({
          collectionId: coll.id,
          toolKey: 'mood_boards',
          targetType: 'board',
          targetId: board.id,
          text: c.text,
          authorUserId: emailToId.get(c.authorEmail?.toLowerCase()) ?? null,
          authorName: c.authorName,
          authorEmail: c.authorEmail || '',
          refEntityType: c.refIdeaId ? 'idea' : null,
          refEntityId: c.refIdeaId ?? null,
          refEntityLabel: c.refIdeaLabel ?? null,
          legacyId: c.id,
          createdAt: new Date(c.createdAt),
        })
      }
    }
  }

  // --- Punchlist ---
  const plCollections = await prisma.toolCollection.findMany({
    where: { toolKey: 'punchlist' },
    select: { id: true, payload: true },
  })
  console.log(`Processing ${plCollections.length} punchlist collections...`)

  for (const coll of plCollections) {
    const payload = coll.payload as { items?: Array<{
      id: string
      comments?: LegacyComment[]
    }> }
    if (!payload?.items) continue

    for (const item of payload.items) {
      for (const c of item.comments || []) {
        if (existingIds.has(c.id)) continue
        inserts.push({
          collectionId: coll.id,
          toolKey: 'punchlist',
          targetType: 'item',
          targetId: item.id,
          text: c.text,
          authorUserId: emailToId.get(c.authorEmail?.toLowerCase()) ?? null,
          authorName: c.authorName,
          authorEmail: c.authorEmail || '',
          refEntityType: null,
          refEntityId: null,
          refEntityLabel: null,
          legacyId: c.id,
          createdAt: new Date(c.createdAt),
        })
      }
    }
  }

  console.log(`\nTotal comments to migrate: ${inserts.length}`)

  if (DRY_RUN) {
    console.log('\nDRY RUN — no changes made.')
    // Show sample
    for (const ins of inserts.slice(0, 5)) {
      console.log(`  [${ins.toolKey}] ${ins.targetType}/${ins.targetId}: "${ins.text.slice(0, 50)}..." by ${ins.authorName}`)
    }
    if (inserts.length > 5) console.log(`  ... and ${inserts.length - 5} more`)
  } else if (inserts.length > 0) {
    // Batch insert in chunks of 100
    const CHUNK = 100
    let created = 0
    for (let i = 0; i < inserts.length; i += CHUNK) {
      const chunk = inserts.slice(i, i + CHUNK)
      const result = await prisma.comment.createMany({ data: chunk })
      created += result.count
      console.log(`  Inserted ${created}/${inserts.length}`)
    }
    console.log(`\nDone! Migrated ${created} comments.`)
  } else {
    console.log('\nNothing to migrate.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
