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

  // Determine notes inclusion
  const settings = record.settings as Record<string, unknown>
  let includeNotes = settings?.includeNotes === true

  // Admin failsafe: override at render time
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  // Strip notes from payload if not included
  let payload = instance.payload as Record<string, unknown>
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
  })
}
