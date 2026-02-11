import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { ids, action } = body as { ids: string[]; action: string }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No items selected' }, { status: 400 })
  }

  if (!['PUBLISH', 'DRAFT', 'DELETE'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  let affected = 0

  if (action === 'PUBLISH') {
    const result = await prisma.content.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    affected = result.count
  } else if (action === 'DRAFT') {
    const result = await prisma.content.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DRAFT' },
    })
    affected = result.count
  } else if (action === 'DELETE') {
    const result = await prisma.content.deleteMany({
      where: { id: { in: ids } },
    })
    affected = result.count
  }

  return NextResponse.json({ affected })
}
