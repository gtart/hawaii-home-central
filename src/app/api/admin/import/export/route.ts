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

  const content = await prisma.content.findMany({
    include: {
      tags: { include: { tag: true } },
      collectionItems: { include: { collection: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = content.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    contentType: c.contentType,
    status: c.status,
    dek: c.dek ?? '',
    authorName: c.authorName ?? '',
    bodyMd: c.bodyMd,
    tags: c.tags.map((ct) => ct.tag.name).join('|'),
    collectionSlugs: c.collectionItems.map((ci) => ci.collection.slug).join('|'),
    publishAt: c.publishAt ? c.publishAt.toISOString() : '',
    metaTitle: c.metaTitle ?? '',
    metaDescription: c.metaDescription ?? '',
    canonicalUrl: c.canonicalUrl ?? '',
    ogImageUrl: c.ogImageUrl ?? '',
    geoScope: c.geoScope ?? '',
    geoPlace: c.geoPlace ?? '',
    robotsNoIndex: c.robotsNoIndex ? 'true' : 'false',
  }))

  const csv = Papa.unparse(rows)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=hhc-content-export.csv',
    },
  })
}
