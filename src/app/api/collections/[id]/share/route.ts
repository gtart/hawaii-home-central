import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess, MAX_COLLECTION_EDITORS } from '@/lib/collection-access'
import { sendInviteEmail } from '@/lib/email'
import { TOOL_LABELS } from '@/lib/tool-registry'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/collections/[id]/share
 * List members + pending invites. Project OWNER only.
 */
export async function GET(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can manage sharing' }, { status: 403 })
  }

  const [members, invites] = await Promise.all([
    prisma.toolCollectionMember.findMany({
      where: { collectionId: id },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.toolCollectionInvite.findMany({
      where: { collectionId: id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ members, invites })
}

/**
 * POST /api/collections/[id]/share
 * Invite a user to the collection. Project OWNER only.
 */
export async function POST(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can share collections' }, { status: 403 })
  }

  const body = await request.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = body.role === 'VIEWER' ? 'VIEWER' as const : 'EDITOR' as const

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  // Check editor limit
  if (role === 'EDITOR') {
    const editorCount = await prisma.toolCollectionMember.count({
      where: { collectionId: id, role: { in: ['EDITOR', 'OWNER'] } },
    })
    if (editorCount >= MAX_COLLECTION_EDITORS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_COLLECTION_EDITORS} editors reached` },
        { status: 400 }
      )
    }
  }

  // Check if user already has access
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const existingMember = await prisma.toolCollectionMember.findUnique({
      where: { collectionId_userId: { collectionId: id, userId: existingUser.id } },
    })
    if (existingMember) {
      return NextResponse.json({ error: 'User already has access' }, { status: 400 })
    }
  }

  // Check duplicate pending invite
  const existingInvite = await prisma.toolCollectionInvite.findFirst({
    where: { collectionId: id, email, status: 'PENDING' },
  })
  if (existingInvite) {
    return NextResponse.json({ error: 'Invite already sent' }, { status: 400 })
  }

  // Load collection for email context
  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    include: { project: { select: { name: true } } },
  })

  // If user exists, add directly as member + also make them a ProjectMember
  if (existingUser) {
    await prisma.toolCollectionMember.create({
      data: { collectionId: id, userId: existingUser.id, role },
    })

    // Ensure they're a project member
    if (collection) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: collection.projectId, userId: existingUser.id } },
        create: { projectId: collection.projectId, userId: existingUser.id, role: 'MEMBER' },
        update: {},
      })
    }

    return NextResponse.json({ success: true, addedDirectly: true })
  }

  // Auto-whitelist the invited email so they can sign in
  try {
    await prisma.earlyAccessAllowlist.upsert({
      where: { email },
      create: { email, addedBy: `invite:${session.user.id}` },
      update: {},
    })
  } catch {
    // Non-critical — may fail if model doesn't exist in edge cases
  }

  // Create invite for unknown email
  const invite = await prisma.toolCollectionInvite.create({
    data: {
      collectionId: id,
      email,
      role,
      invitedBy: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  // Send invite email with user-facing tool name
  try {
    const inviterName = session.user.name || session.user.email || 'Someone'
    const toolName = (collection?.toolKey ? TOOL_LABELS[collection.toolKey] : null) || 'a tool'
    const projectName = collection?.project?.name || 'their home'

    await sendInviteEmail({
      toEmail: email,
      inviterName,
      toolName,
      projectName,
      accessLevel: role === 'EDITOR' ? 'edit' : 'view',
      inviteLink: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || ''}/collection-invite/${invite.token}`,
    })
  } catch (e) {
    console.error('Failed to send collection invite email:', e)
  }

  return NextResponse.json({ success: true, inviteId: invite.id })
}

/**
 * DELETE /api/collections/[id]/share
 * Revoke access. Body: { userId } or { inviteId }. Project OWNER only.
 */
export async function DELETE(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can revoke access' }, { status: 403 })
  }

  const body = await request.json()

  if (body.userId) {
    await prisma.toolCollectionMember.deleteMany({
      where: { collectionId: id, userId: body.userId },
    })
    return NextResponse.json({ success: true })
  }

  if (body.inviteId) {
    await prisma.toolCollectionInvite.updateMany({
      where: { id: body.inviteId, collectionId: id, status: 'PENDING' },
      data: { status: 'REVOKED' },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'userId or inviteId required' }, { status: 400 })
}
