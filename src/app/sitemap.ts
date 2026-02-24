import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = 'https://hawaiihomecentral.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()

  // Fetch published CMS content
  const published = await prisma.content.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      robotsNoIndex: false,
    },
    select: { slug: true, contentType: true, updatedAt: true },
  })

  const cmsGuides = published
    .filter((c) => c.contentType === 'GUIDE')
    .map((c) => ({
      url: `${BASE_URL}/hawaii-home-renovation/${c.slug}`,
      lastModified: c.updatedAt.toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  const cmsStories = published
    .filter((c) => c.contentType === 'STORY')
    .map((c) => ({
      url: `${BASE_URL}/stories/${c.slug}`,
      lastModified: c.updatedAt.toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  // Fetch published collections
  const collections = await prisma.collection.findMany({
    select: { slug: true, updatedAt: true },
  })

  const collectionEntries = collections.map((c) => ({
    url: `${BASE_URL}/hawaii-home-renovation/collections/${c.slug}`,
    lastModified: c.updatedAt.toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    // Core pages
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/early-access`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    // Legal
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },

    // Renovation Basics hub + guides
    { url: `${BASE_URL}/hawaii-home-renovation`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/resources/renovation-stages`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/resources/playbooks/fair-bid-checklist`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/resources/playbooks/responsibility-matrix`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...cmsGuides,
    ...collectionEntries,

    // Tools hub (marketing landing)
    { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },

    // Stories
    { url: `${BASE_URL}/stories`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    ...cmsStories,

    // Directory
    { url: `${BASE_URL}/directory`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
