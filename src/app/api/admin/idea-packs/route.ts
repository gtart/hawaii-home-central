import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import type { IdeaPackStatus } from '@prisma/client'

export async function GET(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status') as IdeaPackStatus | null

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const packs = await prisma.ideaPack.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  })

  return NextResponse.json(packs)
}

export async function POST(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { packId, label, description, author, status, roomTypes, decisions, sortOrder } = body

  if (!packId || !label) {
    return NextResponse.json({ error: 'packId and label are required' }, { status: 400 })
  }

  const existing = await prisma.ideaPack.findUnique({ where: { packId } })
  if (existing) {
    return NextResponse.json({ error: `Pack with id "${packId}" already exists` }, { status: 409 })
  }

  const pack = await prisma.ideaPack.create({
    data: {
      packId,
      label,
      description: description || '',
      author: author || 'HHC',
      status: status || 'DRAFT',
      roomTypes: roomTypes || [],
      decisions: decisions || [],
      sortOrder: sortOrder ?? 0,
    },
  })

  return NextResponse.json(pack, { status: 201 })
}
