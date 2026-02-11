import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | HHC Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  const { allowed } = await isAdmin(session)

  if (!allowed) {
    return (
      <div className="pt-32 pb-24 px-6 text-center">
        <h1 className="font-serif text-3xl text-sandstone mb-4">
          Not Authorized
        </h1>
        <p className="text-cream/60 text-sm">
          Your account does not have admin access.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-16 flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  )
}
