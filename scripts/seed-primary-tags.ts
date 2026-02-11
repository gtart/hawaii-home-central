import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRIMARY_TAGS = [
  'Getting Started',
  'Permits & Regulations',
  'Budgeting & Financing',
  'Finding Contractors',
  'Materials & Climate',
  'Kitchen & Bath',
  'Structural & Exterior',
  'Insurance & Warranties',
  'Maintenance',
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('Seeding primary tags...\n')

  for (const name of PRIMARY_TAGS) {
    const slug = generateSlug(name)

    // Use raw SQL to avoid Prisma client cache issues with isPrimary
    const existing = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Tag" WHERE slug = ${slug}
    `

    if (existing.length > 0) {
      // Ensure it's marked as primary
      await prisma.$executeRaw`
        UPDATE "Tag" SET "isPrimary" = true WHERE slug = ${slug}
      `
      console.log(`  ✓ ${name} (${slug}) — already exists, ensured isPrimary`)
    } else {
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 25)
      await prisma.$executeRaw`
        INSERT INTO "Tag" (id, slug, name, "isPrimary")
        VALUES (${id}, ${slug}, ${name}, true)
      `
      console.log(`  + ${name} (${slug}) — created`)
    }
  }

  console.log(`\nDone! ${PRIMARY_TAGS.length} primary tags seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
