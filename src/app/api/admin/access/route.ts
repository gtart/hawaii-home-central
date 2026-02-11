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
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await prisma.adminAllowlist.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const envList = (process.env.ADMIN_ALLOWLIST ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return NextResponse.json({ rows, envEmails: envList })
}

export async function POST(req: Request) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const email = (body.email ?? '').trim().toLowerCase()
  const role = body.role === 'EDITOR' ? 'EDITOR' : 'ADMIN'

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const existing = await prisma.adminAllowlist.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in allowlist' }, { status: 409 })
  }

  const row = await prisma.adminAllowlist.create({
    data: { email, role },
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

  await prisma.adminAllowlist.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, role } = body

  if (!id || !['ADMIN', 'EDITOR'].includes(role)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const row = await prisma.adminAllowlist.update({
    where: { id },
    data: { role },
  })

  return NextResponse.json(row)
}
