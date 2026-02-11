import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { generateSlug, ensureUniqueSlug } from '@/lib/slug'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      collectionItems: { include: { collection: true } },
      images: { orderBy: { createdAt: 'desc' } },
      relationsFrom: {
        orderBy: { priority: 'asc' },
        include: {
          toContent: {
            select: { id: true, title: true, contentType: true, slug: true },
          },
        },
      },
      primaryCollection: true,
    },
  })

  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(content)
}

export async function PUT(
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

  const {
    title,
    dek,
    bodyMd,
    status,
    publishAt,
    authorName,
    metaTitle,
    metaDescription,
    canonicalUrl,
    ogImageUrl,
    geoScope,
    geoPlace,
    robotsNoIndex,
    primaryCollectionId,
    tags,
    primaryTags,
    collectionIds,
    relatedIds,
  } = body

  // Handle slug
  let slug = body.slug
  if (slug) {
    slug = await ensureUniqueSlug(slug, id)
  }

  // Check if transitioning to PUBLISHED
  const existing = await prisma.content.findUnique({
    where: { id },
    select: { status: true, publishedAt: true },
  })
  const isPublishing =
    status === 'PUBLISHED' && existing?.status !== 'PUBLISHED'
  const publishedAt = isPublishing
    ? new Date()
    : existing?.publishedAt ?? null

  // Update content
  const content = await prisma.content.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug && { slug }),
      ...(dek !== undefined && { dek: dek || null }),
      ...(bodyMd !== undefined && { bodyMd }),
      ...(status !== undefined && { status }),
      ...(publishAt !== undefined && {
        publishAt: publishAt ? new Date(publishAt) : null,
      }),
      publishedAt,
      ...(authorName !== undefined && { authorName: authorName || null }),
      ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
      ...(metaDescription !== undefined && {
        metaDescription: metaDescription || null,
      }),
      ...(canonicalUrl !== undefined && { canonicalUrl: canonicalUrl || null }),
      ...(ogImageUrl !== undefined && { ogImageUrl: ogImageUrl || null }),
      ...(geoScope !== undefined && { geoScope: geoScope || null }),
      ...(geoPlace !== undefined && { geoPlace: geoPlace || null }),
      ...(robotsNoIndex !== undefined && { robotsNoIndex }),
      ...(primaryCollectionId !== undefined && {
        primaryCollectionId: primaryCollectionId || null,
      }),
    },
  })

  // Sync tags (primary + regular)
  if (tags !== undefined || primaryTags !== undefined) {
    await prisma.contentTag.deleteMany({ where: { contentId: id } })

    const addedTagIds = new Set<string>()

    // Primary tags first
    if (primaryTags?.length) {
      for (const tagName of primaryTags as string[]) {
        const tagSlug = generateSlug(tagName)
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          create: { slug: tagSlug, name: tagName.trim() },
          update: {},
        })
        await prisma.$executeRaw`UPDATE "Tag" SET "isPrimary" = true WHERE id = ${tag.id}`
        await prisma.contentTag.create({
          data: { contentId: id, tagId: tag.id },
        })
        addedTagIds.add(tag.id)
      }
    }

    // Regular tags
    if (tags?.length) {
      for (const tagName of tags as string[]) {
        const tagSlug = generateSlug(tagName)
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          create: { slug: tagSlug, name: tagName.trim() },
          update: {},
        })
        if (!addedTagIds.has(tag.id)) {
          await prisma.contentTag.create({
            data: { contentId: id, tagId: tag.id },
          })
          addedTagIds.add(tag.id)
        }
      }
    }
  }

  // Sync collections
  if (collectionIds !== undefined) {
    await prisma.collectionItem.deleteMany({ where: { contentId: id } })
    if (collectionIds.length > 0) {
      await prisma.collectionItem.createMany({
        data: (collectionIds as string[]).map((cid, i) => ({
          contentId: id,
          collectionId: cid,
          priority: i,
        })),
      })
    }
  }

  // Sync related
  if (relatedIds !== undefined) {
    await prisma.contentRelation.deleteMany({
      where: { fromContentId: id },
    })
    if (relatedIds.length > 0) {
      await prisma.contentRelation.createMany({
        data: (relatedIds as string[]).map((rid, i) => ({
          fromContentId: id,
          toContentId: rid,
          priority: i,
        })),
      })
    }
  }

  return NextResponse.json({ id: content.id, slug: content.slug })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  await prisma.content.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
