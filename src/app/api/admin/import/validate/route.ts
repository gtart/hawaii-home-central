import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

interface RowValidation {
  row: number
  title: string
  status: 'valid' | 'warning' | 'error'
  action: 'create' | 'update'
  messages: string[]
}

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

  // Fetch existing data for validation
  const existingSlugs = new Set(
    (await prisma.content.findMany({ select: { slug: true } })).map(
      (c) => c.slug
    )
  )
  const existingCollections = new Map(
    (
      await prisma.collection.findMany({ select: { slug: true, id: true } })
    ).map((c) => [c.slug, c.id])
  )

  // If any rows have IDs, batch-fetch to check they exist
  const rowIds = rows
    .map((r: Record<string, string>) => r.id?.trim())
    .filter(Boolean)
  const existingIds = new Set(
    rowIds.length > 0
      ? (
          await prisma.content.findMany({
            where: { id: { in: rowIds } },
            select: { id: true, slug: true },
          })
        ).map((c) => c.id)
      : []
  )
  // Also build a map of id → slug for existing content (to skip slug uniqueness for own slug)
  const idToSlug = new Map(
    rowIds.length > 0
      ? (
          await prisma.content.findMany({
            where: { id: { in: rowIds } },
            select: { id: true, slug: true },
          })
        ).map((c) => [c.id, c.slug])
      : []
  )

  const validContentTypes = ['GUIDE', 'STORY']
  const validStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED']
  const validGeoScopes = [
    'STATEWIDE',
    'OAHU',
    'MAUI',
    'KAUAI',
    'HAWAII_ISLAND',
    'LANAI',
    'MOLOKAI',
    'OTHER',
  ]

  const results: RowValidation[] = rows.map(
    (row: Record<string, string>, idx: number) => {
      const messages: string[] = []
      let status: 'valid' | 'warning' | 'error' = 'valid'
      const hasId = Boolean(row.id?.trim())
      const action: 'create' | 'update' = hasId ? 'update' : 'create'

      // For updates, verify the ID exists
      if (hasId && !existingIds.has(row.id.trim())) {
        messages.push(`Content with id "${row.id.trim()}" not found`)
        status = 'error'
      }

      // Required fields
      if (!row.title?.trim()) {
        messages.push('Missing title')
        status = 'error'
      }

      if (!row.contentType?.trim()) {
        messages.push('Missing contentType')
        status = 'error'
      } else if (!validContentTypes.includes(row.contentType.toUpperCase())) {
        messages.push(`Invalid contentType: ${row.contentType}`)
        status = 'error'
      }

      // Slug uniqueness — only check for creates, or updates changing to a different slug
      const slug = row.slug?.trim()
      if (slug && existingSlugs.has(slug)) {
        if (hasId) {
          // It's an update — only error if the slug belongs to a DIFFERENT article
          const ownSlug = idToSlug.get(row.id.trim())
          if (ownSlug !== slug) {
            messages.push(`Slug "${slug}" already used by another article`)
            status = 'error'
          }
        } else {
          messages.push(`Slug "${slug}" already exists`)
          status = 'error'
        }
      }

      // Status
      if (row.status && !validStatuses.includes(row.status.toUpperCase())) {
        messages.push(`Invalid status: ${row.status}`)
        status = 'error'
      }

      // Geo scope
      if (
        row.geoScope &&
        !validGeoScopes.includes(row.geoScope.toUpperCase())
      ) {
        messages.push(`Invalid geoScope: ${row.geoScope}`)
        status = status === 'error' ? 'error' : 'warning'
      }

      // Collections
      if (row.collectionSlugs) {
        const colSlugs = row.collectionSlugs.split('|').map((s: string) => s.trim())
        for (const cs of colSlugs) {
          if (cs && !existingCollections.has(cs)) {
            messages.push(`Collection "${cs}" not found`)
            status = status === 'error' ? 'error' : 'warning'
          }
        }
      }

      // publishAt date
      if (row.publishAt) {
        const d = new Date(row.publishAt)
        if (isNaN(d.getTime())) {
          messages.push(`Invalid publishAt date: ${row.publishAt}`)
          status = 'error'
        }
      }

      // robotsNoIndex
      if (
        row.robotsNoIndex &&
        !['true', 'false', ''].includes(row.robotsNoIndex.toLowerCase())
      ) {
        messages.push(`Invalid robotsNoIndex: ${row.robotsNoIndex}`)
        status = status === 'error' ? 'error' : 'warning'
      }

      // bodyMd
      if (!row.bodyMd?.trim()) {
        messages.push('Missing body content')
        status = status === 'error' ? 'error' : 'warning'
      }

      if (messages.length === 0) {
        messages.push(action === 'update' ? 'OK (update)' : 'OK (create)')
      }

      return {
        row: idx + 1,
        title: row.title || `(Row ${idx + 1})`,
        status,
        action,
        messages,
      }
    }
  )

  const summary = {
    total: results.length,
    valid: results.filter((r) => r.status === 'valid').length,
    warnings: results.filter((r) => r.status === 'warning').length,
    errors: results.filter((r) => r.status === 'error').length,
    creates: results.filter((r) => r.action === 'create').length,
    updates: results.filter((r) => r.action === 'update').length,
  }

  return NextResponse.json({ results, summary })
}
