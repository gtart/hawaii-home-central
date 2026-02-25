import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { diffPack } from '@/lib/idea-pack-diff'
import { getIdeaPackByPackId } from '@/lib/idea-packs-db'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import type { KitAuthorType } from '@/data/finish-decisions'

function validatePack(pack: unknown): pack is FinishDecisionKit {
  if (!pack || typeof pack !== 'object') return false
  const p = pack as Record<string, unknown>
  if (typeof p.id !== 'string' || !p.id) return false
  if (typeof p.label !== 'string' || !p.label) return false
  if (!Array.isArray(p.decisions)) return false
  if (!Array.isArray(p.roomTypes)) return false
  for (const d of p.decisions) {
    if (typeof d !== 'object' || !d) return false
    if (typeof (d as Record<string, unknown>).title !== 'string') return false
    if (!Array.isArray((d as Record<string, unknown>).options)) return false
  }
  return true
}

export async function POST(request: Request) {
  const session = await auth()
  const { allowed } = await isAdmin(session)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { pack, confirm } = body as { pack: unknown; confirm?: boolean }

  if (!validatePack(pack)) {
    return NextResponse.json(
      { error: 'Invalid pack format. Must have id, label, roomTypes, and decisions array.' },
      { status: 400 }
    )
  }

  // Find existing pack by packId
  const existingRow = await getIdeaPackByPackId(pack.id)
  const existingKit: FinishDecisionKit | null = existingRow
    ? {
        id: existingRow.packId,
        label: existingRow.label,
        description: existingRow.description,
        author: existingRow.author.toLowerCase() as KitAuthorType,
        roomTypes: existingRow.roomTypes as FinishDecisionKit['roomTypes'],
        decisionTitles: (existingRow.decisions as unknown as { title: string }[]).map((d) => d.title),
        decisions: existingRow.decisions as unknown as FinishDecisionKit['decisions'],
      }
    : null

  const diff = diffPack(existingKit, pack)

  if (!confirm) {
    return NextResponse.json({ diff, existing: !!existingRow })
  }

  // Apply the import
  const author = (pack.author || 'hhc').toUpperCase() as 'HHC' | 'DESIGNER' | 'VENDOR'
  const data = {
    label: pack.label,
    description: pack.description || '',
    author,
    roomTypes: pack.roomTypes,
    decisions: pack.decisions as object[],
  }

  const result = await prisma.ideaPack.upsert({
    where: { packId: pack.id },
    create: {
      packId: pack.id,
      ...data,
      status: 'DRAFT',
      sortOrder: 0,
    },
    update: data,
  })

  return NextResponse.json({ diff, pack: result })
}
