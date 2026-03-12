import { prisma } from '@/lib/prisma'

/**
 * Resolves the user's current project.
 *
 * Logic:
 * 1. If currentProjectId points to an ACTIVE project → return it.
 * 2. If not, pick the first ACTIVE project → set as current, return it.
 * 3. If no ACTIVE projects exist:
 *    a. First time (hasBootstrappedProject=false): atomically claim the
 *       bootstrap slot, then create "My Home". Concurrent calls that lose
 *       the race retry once to find the newly created project.
 *    b. Already bootstrapped: return null (user intentionally deleted all).
 */
export async function resolveCurrentProject(userId: string): Promise<string | null> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentProjectId: true, hasBootstrappedProject: true },
  })

  // Check if current project is still valid (ACTIVE)
  // Accept both ProjectMember-based and legacy userId-based ownership.
  if (user.currentProjectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: user.currentProjectId,
        status: 'ACTIVE',
        OR: [
          { members: { some: { userId } } },
          { userId },
        ],
      },
      select: { id: true, userId: true },
    })
    if (project) {
      // Legacy repair: backfill ProjectMember if user owns via project.userId but has no member row
      if (project.userId === userId) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId } },
          create: { projectId: project.id, userId, role: 'OWNER' },
          update: {},
        })
      }
      return project.id
    }
  }

  // currentProjectId is missing or points to a non-ACTIVE project.
  // Try to fall back to any ACTIVE project the user is a member of.
  const fallback = await prisma.projectMember.findFirst({
    where: {
      userId,
      project: { status: 'ACTIVE' },
    },
    select: { projectId: true },
    orderBy: { project: { createdAt: 'asc' } },
  })

  if (fallback) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentProjectId: fallback.projectId },
    })
    return fallback.projectId
  }

  // Legacy ownership fallback: check for projects where user is the creator
  // (project.userId) but has no ProjectMember row yet.
  const legacyOwned = await prisma.project.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  if (legacyOwned) {
    // Backfill the missing ProjectMember row
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: legacyOwned.id, userId } },
      create: { projectId: legacyOwned.id, userId, role: 'OWNER' },
      update: {},
    })
    await prisma.user.update({
      where: { id: userId },
      data: { currentProjectId: legacyOwned.id, hasBootstrappedProject: true },
    })
    return legacyOwned.id
  }

  // No ACTIVE projects at all.
  if (user.hasBootstrappedProject) {
    // User has been bootstrapped before — they intentionally have 0 projects.
    if (user.currentProjectId) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentProjectId: null },
      })
    }
    return null
  }

  // First-time bootstrap: atomically claim the slot using updateMany with a
  // WHERE guard. Only ONE concurrent call will succeed (count === 1).
  const claimed = await prisma.user.updateMany({
    where: { id: userId, hasBootstrappedProject: false },
    data: { hasBootstrappedProject: true },
  })

  if (claimed.count === 0) {
    // Another concurrent call already claimed the bootstrap slot.
    // Wait briefly and re-check for the newly created project.
    await new Promise((r) => setTimeout(r, 300))
    // Check both ProjectMember and legacy ownership
    const retry = await prisma.projectMember.findFirst({
      where: { userId, project: { status: 'ACTIVE' } },
      select: { projectId: true },
      orderBy: { project: { createdAt: 'asc' } },
    })
    if (!retry) {
      const retryLegacy = await prisma.project.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (retryLegacy) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: retryLegacy.id, userId } },
          create: { projectId: retryLegacy.id, userId, role: 'OWNER' },
          update: {},
        })
        await prisma.user.update({
          where: { id: userId },
          data: { currentProjectId: retryLegacy.id },
        })
        return retryLegacy.id
      }
    }
    if (retry) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentProjectId: retry.projectId },
      })
      return retry.projectId
    }
    return null
  }

  // We won the race — create the default project.
  const project = await prisma.project.create({
    data: { userId, name: 'My Home' },
  })

  await prisma.projectMember.create({
    data: { projectId: project.id, userId, role: 'OWNER' },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { currentProjectId: project.id },
  })

  // Backfill existing ToolResults for this user
  await prisma.toolResult.updateMany({
    where: { userId, projectId: null },
    data: { projectId: project.id },
  })

  return project.id
}

/**
 * @deprecated Use resolveCurrentProject instead.
 * Kept for backward compat — calls resolveCurrentProject
 * and throws if null.
 */
export async function ensureCurrentProject(userId: string): Promise<string> {
  const projectId = await resolveCurrentProject(userId)
  if (!projectId) {
    throw new Error('No active projects')
  }
  return projectId
}
