import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/slug'

export async function POST(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { rows } = body

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  // Fetch existing collection slugs for linking
  const collectionMap = new Map(
    (
      await prisma.collection.findMany({ select: { slug: true, id: true } })
    ).map((c) => [c.slug, c.id])
  )

  const results: { row: number; title: string; status: string; id?: string; error?: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const hasId = Boolean(row.id?.trim())

    try {
      const contentType = (row.contentType || 'GUIDE').toUpperCase()
      const status = (row.status || 'DRAFT').toUpperCase()
      const robotsNoIndex = row.robotsNoIndex?.toLowerCase() === 'true'

      const data = {
        title: row.title.trim(),
        contentType,
        status,
        dek: row.dek?.trim() || null,
        bodyMd: row.bodyMd || '',
        authorName: row.authorName?.trim() || null,
        publishAt: row.publishAt ? new Date(row.publishAt) : null,
        metaTitle: row.metaTitle?.trim() || null,
        metaDescription: row.metaDescription?.trim() || null,
        canonicalUrl: row.canonicalUrl?.trim() || null,
        ogImageUrl: row.ogImageUrl?.trim() || null,
        geoScope: row.geoScope?.toUpperCase() || null,
        geoPlace: row.geoPlace?.trim() || null,
        robotsNoIndex,
      }

      let contentId: string

      if (hasId) {
        // UPDATE existing article
        const id = row.id.trim()

        // If slug is provided and different, update it
        const slugData = row.slug?.trim() ? { slug: row.slug.trim() } : {}

        // Set publishedAt if transitioning to PUBLISHED
        const existing = await prisma.content.findUnique({
          where: { id },
          select: { status: true, publishedAt: true },
        })
        const publishedAt =
          status === 'PUBLISHED' && existing?.status !== 'PUBLISHED' && !existing?.publishedAt
            ? new Date()
            : undefined

        await prisma.content.update({
          where: { id },
          data: {
            ...data,
            ...slugData,
            ...(publishedAt ? { publishedAt } : {}),
          },
        })

        contentId = id

        // Sync tags: delete existing, re-create
        await prisma.contentTag.deleteMany({ where: { contentId: id } })

        // Sync collections: delete existing collection items for this content, re-create
        await prisma.collectionItem.deleteMany({ where: { contentId: id } })

        results.push({
          row: i + 1,
          title: row.title,
          status: 'updated',
          id,
        })
      } else {
        // CREATE new article
        let slug = row.slug?.trim()
        if (!slug) {
          slug = generateSlug(row.title)
        }

        // Ensure unique slug
        let finalSlug = slug
        let suffix = 2
        while (await prisma.content.findFirst({ where: { slug: finalSlug } })) {
          finalSlug = `${slug}-${suffix}`
          suffix++
        }

        const content = await prisma.content.create({
          data: {
            ...data,
            slug: finalSlug,
            publishedAt: status === 'PUBLISHED' ? new Date() : null,
          },
        })

        contentId = content.id

        results.push({
          row: i + 1,
          title: row.title,
          status: 'created',
          id: content.id,
        })
      }

      // Primary tags (shared for both create and update)
      const addedTagIds = new Set<string>()
      if (row.primaryTags) {
        const tagNames = row.primaryTags
          .split('|')
          .map((t: string) => t.trim())
          .filter(Boolean)

        for (const tagName of tagNames) {
          const tagSlug = generateSlug(tagName)
          const tag = await prisma.tag.upsert({
            where: { slug: tagSlug },
            create: { name: tagName, slug: tagSlug },
            update: {},
          })
          await prisma.$executeRaw`UPDATE "Tag" SET "isPrimary" = true WHERE id = ${tag.id}`
          await prisma.contentTag.create({
            data: { contentId, tagId: tag.id },
          })
          addedTagIds.add(tag.id)
        }
      }

      // Regular tags (shared for both create and update)
      if (row.tags) {
        const tagNames = row.tags
          .split('|')
          .map((t: string) => t.trim())
          .filter(Boolean)

        for (const tagName of tagNames) {
          const tagSlug = generateSlug(tagName)
          const tag = await prisma.tag.upsert({
            where: { slug: tagSlug },
            create: { name: tagName, slug: tagSlug },
            update: {},
          })
          if (!addedTagIds.has(tag.id)) {
            await prisma.contentTag.create({
              data: { contentId, tagId: tag.id },
            })
          }
        }
      }

      // Collections (shared for both create and update)
      if (row.collectionSlugs) {
        const colSlugs = row.collectionSlugs
          .split('|')
          .map((s: string) => s.trim())
          .filter(Boolean)

        let priority = 0
        for (const cs of colSlugs) {
          const colId = collectionMap.get(cs)
          if (colId) {
            await prisma.collectionItem.create({
              data: {
                collectionId: colId,
                contentId,
                priority: priority++,
              },
            })
          }
        }
      }
    } catch (err) {
      results.push({
        row: i + 1,
        title: row.title || `Row ${i + 1}`,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const summary = {
    total: results.length,
    created: results.filter((r) => r.status === 'created').length,
    updated: results.filter((r) => r.status === 'updated').length,
    errors: results.filter((r) => r.status === 'error').length,
  }

  return NextResponse.json({ results, summary })
}
