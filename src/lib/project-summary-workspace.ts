import { prisma } from '@/lib/prisma'

/**
 * Workspace resolution for Project Summary.
 *
 * Product model: one Project Summary per project.
 * Under the hood, a ToolCollection row serves as persistence.
 * This resolver hides that detail from callers.
 */
export interface ProjectSummaryWorkspaceInfo {
  /** The ToolCollection ID used as the workspace anchor */
  workspaceCollectionId: string
}

/**
 * Resolve or create the Project Summary workspace for a project.
 *
 * Rules:
 * - 0 collections → auto-create one titled "Project Summary"
 * - 1 collection → use it
 * - 2+ collections → use the most recently updated (shouldn't happen, but graceful)
 *
 * Server-side only. Do not call from client components.
 */
export async function getOrCreateProjectSummaryWorkspace(
  projectId: string,
  userId: string
): Promise<ProjectSummaryWorkspaceInfo> {
  const collections = await prisma.toolCollection.findMany({
    where: {
      projectId,
      toolKey: 'project_summary',
      archivedAt: null,
    },
    select: {
      id: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (collections.length === 0) {
    const created = await prisma.toolCollection.create({
      data: {
        projectId,
        toolKey: 'project_summary',
        title: 'Project Summary',
        payload: {
          version: 1,
          summary: { text: '', updated_at: new Date().toISOString() },
          documents: [],
          changes: [],
          openDecisions: [],
        },
        createdByUserId: userId,
      },
    })

    return { workspaceCollectionId: created.id }
  }

  return { workspaceCollectionId: collections[0].id }
}
