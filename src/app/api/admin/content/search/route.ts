import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get('q') ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const results = await prisma.content.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, title: true, contentType: true, slug: true },
    take: 20,
    orderBy: { title: 'asc' },
  })

  return NextResponse.json(results)
}
