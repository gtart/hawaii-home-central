import { prisma } from '@/lib/prisma'

export type CollectionAccessLevel = 'OWNER' | 'EDITOR' | 'VIEWER'

/**
 * Resolve effective access level for a user on a collection.
 * Returns null if no access.
 *
 * Priority:
 * 1. Project OWNER → OWNER
 * 2. ToolCollectionMember → mapped role
 * 3. Legacy repair: if user is project creator, upsert ProjectMember OWNER
 * 4. null
 */
export async function resolveCollectionAccess(
  userId: string,
  collectionId: string
): Promise<CollectionAccessLevel | null> {
  const collection = await prisma.toolCollection.findUnique({
    where: { id: collectionId },
    select: {
      projectId: true,
      project: { select: { userId: true } },
    },
  })
  if (!collection) return null

  // Check ProjectMember
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: collection.projectId, userId } },
  })

  if (member?.role === 'OWNER') return 'OWNER'

  // Check collection-level membership
  const collMember = await prisma.toolCollectionMember.findUnique({
    where: { collectionId_userId: { collectionId, userId } },
  })
  if (collMember) {
    return collMember.role as CollectionAccessLevel
  }

  // Legacy repair: project creator without ProjectMember row
  if (collection.project.userId === userId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: collection.projectId, userId } },
      create: { projectId: collection.projectId, userId, role: 'OWNER' },
      update: {},
    })
    return 'OWNER'
  }

  // If member but no collection-level access
  if (member) return null

  return null
}

/**
 * Throwing wrapper: 403 if user doesn't have required access level.
 */
export async function requireCollectionAccess(
  userId: string,
  collectionId: string,
  level: 'VIEWER' | 'EDITOR'
): Promise<CollectionAccessLevel> {
  const access = await resolveCollectionAccess(userId, collectionId)
  if (!access) {
    throw { status: 403, code: 'NO_COLLECTION_ACCESS', message: 'No access to this collection' }
  }

  if (level === 'VIEWER') return access

  // EDITOR required — VIEWER is insufficient
  if (access === 'VIEWER') {
    throw { status: 403, code: 'VIEW_ONLY', message: 'View-only access to this collection' }
  }

  return access
}

/**
 * Validate a collection share token. Returns null if invalid/revoked/expired.
 */
export async function validateCollectionShareToken(token: string) {
  const record = await prisma.toolCollectionShareToken.findUnique({
    where: { token },
    include: {
      collection: {
        include: {
          project: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!record) return null
  if (record.revokedAt) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null

  return record
}

/**
 * Check if user can list collections for a project+tool.
 */
export async function canListCollections(
  userId: string,
  projectId: string
): Promise<boolean> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (member) return true

  // Legacy repair
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  })
  if (project?.userId === userId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role: 'OWNER' },
      update: {},
    })
    return true
  }

  return false
}

/**
 * Count editors (EDITOR + OWNER) on a collection.
 */
export async function getCollectionEditCount(collectionId: string): Promise<number> {
  return prisma.toolCollectionMember.count({
    where: {
      collectionId,
      role: { in: ['EDITOR', 'OWNER'] },
    },
  })
}

/** Maximum non-owner collaborators per collection */
export const MAX_COLLECTION_EDITORS = 10
