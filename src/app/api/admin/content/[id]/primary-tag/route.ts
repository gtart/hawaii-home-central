import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/slug'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { primaryTagNames } = body as { primaryTagNames: string[] }

  if (!Array.isArray(primaryTagNames)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Get all primary tag IDs
  const allPrimaryTags = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Tag" WHERE "isPrimary" = true
  `
  const primaryTagIdSet = new Set(allPrimaryTags.map((t) => t.id))

  // Remove existing primary tag assignments for this content
  if (primaryTagIdSet.size > 0) {
    const primaryIds = [...primaryTagIdSet]
    await prisma.contentTag.deleteMany({
      where: {
        contentId: id,
        tagId: { in: primaryIds },
      },
    })
  }

  // Add new primary tag assignments
  for (const tagName of primaryTagNames) {
    const tagSlug = generateSlug(tagName)
    const tag = await prisma.tag.upsert({
      where: { slug: tagSlug },
      create: { slug: tagSlug, name: tagName.trim() },
      update: {},
    })
    await prisma.$executeRaw`UPDATE "Tag" SET "isPrimary" = true WHERE id = ${tag.id}`

    // Check if ContentTag already exists (from regular tags)
    const exists = await prisma.contentTag.findUnique({
      where: { contentId_tagId: { contentId: id, tagId: tag.id } },
    })
    if (!exists) {
      await prisma.contentTag.create({
        data: { contentId: id, tagId: tag.id },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
