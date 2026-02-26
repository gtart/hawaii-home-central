import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateShareToken, getReportSettings } from '@/lib/share-tokens'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string; token: string }> }
) {
  const { toolKey, token } = await params

  const record = await validateShareToken(token)
  if (!record || record.toolKey !== toolKey) {
    return NextResponse.json(
      { error: 'Invalid or expired link' },
      { status: 404 }
    )
  }

  // Load tool data
  const instance = await prisma.toolInstance.findUnique({
    where: {
      projectId_toolKey: {
        projectId: record.projectId,
        toolKey,
      },
    },
    select: { payload: true },
  })

  if (!instance) {
    return NextResponse.json(
      { error: 'No data found' },
      { status: 404 }
    )
  }

  // Determine notes inclusion and filters
  const settings = record.settings as Record<string, unknown>
  let includeNotes = settings?.includeNotes === true
  const filterLocations: string[] = Array.isArray(settings?.locations) ? (settings.locations as string[]) : []
  const filterAssignees: string[] = Array.isArray(settings?.assignees) ? (settings.assignees as string[]) : []

  // Admin failsafe: override at render time
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  // Mood boards: filter to a single board if boardId is set
  const boardId = typeof settings?.boardId === 'string' ? (settings.boardId as string) : null
  let payload = instance.payload as Record<string, unknown>

  if (toolKey === 'mood_boards' && boardId && Array.isArray(payload?.boards)) {
    const boards = payload.boards as Record<string, unknown>[]
    const targetBoard = boards.find((b) => b.id === boardId)
    if (!targetBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }
    // Return just the single board in the payload
    payload = { ...payload, boards: [targetBoard] }
  }

  // Apply location/assignee filters to payload (punchlist-specific)
  if (Array.isArray(payload?.items) && (filterLocations.length > 0 || filterAssignees.length > 0)) {
    payload = {
      ...payload,
      items: (payload.items as Record<string, unknown>[]).filter((item) =>
        (filterLocations.length === 0 || filterLocations.includes(item.location as string)) &&
        (filterAssignees.length === 0 || filterAssignees.includes(item.assigneeLabel as string))
      ),
    }
  }

  // Strip notes from payload if not included (punchlist-specific)
  if (!includeNotes && payload && Array.isArray(payload.items)) {
    payload = {
      ...payload,
      items: (payload.items as Record<string, unknown>[]).map((item) => {
        const { notes, ...rest } = item
        return rest
      }),
    }
  }

  return NextResponse.json({
    payload,
    projectName: record.project.name,
    toolKey,
    includeNotes,
    boardId,
    filters: { locations: filterLocations, assignees: filterAssignees },
  })
}
