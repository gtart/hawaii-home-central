import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export async function GET() {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get primary tag IDs via raw SQL
  const primaryTagRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Tag" WHERE "isPrimary" = true
  `
  const primaryTagIds = new Set(primaryTagRows.map((t) => t.id))

  const content = await prisma.content.findMany({
    include: {
      tags: { include: { tag: true } },
      collectionItems: { include: { collection: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = content.map((c) => {
    const primaryNames: string[] = []
    const regularNames: string[] = []
    for (const ct of c.tags) {
      if (primaryTagIds.has(ct.tag.id)) {
        primaryNames.push(ct.tag.name)
      } else {
        regularNames.push(ct.tag.name)
      }
    }

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      contentType: c.contentType,
      status: c.status,
      dek: c.dek ?? '',
      authorName: c.authorName ?? '',
      bodyMd: c.bodyMd,
      primaryTags: primaryNames.join('|'),
      tags: regularNames.join('|'),
      collectionSlugs: c.collectionItems.map((ci) => ci.collection.slug).join('|'),
      publishAt: c.publishAt ? c.publishAt.toISOString() : '',
      metaTitle: c.metaTitle ?? '',
      metaDescription: c.metaDescription ?? '',
      canonicalUrl: c.canonicalUrl ?? '',
      ogImageUrl: c.ogImageUrl ?? '',
      geoScope: c.geoScope ?? '',
      geoPlace: c.geoPlace ?? '',
      robotsNoIndex: c.robotsNoIndex ? 'true' : 'false',
    }
  })

  const csv = Papa.unparse(rows)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=hhc-content-export.csv',
    },
  })
}
