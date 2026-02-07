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
    select: { newsletterOptIn: true },
  })

  return NextResponse.json({ optedIn: user?.newsletterOptIn ?? false })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const optIn = Boolean(body.optIn)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      newsletterOptIn: optIn,
      ...(optIn
        ? { newsletterOptInAt: new Date() }
        : { newsletterUnsubscribedAt: new Date() }),
    },
  })

  return NextResponse.json({ success: true, optedIn: optIn })
}
