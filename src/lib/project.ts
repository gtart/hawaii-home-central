import { prisma } from '@/lib/prisma'

/**
 * Ensures the user has a current project. If none exists,
 * creates a default "My Home" project, sets it as current,
 * and backfills existing ToolResults with the new projectId.
 *
 * Returns the current projectId.
 */
export async function ensureCurrentProject(userId: string): Promise<string> {
  // Fast path: user already has a current project
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentProjectId: true },
  })

  if (user.currentProjectId) {
    return user.currentProjectId
  }

  // Slow path: create default project + backfill (transactional)
  return await prisma.$transaction(async (tx) => {
    // Re-check inside transaction (race condition guard)
    const freshUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { currentProjectId: true },
    })

    if (freshUser.currentProjectId) {
      return freshUser.currentProjectId
    }

    const project = await tx.project.create({
      data: { userId, name: 'My Home' },
    })

    // Create ownership membership
    await tx.projectMember.create({
      data: { projectId: project.id, userId, role: 'OWNER' },
    })

    await tx.user.update({
      where: { id: userId },
      data: { currentProjectId: project.id },
    })

    // Backfill existing ToolResults for this user
    await tx.toolResult.updateMany({
      where: { userId, projectId: null },
      data: { projectId: project.id },
    })

    return project.id
  })
}
