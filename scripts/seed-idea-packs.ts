import { PrismaClient } from '@prisma/client'
import ideaPacks from '../src/data/idea-packs.json'
import defaultSelections from '../src/data/default-selections.json'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding idea packs...\n')

  for (const [idx, pack] of ideaPacks.entries()) {
    const author = pack.author.toUpperCase() as 'HHC' | 'DESIGNER' | 'VENDOR'

    await prisma.ideaPack.upsert({
      where: { packId: pack.id },
      create: {
        packId: pack.id,
        label: pack.label,
        description: pack.description,
        author,
        status: 'PUBLISHED',
        roomTypes: pack.roomTypes,
        decisions: pack.decisions as object[],
        sortOrder: idx,
      },
      update: {
        label: pack.label,
        description: pack.description,
        author,
        roomTypes: pack.roomTypes,
        decisions: pack.decisions as object[],
        sortOrder: idx,
      },
    })
    console.log(`  ✓ ${pack.label} (${pack.id})`)
  }

  console.log('\nSeeding default selections...\n')

  await prisma.siteSetting.upsert({
    where: { key: 'default_decisions_by_room_type' },
    create: {
      key: 'default_decisions_by_room_type',
      value: JSON.stringify(defaultSelections.decisionsByRoomType),
    },
    update: {
      value: JSON.stringify(defaultSelections.decisionsByRoomType),
    },
  })
  console.log('  ✓ default_decisions_by_room_type')

  await prisma.siteSetting.upsert({
    where: { key: 'selection_emoji_map' },
    create: {
      key: 'selection_emoji_map',
      value: JSON.stringify(defaultSelections.selectionEmojis),
    },
    update: {
      value: JSON.stringify(defaultSelections.selectionEmojis),
    },
  })
  console.log('  ✓ selection_emoji_map')

  console.log('\nDone!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
