import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tags = await prisma.tag.findMany({
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { contentTags: true } },
    },
  })

  return NextResponse.json(tags)
}

export async function PATCH(req: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, isPrimary } = body as { id: string; isPrimary: boolean }

  if (!id || typeof isPrimary !== 'boolean') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: { isPrimary },
  })

  return NextResponse.json(tag)
}
