import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const focus = typeof body.focus === 'string' ? body.focus.slice(0, 100) : null

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      hasSeenAppOnboarding: true,
      appOnboardingFocus: focus,
    },
  })

  return NextResponse.json({ success: true })
}
