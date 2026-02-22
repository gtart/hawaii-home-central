import { prisma } from '@/lib/prisma'

/**
 * Resolves the user's current project.
 *
 * Logic:
 * 1. If currentProjectId points to an ACTIVE project → return it.
 * 2. If not, pick the first ACTIVE project → set as current, return it.
 * 3. If no ACTIVE projects exist:
 *    a. First time (hasBootstrappedProject=false): create "My Home", mark bootstrapped, return it.
 *    b. Already bootstrapped: return null (user intentionally deleted all).
 */
export async function resolveCurrentProject(userId: string): Promise<string | null> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentProjectId: true, hasBootstrappedProject: true },
  })

  // Check if current project is still valid (ACTIVE)
  if (user.currentProjectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: user.currentProjectId,
        status: 'ACTIVE',
        members: { some: { userId } },
      },
      select: { id: true },
    })
    if (project) return project.id
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

  // First-time bootstrap: create default project
  return await prisma.$transaction(async (tx) => {
    // Re-check inside transaction (race condition guard)
    const freshUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { hasBootstrappedProject: true },
    })

    if (freshUser.hasBootstrappedProject) return null

    const project = await tx.project.create({
      data: { userId, name: 'My Home' },
    })

    await tx.projectMember.create({
      data: { projectId: project.id, userId, role: 'OWNER' },
    })

    await tx.user.update({
      where: { id: userId },
      data: {
        currentProjectId: project.id,
        hasBootstrappedProject: true,
      },
    })

    // Backfill existing ToolResults for this user
    await tx.toolResult.updateMany({
      where: { userId, projectId: null },
      data: { projectId: project.id },
    })

    return project.id
  })
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
