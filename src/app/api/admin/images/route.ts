import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function GET(request: NextRequest) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contentId = request.nextUrl.searchParams.get('contentId')

  const images = await prisma.contentImage.findMany({
    where: contentId ? { contentId } : {},
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(images)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const image = await prisma.contentImage.findUnique({ where: { id } })
  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete from Vercel Blob
  try {
    await del(image.url)
  } catch {
    // Blob may already be deleted, continue
  }

  await prisma.contentImage.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
