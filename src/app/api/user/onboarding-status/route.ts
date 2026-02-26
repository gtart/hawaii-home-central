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
    select: { hasSeenAppOnboarding: true, appOnboardingFocus: true },
  })

  return NextResponse.json({
    hasSeenAppOnboarding: user?.hasSeenAppOnboarding ?? false,
    appOnboardingFocus: user?.appOnboardingFocus ?? null,
  })
}
