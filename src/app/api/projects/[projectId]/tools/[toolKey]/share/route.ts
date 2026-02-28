import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectMembership, getEditShareCount, MAX_EDIT_SHARES } from '@/lib/project-access'
import { sendInviteEmail } from '@/lib/email'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

type RouteParams = { params: Promise<{ projectId: string; toolKey: string }> }

/** GET — list current access + pending invites for a tool */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, toolKey } = await params
  const userId = session.user.id

  // Only owners can view sharing settings
  let member
  try {
    member = await requireProjectMembership(userId, projectId)
  } catch {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  if (member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only the project owner can manage sharing' }, { status: 403 })
  }

  // Get current access grants
  const access = await prisma.projectToolAccess.findMany({
    where: { projectId, toolKey },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Get pending invites (include token so owner can re-copy the invite link)
  const invites = await prisma.projectInvite.findMany({
    where: { projectId, toolKey, status: 'PENDING' },
    select: {
      id: true,
      email: true,
      level: true,
      status: true,
      token: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const editShareCount = await getEditShareCount(projectId, toolKey)

  return NextResponse.json({
    access: access.map((a) => ({
      id: a.id,
      userId: a.user.id,
      name: a.user.name,
      email: a.user.email,
      image: a.user.image,
      level: a.level,
      createdAt: a.createdAt,
    })),
    invites,
    editShareCount,
    maxEditShares: MAX_EDIT_SHARES,
  })
}

/** POST — create an invite for this tool */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, toolKey } = await params
  const userId = session.user.id

  // Only owners can invite
  let member
  try {
    member = await requireProjectMembership(userId, projectId)
  } catch {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  if (member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only the project owner can share tools' }, { status: 403 })
  }

  const body = await request.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const level = body.level === 'VIEW' ? 'VIEW' : 'EDIT'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  // Don't invite yourself
  if (email === session.user.email?.toLowerCase()) {
    return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 })
  }

  // Check if user already has access
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const existingAccess = await prisma.projectToolAccess.findUnique({
      where: { projectId_toolKey_userId: { projectId, toolKey, userId: existingUser.id } },
    })
    if (existingAccess) {
      return NextResponse.json({ error: 'This person already has access to this tool' }, { status: 409 })
    }
  }

  // Check for pending invite to same email for same tool
  const existingInvite = await prisma.projectInvite.findFirst({
    where: { projectId, toolKey, email, status: 'PENDING' },
  })
  if (existingInvite) {
    return NextResponse.json({ error: 'An invite is already pending for this email' }, { status: 409 })
  }

  // Enforce share limit for EDIT level
  if (level === 'EDIT') {
    const editCount = await getEditShareCount(projectId, toolKey)
    // Also count pending EDIT invites toward the limit
    const pendingEditInvites = await prisma.projectInvite.count({
      where: { projectId, toolKey, level: 'EDIT', status: 'PENDING' },
    })
    if (editCount + pendingEditInvites >= MAX_EDIT_SHARES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_EDIT_SHARES} edit collaborators reached` },
        { status: 409 }
      )
    }
  }

  // Create invite (expires in 7 days)
  const invite = await prisma.projectInvite.create({
    data: {
      projectId,
      toolKey,
      email,
      level: level as 'VIEW' | 'EDIT',
      invitedBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Auto-activate the tool on the project if owner has a custom active-tools list
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { activeToolKeys: true },
    })
    if (project && project.activeToolKeys.length > 0 && !project.activeToolKeys.includes(toolKey)) {
      await prisma.project.update({
        where: { id: projectId },
        data: { activeToolKeys: [...project.activeToolKeys, toolKey] },
      })
    }
  } catch {
    // non-blocking
  }

  // Auto-whitelist the invited email so they can sign in (REQUIRE_WHITELIST mode)
  try {
    await prisma.earlyAccessAllowlist.upsert({
      where: { email },
      create: { email, addedBy: `invite:${userId}` },
      update: {},
    })
  } catch (e) {
    console.error('[share] Auto-whitelist failed (non-blocking):', e)
  }

  // Send invite email (fire-and-forget — never blocks response)
  const toolEntry = TOOL_REGISTRY.find((t) => t.toolKey === toolKey)
  const toolName = toolEntry?.title || toolKey

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  })

  const inviterName = session.user.name || session.user.email || 'Someone'
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'https://www.hawaiihomecentral.com'
  const inviteLink = `${baseUrl}/invite/${invite.token}`

  sendInviteEmail({
    toEmail: email,
    inviterName,
    toolName,
    accessLevel: level === 'EDIT' ? 'edit' : 'view',
    projectName: project?.name || 'a project',
    inviteLink,
  }).catch((err) => {
    console.error('[share] Email send failed (non-blocking):', err)
  })

  return NextResponse.json({
    invite: {
      id: invite.id,
      token: invite.token,
      email: invite.email,
      level: invite.level,
      expiresAt: invite.expiresAt,
    },
    emailQueued: !!process.env.RESEND_API_KEY,
  })
}

/** DELETE — revoke access or cancel invite */
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, toolKey } = await params
  const userId = session.user.id

  // Only owners can revoke
  let member
  try {
    member = await requireProjectMembership(userId, projectId)
  } catch {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  if (member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only the project owner can revoke access' }, { status: 403 })
  }

  const body = await request.json()

  // Revoke user access
  if (body.userId) {
    await prisma.projectToolAccess.deleteMany({
      where: { projectId, toolKey, userId: body.userId },
    })

    // If user has no other tool access in this project, remove membership too
    const remainingAccess = await prisma.projectToolAccess.count({
      where: { projectId, userId: body.userId },
    })
    if (remainingAccess === 0) {
      await prisma.projectMember.deleteMany({
        where: { projectId, userId: body.userId, role: 'MEMBER' },
      })
    }

    return NextResponse.json({ success: true })
  }

  // Cancel invite
  if (body.inviteId) {
    await prisma.projectInvite.updateMany({
      where: { id: body.inviteId, projectId, toolKey, status: 'PENDING' },
      data: { status: 'REVOKED' },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Must provide userId or inviteId' }, { status: 400 })
}
