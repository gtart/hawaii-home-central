import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  const { id } = await params
  const item = await prisma.capturedItem.findUnique({ where: { id } })
  if (!item || item.projectId !== projectId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(item)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  const { id } = await params

  const item = await prisma.capturedItem.findUnique({ where: { id } })
  if (!item || item.projectId !== projectId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: {
    status?: 'UNSORTED' | 'SORTED' | 'DISMISSED'
    suggestedToolKey?: string | null
    suggestedCollectionId?: string | null
    note?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.suggestedToolKey !== undefined) data.suggestedToolKey = body.suggestedToolKey
  if (body.suggestedCollectionId !== undefined) data.suggestedCollectionId = body.suggestedCollectionId
  if (body.note !== undefined) data.note = typeof body.note === 'string' ? body.note.slice(0, 2000) : null

  const updated = await prisma.capturedItem.update({
    where: { id },
    data,
  })

  // Emit activity event for status changes (skip dismissed — low-value noise)
  if (body.status && body.status !== item.status && body.status !== 'DISMISSED') {
    const label = item.title || item.sourceUrl || 'item'
    writeActivityEvents([{
      projectId,
      toolKey: 'inbox',
      action: body.status === 'SORTED' ? 'sorted' : 'updated',
      summaryText: `${body.status === 'SORTED' ? 'Sorted' : 'Updated'} ${item.type.toLowerCase()}: "${label}"`,
      actorUserId: userId,
    }]).catch(() => {})
  }

  return NextResponse.json(updated)
}
