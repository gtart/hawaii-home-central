import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { generateSlug, ensureUniqueSlug } from '@/lib/slug'
import type { ContentType, ContentStatus } from '@prisma/client'

export async function GET(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get('type') as ContentType | null
  const status = url.searchParams.get('status') as ContentStatus | null
  const search = url.searchParams.get('search')

  const where: Record<string, unknown> = {}
  if (type) where.contentType = type
  if (status) where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ]
  }

  const items = await prisma.content.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      contentType: true,
      status: true,
      publishAt: true,
      publishedAt: true,
      updatedAt: true,
      primaryCollection: { select: { title: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  })

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    title,
    contentType,
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
    collectionIds,
    relatedIds,
  } = body

  if (!title || !contentType || !bodyMd) {
    return NextResponse.json(
      { error: 'title, contentType, and bodyMd are required' },
      { status: 400 }
    )
  }

  const rawSlug = body.slug || generateSlug(title)
  const slug = await ensureUniqueSlug(rawSlug)

  const content = await prisma.content.create({
    data: {
      title,
      slug,
      contentType,
      dek: dek || null,
      bodyMd,
      status: status || 'DRAFT',
      publishAt: publishAt ? new Date(publishAt) : null,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      authorName: authorName || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImageUrl: ogImageUrl || null,
      geoScope: geoScope || null,
      geoPlace: geoPlace || null,
      robotsNoIndex: robotsNoIndex ?? false,
      primaryCollectionId: primaryCollectionId || null,
      tags: tags?.length
        ? {
            create: tags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { slug: generateSlug(tagName) },
                  create: { slug: generateSlug(tagName), name: tagName.trim() },
                },
              },
            })),
          }
        : undefined,
      collectionItems: collectionIds?.length
        ? {
            create: collectionIds.map((cid: string, i: number) => ({
              collectionId: cid,
              priority: i,
            })),
          }
        : undefined,
      relationsFrom: relatedIds?.length
        ? {
            create: relatedIds.map((rid: string, i: number) => ({
              toContentId: rid,
              priority: i,
            })),
          }
        : undefined,
    },
  })

  return NextResponse.json({ id: content.id, slug: content.slug })
}
