import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()
  const { vote, anonId } = body

  if (!vote || !['UP', 'DOWN'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })
  }

  const content = await prisma.content.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { id: true },
  })

  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const session = await auth()
  const userId = session?.user?.id ?? null

  if (userId) {
    // Authenticated user: upsert by (contentId, userId)
    await prisma.contentFeedback.upsert({
      where: {
        contentId_userId: { contentId: content.id, userId },
      },
      update: { vote },
      create: { contentId: content.id, vote, userId },
    })
  } else if (anonId) {
    // Anonymous: upsert by (contentId, anonId)
    await prisma.contentFeedback.upsert({
      where: {
        contentId_anonId: { contentId: content.id, anonId },
      },
      update: { vote },
      create: { contentId: content.id, vote, anonId },
    })
  } else {
    return NextResponse.json({ error: 'Missing identifier' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
