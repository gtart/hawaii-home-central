import type { MetadataRoute } from 'next'

const BASE_URL = 'https://hawaiihomecentral.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/early-access`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },

    // Public playbook pages (deep content)
    { url: `${BASE_URL}/resources/playbooks/hold-points`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/resources/playbooks/fair-bid-checklist`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/resources/playbooks/responsibility-matrix`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Public tool landing pages (SEO)
    { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/tools/hold-points`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/tools/fair-bid-checklist`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/tools/responsibility-matrix`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Coming soon / lower priority
    { url: `${BASE_URL}/stories`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/directory`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
