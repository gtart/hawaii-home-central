import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProperty } from '@/lib/property'

const VALID_TOOL_KEYS = [
  'hold_points',
  'fair_bid_checklist',
  'responsibility_matrix',
  'finish_decisions',
  'before_you_sign',
  'before_you_sign_notes',
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  if (!VALID_TOOL_KEYS.includes(toolKey)) {
    return NextResponse.json({ error: 'Invalid tool key' }, { status: 400 })
  }

  // Ensure user has a property (lazy init + backfill)
  await ensureCurrentProperty(session.user.id)

  const result = await prisma.toolResult.findUnique({
    where: {
      userId_toolKey: { userId: session.user.id, toolKey },
    },
    select: { payload: true, updatedAt: true },
  })

  return NextResponse.json({
    payload: result?.payload ?? null,
    updatedAt: result?.updatedAt ?? null,
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  if (!VALID_TOOL_KEYS.includes(toolKey)) {
    return NextResponse.json({ error: 'Invalid tool key' }, { status: 400 })
  }

  const body = await request.json()
  if (!body.payload || typeof body.payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Ensure user has a property (lazy init + backfill)
  const propertyId = await ensureCurrentProperty(session.user.id)

  await prisma.toolResult.upsert({
    where: {
      userId_toolKey: { userId: session.user.id, toolKey },
    },
    create: {
      userId: session.user.id,
      toolKey,
      propertyId,
      payload: body.payload,
    },
    update: {
      propertyId,
      payload: body.payload,
    },
  })

  return NextResponse.json({ success: true })
}
