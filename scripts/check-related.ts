import { prisma } from '../src/lib/prisma'

async function main() {
  // Get all content relations
  const relations = await prisma.contentRelation.findMany({
    include: {
      fromContent: { select: { id: true, title: true } },
      toContent: { select: { id: true, title: true } },
    },
    orderBy: { priority: 'asc' },
  })
  
  if (relations.length === 0) {
    console.log('NO ContentRelation records exist')
  } else {
    console.log(`Found ${relations.length} ContentRelation records:`)
    for (const r of relations) {
      console.log(`  FROM: ${r.fromContent.title.substring(0, 55)}`)
      console.log(`    TO: ${r.toContent.title.substring(0, 55)}`)
    }
  }
  
  // Get all articles with their tags
  const articles = await prisma.content.findMany({
    where: { contentType: 'GUIDE', status: 'PUBLISHED' },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { title: 'asc' },
  })
  
  console.log('\n=== All articles ===')
  for (const a of articles) {
    const primary = a.tags.filter(t => t.tag.isPrimary).map(t => t.tag.name)
    const secondary = a.tags.filter(t => !t.tag.isPrimary).map(t => t.tag.name)
    console.log(`[${a.id}]`)
    console.log(`  title: ${a.title.substring(0, 80)}`)
    console.log(`  primary: ${primary.join(', ')}`)
    if (secondary.length > 0) console.log(`  secondary: ${secondary.join(', ')}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
