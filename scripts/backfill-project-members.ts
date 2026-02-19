/**
 * One-time backfill: create ProjectMember(OWNER) rows for every existing
 * Project that doesn't already have one.
 *
 * Run with: npx tsx scripts/backfill-project-members.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find all projects that don't have an OWNER ProjectMember
  const projects = await prisma.project.findMany({
    select: { id: true, userId: true },
  })

  let created = 0
  let skipped = 0

  for (const project of projects) {
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: project.userId } },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: project.userId,
        role: 'OWNER',
      },
    })
    created++
  }

  console.log(`Done. Created ${created} ProjectMember(OWNER) rows. Skipped ${skipped} (already exist).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
