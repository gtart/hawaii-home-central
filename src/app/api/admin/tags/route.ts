import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use raw query to avoid Prisma client cache issues with isPrimary field
  const tags = await prisma.$queryRaw<
    { id: string; slug: string; name: string; isPrimary: boolean }[]
  >`
    SELECT t.id, t.slug, t.name, t."isPrimary",
      (SELECT COUNT(*)::int FROM "ContentTag" ct WHERE ct."tagId" = t.id) as "contentCount"
    FROM "Tag" t
    ORDER BY t."isPrimary" DESC, t.name ASC
  `

  // Shape to match expected format
  return NextResponse.json(
    tags.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      isPrimary: t.isPrimary,
      _count: { contentTags: (t as Record<string, unknown>).contentCount as number },
    }))
  )
}

export async function PATCH(req: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, isPrimary } = body as { id: string; isPrimary: boolean }

  if (!id || typeof isPrimary !== 'boolean') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Use raw query to avoid Prisma client cache issues
  await prisma.$executeRaw`
    UPDATE "Tag" SET "isPrimary" = ${isPrimary} WHERE id = ${id}
  `

  return NextResponse.json({ id, isPrimary })
}
