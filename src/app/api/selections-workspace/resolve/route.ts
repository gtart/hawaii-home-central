import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrCreateSelectionsWorkspace, type SelectionsWorkspaceInfo } from '@/lib/selections-workspace'

/**
 * GET /api/selections-workspace/resolve?projectId=X
 *
 * Resolves the Selections workspace anchor for a project.
 * Auto-creates one if none exists.
 * Returns workspace info including multi-collection status.
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

  try {
    const info: SelectionsWorkspaceInfo = await getOrCreateSelectionsWorkspace(
      projectId,
      session.user.id
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
