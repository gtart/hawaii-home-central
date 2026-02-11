import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const page = Number(request.nextUrl.searchParams.get('page') || '1')
  const limit = 20

  // Aggregate thumbs per content
  const thumbs = await prisma.contentFeedback.groupBy({
    by: ['contentId', 'vote'],
    _count: true,
  })

  // Build a map: contentId -> { up, down }
  const thumbsMap = new Map<string, { up: number; down: number }>()
  for (const row of thumbs) {
    if (!thumbsMap.has(row.contentId)) {
      thumbsMap.set(row.contentId, { up: 0, down: 0 })
    }
    const entry = thumbsMap.get(row.contentId)!
    if (row.vote === 'UP') entry.up = row._count
    else entry.down = row._count
  }

  // Get content titles for aggregated feedback
  const contentIds = [...thumbsMap.keys()]
  const contents = await prisma.content.findMany({
    where: { id: { in: contentIds } },
    select: { id: true, title: true, slug: true, contentType: true },
  })

  const contentMap = new Map(contents.map((c) => [c.id, c]))

  const aggregated = contentIds
    .map((id) => ({
      content: contentMap.get(id),
      ...thumbsMap.get(id)!,
    }))
    .filter((a) => a.content)
    .sort((a, b) => b.up + b.down - (a.up + a.down))

  // Recent private feedback
  const privateFeedback = await prisma.contentPrivateFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      content: { select: { id: true, title: true, slug: true } },
    },
  })

  const totalPrivate = await prisma.contentPrivateFeedback.count()

  return NextResponse.json({
    aggregated,
    privateFeedback,
    totalPrivate,
    page,
    totalPages: Math.ceil(totalPrivate / limit),
  })
}
