import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Collections' }

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { title: 'asc' },
    include: { _count: { select: { items: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-sandstone">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="px-3 py-1.5 bg-sandstone text-basalt rounded text-sm font-medium hover:bg-sandstone-light transition-colors"
        >
          + New Collection
        </Link>
      </div>

      <div className="bg-basalt-50 rounded-card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/10 text-cream/50">
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium w-32">Slug</th>
              <th className="text-left px-4 py-3 font-medium w-20">Items</th>
              <th className="text-left px-4 py-3 font-medium w-24">Layout</th>
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-cream/30">
                  No collections yet
                </td>
              </tr>
            ) : (
              collections.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-cream/5 hover:bg-cream/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/collections/${c.id}`}
                      className="text-cream hover:text-sandstone transition-colors font-medium"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-cream/40 text-xs font-mono">
                    {c.slug}
                  </td>
                  <td className="px-4 py-3 text-cream/50">{c._count.items}</td>
                  <td className="px-4 py-3 text-cream/40 text-xs">
                    {c.layout}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
