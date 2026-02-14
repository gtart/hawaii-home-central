import { prisma } from '@/lib/prisma'

/**
 * Ensures the user has a current property. If none exists,
 * creates a default "My Home" property, sets it as current,
 * and backfills existing ToolResults with the new propertyId.
 *
 * Returns the current propertyId.
 */
export async function ensureCurrentProperty(userId: string): Promise<string> {
  // Fast path: user already has a current property
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentPropertyId: true },
  })

  if (user.currentPropertyId) {
    return user.currentPropertyId
  }

  // Slow path: create default property + backfill (transactional)
  return await prisma.$transaction(async (tx) => {
    // Re-check inside transaction (race condition guard)
    const freshUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { currentPropertyId: true },
    })

    if (freshUser.currentPropertyId) {
      return freshUser.currentPropertyId
    }

    const property = await tx.property.create({
      data: { userId, name: 'My Home' },
    })

    await tx.user.update({
      where: { id: userId },
      data: { currentPropertyId: property.id },
    })

    // Backfill existing ToolResults for this user
    await tx.toolResult.updateMany({
      where: { userId, propertyId: null },
      data: { propertyId: property.id },
    })

    return property.id
  })
}
