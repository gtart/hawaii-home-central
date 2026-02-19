import { prisma } from '@/lib/prisma'
import type { ProjectMember } from '@prisma/client'

/**
 * Verify user is a member of the project. Returns the membership row.
 * Throws a structured error object if not a member.
 */
export async function requireProjectMembership(
  userId: string,
  projectId: string
): Promise<ProjectMember> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  if (!member) {
    throw { status: 403, code: 'NOT_A_MEMBER', message: 'Not a member of this project' }
  }

  return member
}

/**
 * Verify user has the required access level for a tool within a project.
 *
 * - OWNER role gets implicit EDIT access to all tools (no access row needed).
 * - MEMBER role requires an explicit ProjectToolAccess row with sufficient level.
 * - VIEW requirement passes for VIEW or EDIT.
 * - EDIT requirement passes only for EDIT.
 */
export async function requireToolAccess(
  userId: string,
  projectId: string,
  toolKey: string,
  requiredLevel: 'VIEW' | 'EDIT'
): Promise<void> {
  const member = await requireProjectMembership(userId, projectId)

  // Owners have implicit EDIT on all tools
  if (member.role === 'OWNER') return

  const access = await prisma.projectToolAccess.findUnique({
    where: { projectId_toolKey_userId: { projectId, toolKey, userId } },
  })

  if (!access) {
    throw { status: 403, code: 'NO_TOOL_ACCESS', message: 'No access to this tool' }
  }

  // VIEW requirement is satisfied by VIEW or EDIT
  if (requiredLevel === 'VIEW') return

  // EDIT requirement is only satisfied by EDIT
  if (access.level !== 'EDIT') {
    throw { status: 403, code: 'VIEW_ONLY', message: 'View-only access to this tool' }
  }
}

/**
 * Count non-owner users with EDIT access to a specific tool in a project.
 * Used to enforce the max 3 share limit.
 */
export async function getEditShareCount(
  projectId: string,
  toolKey: string
): Promise<number> {
  return prisma.projectToolAccess.count({
    where: {
      projectId,
      toolKey,
      level: 'EDIT',
      user: {
        memberships: {
          some: { projectId, role: 'MEMBER' },
        },
      },
    },
  })
}

/** Maximum non-owner EDIT users per tool per project */
export const MAX_EDIT_SHARES = 3
