import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

const VALID_TOOL_KEYS = new Set(TOOL_REGISTRY.map((t) => t.toolKey))

/** PUT /api/projects/active-tools — set which tools are active for the current project */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const toolKeys = Array.isArray(body.toolKeys) ? body.toolKeys : null

  if (!toolKeys || !toolKeys.every((k: unknown) => typeof k === 'string' && VALID_TOOL_KEYS.has(k as string))) {
    return NextResponse.json(
      { error: 'Invalid toolKeys. Must be an array of valid tool keys.' },
      { status: 400 }
    )
  }

  const projectId = await ensureCurrentProject(session.user.id)

  await prisma.project.update({
    where: { id: projectId },
    data: { activeToolKeys: toolKeys },
  })

  return NextResponse.json({ success: true, activeToolKeys: toolKeys })
}
