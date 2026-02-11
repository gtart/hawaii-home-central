import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ pinned: 'desc' }, { priority: 'asc' }],
        include: {
          content: {
            select: { id: true, title: true, contentType: true, slug: true, status: true },
          },
        },
      },
    },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(collection)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { title, slug, description, heroImageUrl, layout, items } = body

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description: description || null }),
      ...(heroImageUrl !== undefined && { heroImageUrl: heroImageUrl || null }),
      ...(layout !== undefined && { layout }),
    },
  })

  // Sync items if provided
  if (items !== undefined) {
    await prisma.collectionItem.deleteMany({ where: { collectionId: id } })
    if (items.length > 0) {
      await prisma.collectionItem.createMany({
        data: items.map(
          (item: { contentId: string; priority: number; pinned?: boolean }) => ({
            collectionId: id,
            contentId: item.contentId,
            priority: item.priority,
            pinned: item.pinned ?? false,
          })
        ),
      })
    }
  }

  return NextResponse.json({ id: collection.id })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.collection.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
