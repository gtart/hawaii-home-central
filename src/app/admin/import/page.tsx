import type { Metadata } from 'next'
import { ImportWizard } from '@/components/admin/ImportWizard'

export const metadata: Metadata = {
  title: 'Import / Export',
  robots: { index: false, follow: false },
}

export default function AdminImportPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl text-sandstone mb-6">Import / Export</h1>
      <ImportWizard />
    </div>
  )
}
