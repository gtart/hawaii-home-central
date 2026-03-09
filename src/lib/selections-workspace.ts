import { prisma } from '@/lib/prisma'

/**
 * Workspace resolution result for Selections.
 *
 * The product model is "one Selections workspace per project."
 * Under the hood, a ToolCollection row serves as the persistence anchor.
 * This resolver hides that detail from callers.
 */
export interface SelectionsWorkspaceInfo {
  /** The ToolCollection ID used as the workspace anchor */
  workspaceCollectionId: string
  /** Whether the project has more than one active Selections collection */
  hasMultipleCollections: boolean
  /** Total count of active (non-archived) Selections collections */
  collectionCount: number
  /** If multiple exist, why we chose this one as the temporary primary */
  temporaryPrimaryReason: 'only_one' | 'most_recently_updated' | 'newly_created'
}

/**
 * Resolve or create the Selections workspace anchor for a project.
 *
 * Rules:
 * - 0 collections → auto-create one titled "Selections"
 * - 1 collection → use it
 * - 2+ collections → use the most recently updated; flag hasMultipleCollections
 *
 * This is a server-side utility. Do not call from client components.
 */
export async function getOrCreateSelectionsWorkspace(
  projectId: string,
  userId: string
): Promise<SelectionsWorkspaceInfo> {
  const collections = await prisma.toolCollection.findMany({
    where: {
      projectId,
      toolKey: 'finish_decisions',
      archivedAt: null,
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (collections.length === 0) {
    // Auto-create the workspace anchor
    const created = await prisma.toolCollection.create({
      data: {
        projectId,
        toolKey: 'finish_decisions',
        title: 'Selections',
        payload: { version: 4, selections: [] },
        createdByUserId: userId,
      },
    })

    return {
      workspaceCollectionId: created.id,
      hasMultipleCollections: false,
      collectionCount: 1,
      temporaryPrimaryReason: 'newly_created',
    }
  }

  if (collections.length === 1) {
    return {
      workspaceCollectionId: collections[0].id,
      hasMultipleCollections: false,
      collectionCount: 1,
      temporaryPrimaryReason: 'only_one',
    }
  }

  // Multiple collections — use the most recently updated as the temporary primary
  return {
    workspaceCollectionId: collections[0].id,
    hasMultipleCollections: true,
    collectionCount: collections.length,
    temporaryPrimaryReason: 'most_recently_updated',
  }
}

/**
 * Lightweight merge preview data for projects with multiple Selections collections.
 * Read-only — does not mutate anything.
 */
export interface MergePreviewCollection {
  id: string
  title: string
  selectionCount: number
  updatedAt: string
  isPrimary: boolean
}

export interface MergePreviewResult {
  collections: MergePreviewCollection[]
  totalSelections: number
}

/**
 * Build a merge preview showing what would happen if collections were combined.
 * Returns collection titles, selection counts, and which one is the current primary.
 */
export async function getSelectionsWorkspaceMergePreview(
  projectId: string,
  primaryCollectionId: string
): Promise<MergePreviewResult> {
  const collections = await prisma.toolCollection.findMany({
    where: {
      projectId,
      toolKey: 'finish_decisions',
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      payload: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  let totalSelections = 0

  const result: MergePreviewCollection[] = collections.map((c) => {
    const payload = c.payload as Record<string, unknown> | null
    const selections = Array.isArray((payload as any)?.selections)
      ? (payload as any).selections
      : []
    const count = selections.length
    totalSelections += count

    return {
      id: c.id,
      title: c.title,
      selectionCount: count,
      updatedAt: c.updatedAt.toISOString(),
      isPrimary: c.id === primaryCollectionId,
    }
  })

  return { collections: result, totalSelections }
}
