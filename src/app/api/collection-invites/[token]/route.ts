import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ token: string }> }

/**
 * GET /api/collection-invites/[token]
 * Preview invite details (no auth required).
 */
export async function GET(request: Request, { params }: Params) {
  const { token } = await params

  const invite = await prisma.toolCollectionInvite.findUnique({
    where: { token },
    include: {
      collection: {
        select: {
          title: true,
          toolKey: true,
          project: { select: { name: true } },
        },
      },
      inviter: { select: { name: true } },
    },
  })

  if (!invite || invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    collectionTitle: invite.collection.title,
    toolKey: invite.collection.toolKey,
    projectName: invite.collection.project.name,
    inviterName: invite.inviter.name,
    expiresAt: invite.expiresAt,
  })
}

/**
 * POST /api/collection-invites/[token]
 * Accept invite. Requires auth and email match.
 */
export async function POST(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params

  const invite = await prisma.toolCollectionInvite.findUnique({
    where: { token },
    include: {
      collection: { select: { id: true, projectId: true } },
    },
  })

  if (!invite || invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 })
  }

  if (invite.expiresAt < new Date()) {
    await prisma.toolCollectionInvite.update({
      where: { token },
      data: { status: 'EXPIRED' },
    })
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  // Email match check
  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'Email mismatch — sign in with the invited email address' },
      { status: 403 }
    )
  }

  const userId = session.user.id

  // Create collection membership
  await prisma.toolCollectionMember.upsert({
    where: {
      collectionId_userId: { collectionId: invite.collection.id, userId },
    },
    create: {
      collectionId: invite.collection.id,
      userId,
      role: invite.role,
    },
    update: { role: invite.role },
  })

  // Ensure project membership
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: invite.collection.projectId, userId },
    },
    create: {
      projectId: invite.collection.projectId,
      userId,
      role: 'MEMBER',
    },
    update: {},
  })

  // Mark invite as accepted
  await prisma.toolCollectionInvite.update({
    where: { token },
    data: { status: 'ACCEPTED' },
  })

  return NextResponse.json({
    success: true,
    collectionId: invite.collection.id,
    projectId: invite.collection.projectId,
  })
}
