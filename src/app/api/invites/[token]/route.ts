import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getEditShareCount, MAX_EDIT_SHARES } from '@/lib/project-access'

type RouteParams = { params: Promise<{ token: string }> }

/** GET — view invite details (works pre-auth for invite preview) */
export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params

  const invite = await prisma.projectInvite.findUnique({
    where: { token },
    include: {
      project: { select: { name: true } },
      inviter: { select: { name: true, email: true } },
    },
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite is no longer valid', status: invite.status }, { status: 410 })
  }

  if (invite.expiresAt < new Date()) {
    // Mark as expired
    await prisma.projectInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    })
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  return NextResponse.json({
    projectName: invite.project.name,
    toolKey: invite.toolKey,
    level: invite.level,
    invitedBy: invite.inviter.name || invite.inviter.email,
    email: invite.email,
    expiresAt: invite.expiresAt,
  })
}

/** POST — accept invite (auth required, email must match) */
export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { token } = await params
  const userId = session.user.id
  const userEmail = session.user.email.toLowerCase()

  const invite = await prisma.projectInvite.findUnique({
    where: { token },
  })

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite is no longer valid' }, { status: 410 })
  }

  if (invite.expiresAt < new Date()) {
    await prisma.projectInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    })
    return NextResponse.json({ error: 'Invite has expired' }, { status: 410 })
  }

  // Email must match
  if (invite.email.toLowerCase() !== userEmail) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address' },
      { status: 403 }
    )
  }

  // Enforce share limit for EDIT
  if (invite.level === 'EDIT') {
    const editCount = await getEditShareCount(invite.projectId, invite.toolKey)
    if (editCount >= MAX_EDIT_SHARES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_EDIT_SHARES} edit collaborators reached` },
        { status: 409 }
      )
    }
  }

  // Accept invite in a transaction
  await prisma.$transaction(async (tx) => {
    // Create or update project membership
    await tx.projectMember.upsert({
      where: { projectId_userId: { projectId: invite.projectId, userId } },
      create: { projectId: invite.projectId, userId, role: 'MEMBER' },
      update: {}, // Don't downgrade OWNER to MEMBER
    })

    // Grant tool access
    await tx.projectToolAccess.upsert({
      where: {
        projectId_toolKey_userId: {
          projectId: invite.projectId,
          toolKey: invite.toolKey,
          userId,
        },
      },
      create: {
        projectId: invite.projectId,
        toolKey: invite.toolKey,
        userId,
        level: invite.level,
      },
      update: { level: invite.level },
    })

    // Mark invite as accepted
    await tx.projectInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    })
  })

  return NextResponse.json({
    success: true,
    projectId: invite.projectId,
    toolKey: invite.toolKey,
  })
}
