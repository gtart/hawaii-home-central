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
  const pack = await prisma.ideaPack.findUnique({ where: { id } })
  if (!pack) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(pack)
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

  const pack = await prisma.ideaPack.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.author !== undefined && { author: body.author }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.roomTypes !== undefined && { roomTypes: body.roomTypes }),
      ...(body.decisions !== undefined && { decisions: body.decisions }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.packId !== undefined && { packId: body.packId }),
    },
  })

  return NextResponse.json(pack)
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
  await prisma.ideaPack.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
