import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { getDefaultDecisionsByRoomType, getSelectionEmojiMap } from '@/lib/default-selections-db'

export async function GET() {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [decisionsByRoomType, emojiMap] = await Promise.all([
    getDefaultDecisionsByRoomType(),
    getSelectionEmojiMap(),
  ])

  return NextResponse.json({ decisionsByRoomType, emojiMap })
}

export async function PUT(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { decisionsByRoomType, emojiMap } = body

  if (decisionsByRoomType) {
    await prisma.siteSetting.upsert({
      where: { key: 'default_decisions_by_room_type' },
      create: {
        key: 'default_decisions_by_room_type',
        value: JSON.stringify(decisionsByRoomType),
      },
      update: {
        value: JSON.stringify(decisionsByRoomType),
      },
    })
  }

  if (emojiMap) {
    await prisma.siteSetting.upsert({
      where: { key: 'selection_emoji_map' },
      create: {
        key: 'selection_emoji_map',
        value: JSON.stringify(emojiMap),
      },
      update: {
        value: JSON.stringify(emojiMap),
      },
    })
  }

  return NextResponse.json({ success: true })
}
