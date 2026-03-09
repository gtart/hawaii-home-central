import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSelectionsWorkspaceMergePreview } from '@/lib/selections-workspace'

/**
 * GET /api/selections-workspace/preview?projectId=X&primaryId=Y
 *
 * Read-only merge preview: returns info about all active Selections
 * collections for a project so the UI can show a merge preview.
 *
 * Does not mutate anything.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const primaryId = url.searchParams.get('primaryId')

  if (!projectId || !primaryId) {
    return NextResponse.json(
      { error: 'projectId and primaryId required' },
      { status: 400 }
    )
  }

  // Verify the user is a project member
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  })

  if (!member) {
    // Legacy repair check
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })
    if (project?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }
  }

  const preview = await getSelectionsWorkspaceMergePreview(projectId, primaryId)

  return NextResponse.json(preview)
}
