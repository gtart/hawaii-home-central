import { prisma } from '@/lib/prisma'

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function ensureUniqueSlug(
  slug: string,
  existingId?: string
): Promise<string> {
  let candidate = slug
  let suffix = 2

  while (true) {
    const existing = await prisma.content.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })

    if (!existing || existing.id === existingId) return candidate
    candidate = `${slug}-${suffix}`
    suffix++
  }
}
