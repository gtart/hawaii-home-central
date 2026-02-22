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

  const [submissions, total] = await Promise.all([
    prisma.storySubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.storySubmission.count(),
  ])

  return NextResponse.json({
    submissions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  const { allowed, role } = await isAdmin(session)
  if (!allowed || role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  }

  await prisma.storySubmission.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
