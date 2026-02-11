import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/slug'

export async function GET() {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const collections = await prisma.collection.findMany({
    orderBy: { title: 'asc' },
    include: { _count: { select: { items: true } } },
  })

  return NextResponse.json(collections)
}

export async function POST(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, heroImageUrl, layout } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const slug = body.slug || generateSlug(title)

  const existing = await prisma.collection.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
  }

  const collection = await prisma.collection.create({
    data: {
      title,
      slug,
      description: description || null,
      heroImageUrl: heroImageUrl || null,
      layout: layout || 'TILES',
    },
  })

  return NextResponse.json({ id: collection.id, slug: collection.slug })
}
