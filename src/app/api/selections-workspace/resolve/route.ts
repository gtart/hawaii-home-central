import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateSelectionsWorkspace, type SelectionsWorkspaceInfo } from '@/lib/selections-workspace'

/**
 * GET /api/selections-workspace/resolve?projectId=X
 *
 * Resolves the Selections workspace anchor for a project.
 * Auto-creates one if none exists.
 * Returns workspace info including multi-collection status.
 *
 * Access: requires project membership (or legacy project creator).
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  // Verify project access before resolving/creating workspace
  const userId = session.user.id
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  if (!member) {
    // Legacy repair: project creator without ProjectMember row
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })
    if (project?.userId !== userId) {
      return NextResponse.json({ error: 'Not a project member' }, { status: 403 })
    }
    // Auto-repair: create missing ProjectMember for project creator
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role: 'OWNER' },
      update: {},
    })
  }

  try {
    const info: SelectionsWorkspaceInfo = await getOrCreateSelectionsWorkspace(
      projectId,
      userId
    )
    return NextResponse.json(info)
  } catch (error) {
    console.error('Failed to resolve selections workspace:', error)
    return NextResponse.json(
      { error: 'Failed to resolve workspace' },
      { status: 500 }
    )
  }
}
