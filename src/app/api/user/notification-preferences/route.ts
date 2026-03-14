import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notifyOnMention: true, notifyDailyDigest: true },
  })

  return NextResponse.json({
    notifyOnMention: user?.notifyOnMention ?? true,
    notifyDailyDigest: user?.notifyDailyDigest ?? true,
  })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data: Record<string, boolean> = {}

  if (typeof body.notifyOnMention === 'boolean') {
    data.notifyOnMention = body.notifyOnMention
  }
  if (typeof body.notifyDailyDigest === 'boolean') {
    data.notifyDailyDigest = body.notifyDailyDigest
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  })

  return NextResponse.json({ success: true, ...data })
}
