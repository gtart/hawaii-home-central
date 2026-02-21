import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { isEmailAllowlisted } from '@/lib/earlyAccess'

export async function GET(request: NextRequest) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const page = Number(request.nextUrl.searchParams.get('page') || '1')
  const limit = 20

  const [signups, total, dbAllowlist] = await Promise.all([
    prisma.earlyAccessSignup.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.earlyAccessSignup.count(),
    prisma.earlyAccessAllowlist.findMany({ select: { email: true } }),
  ])

  const dbAllowedEmails = new Set(dbAllowlist.map((r) => r.email))

  const signupsWithStatus = signups.map((s) => ({
    ...s,
    isAllowed: isEmailAllowlisted(s.email) || dbAllowedEmails.has(s.email),
  }))

  return NextResponse.json({
    signups: signupsWithStatus,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  const { allowed, role } = await isAdmin(session)
  if (!allowed || role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  }

  await prisma.earlyAccessSignup.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
