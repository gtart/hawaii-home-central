import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

async function guardAdmin() {
  const session = await auth()
  const { allowed, role } = await isAdmin(session)
  if (!allowed || role !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await guardAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await prisma.earlyAccessAllowlist.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Env-var allowlisted emails (shown separately, can't be removed)
  const envList = (process.env.EARLY_ACCESS_ALLOWLIST ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return NextResponse.json({ rows, envEmails: envList })
}

export async function POST(req: Request) {
  const session = await guardAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const email = (body.email ?? '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const existing = await prisma.earlyAccessAllowlist.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in allowlist' }, { status: 409 })
  }

  const row = await prisma.earlyAccessAllowlist.create({
    data: {
      email,
      addedBy: session.user?.email ?? null,
    },
  })

  return NextResponse.json(row, { status: 201 })
}

export async function DELETE(req: Request) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await prisma.earlyAccessAllowlist.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
